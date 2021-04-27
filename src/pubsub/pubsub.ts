import axios, { AxiosError } from 'axios';
import { randomBytes } from 'crypto';
import { Observable, Subject } from 'rxjs';
import { filter, map, take, takeWhile } from 'rxjs/operators';
import { logError, logMuted, logSuccess } from '../utils/log';
import * as WebSocket from 'ws';
import { getCurrentSettings, saveSettings } from '../settings/settings';
import { PromWrap, tryAwait, wait } from '../utils/utils';
import {
    MessageTypes, PubSubBasicRequest, PubSubEventMessage,
    PubSubEvents, PubSubEventTypes, PubSubRequest, PubSubRequestBody,
    PubSubResponse, TokenRefreshResponse, TwitchAuthToken
} from './pubsub.models';

// https://dev.twitch.tv/docs/pubsub
// https://dev.twitch.tv/docs/authentication/getting-tokens-oauth
// https://twitchtokengenerator.com/

const expectedScopes = [
    'bits:read',
    'channel:read:redemptions',
    'channel:read:subscriptions',
];

const eventMapping: {
    prefix: string;
    type: PubSubEventTypes;
}[] = [
        {
            prefix: 'channel-bits-events-v2',
            type: 'bits',
        },
        {
            prefix: 'channel-points-channel-v1',
            type: 'points',
        },
        {
            prefix: 'channel-subscribe-events-v1',
            type: 'sub',
        }
    ];

const PING_INTERVAL = 3 * 60e3;
const PONG_TIMEOUT = 30e3;

class PubSubClient {

    public readonly events$: Observable<PubSubEvents>;

    private isConnected = false;
    private lastPong = 0;
    private pingTimerRef: NodeJS.Timeout;
    private authToken: TwitchAuthToken;

    private ws: WebSocket;
    private readonly messages$ = new Subject<PubSubResponse>();

    constructor() {
        this.events$ = this.messages$.pipe(
            filter(message => message.type === 'MESSAGE'),
            map((message: PubSubEventMessage) => {

                const { data } = message;
                const mapping = eventMapping.find(o => data.topic.startsWith(o.prefix));
                if (!mapping) {
                    return null;
                }

                const parsedMessage = JSON.parse(data.message);

                return {
                    ...parsedMessage,

                    // ensure that this type goes last,
                    // as the points message also includes
                    // a root-level `type` property for some stupid reason
                    type: mapping.type,
                } as PubSubEvents;

            }),
            filter(message => message !== null),
        );

    }

    public async connect() {
        await this.validateToken(true);

        this.ws = new WebSocket('wss://pubsub-edge.twitch.tv');

        this.ws.on('message', (data: string) => {

            const message: PubSubResponse = JSON.parse(data);

            if (message.type === 'PONG') {
                if (!this.isConnected) {
                    // first pong
                    logSuccess(`Connected to PubSub`);
                }

                this.isConnected = true;
                this.lastPong = Date.now();
                return;
            } else if (message.type === 'RECONNECT') {
                logMuted('We are being requested to reconnect');
                this.reconnect();
                return;
            }

            this.messages$.next(message);

        });

        this.pingTimerRef = setInterval(() => {

            this.internalSendBasic({ type: 'PING' });

            setTimeout(() => { this.pongCheck(); }, PONG_TIMEOUT);

        }, PING_INTERVAL);

        this.ws.on('close', () => {
            clearInterval(this.pingTimerRef);
            this.isConnected = false;
        });

        this.ws.on('open', () => {
            this.internalSendBasic({ type: 'PING' });
        });

    }

    public async disconnect() {
        this.isConnected = false;
        clearInterval(this.pingTimerRef);
        this.ws?.close();
        await this.stopListening().catch(() => { /* no-op */ });
    }

    private reconnect() {
        this.isConnected = false;
        clearInterval(this.pingTimerRef);
        this.connect();
    }

    private pongCheck() {
        const since = Date.now() - this.lastPong;
        if (since > PONG_TIMEOUT) {
            this.reconnect();
        }

    }

    private async refreshToken() {
        const { pubsub } = getCurrentSettings();

        const [] = await tryAwait(() => {
            // don't care if this fails or succeeds
            // try to kill the current auth token when refreshing
            return axios.get(`https://twitchtokengenerator.com/api/revoke/${pubsub.authToken}`);
        });

        return axios.get<TokenRefreshResponse>(`https://twitchtokengenerator.com/api/refresh/${pubsub.refreshToken}`)
            .then(response => {
                if (!response.data.success) {
                    logError(`Failed to refresh token`, response.data);
                    return;
                }
                pubsub.authToken = response.data.token;
                saveSettings(true);
                logMuted('Refreshed PubSub auth token');
            });

    }

    private async validateToken(retry: boolean) {
        const { pubsub } = getCurrentSettings();

        const [err, res] = await tryAwait(() => {
            return axios.get<TwitchAuthToken>('https://id.twitch.tv/oauth2/validate', {
                headers: {
                    'Authorization': `Bearer ${pubsub.authToken}`
                }
            });
        });

        const shouldRefresh = retry === true
            && ((err as AxiosError)?.response?.status === 401
                || res?.data.expires_in !== 0);

        if (shouldRefresh) {

            this.authToken = null;

            logError(`PubSub auth token expired, refreshing`);

            const [refreshError] = await tryAwait(() => {
                return this.refreshToken();
            });

            if (!refreshError) {
                await this.validateToken(false);
            }

        }

        if (res) {
            this.authToken = {
                ...res.data,
                token: pubsub.authToken,
            };
        }

    }

    private internalSendBasic(basic: PubSubBasicRequest) {
        this.ws.send(JSON.stringify(basic));
    }

    private async sendMessage(type: MessageTypes, body: PubSubRequestBody) {
        let waitCount = 0;
        while (!this.isConnected) {
            if (waitCount++ > 20) {
                return Promise.reject('PubSub connect timeout');
            }
            await wait(100);
        }

        const nonce = randomBytes(16).toString('hex');
        const request: PubSubRequest = {
            type,
            nonce,
            data: {
                auth_token: this.authToken.token,
                ...body,
            }
        };

        const wrap = new PromWrap();

        this.ws.send(JSON.stringify(request), err => err && wrap.reject(err));

        this.messages$.pipe(
            filter(m => m.type === 'RESPONSE' && m.nonce === nonce),
            takeWhile(() => wrap.hasBeenRejected === false),
            take(1),
        ).subscribe(message => {
            if (message.error) {
                wrap.reject(new Error(message.error));
            } else {
                wrap.resolve();
            }
        });

        return wrap.toPromise();
    }

    public async startListening() {
        if (!this.authToken) {
            logError(`No AuthToken, cannot connect to PubSub`);
            return;
        }
        const { user_id } = this.authToken;
        await this.sendMessage('LISTEN', {
            topics: eventMapping.map(o => `${o.prefix}.${user_id}`)
        });
    }

    public async stopListening() {
        if (!this.authToken) {
            return;
        }
        const { user_id } = this.authToken;
        await this.sendMessage('UNLISTEN', {
            topics: eventMapping.map(o => `${o.prefix}.${user_id}`)
        }).catch(() => { /* no-op */ });
    }

}

let client: PubSubClient;

export default {
    getClient: () => {
        if (!client) {
            client = new PubSubClient();
        }
        return client;
    },

    stop: async () => {
        if (!client) {
            return;
        }

        return client.disconnect().catch(() => { /* */ });
    }

};
