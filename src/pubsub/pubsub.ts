import * as WebSocket from 'ws';
import { AccessToken, ClientCredentials, ModuleOptions, Token } from 'simple-oauth2';
import { getCurrentSettings } from '../settings/settings';
import { MessageTypes, PubSubBasicRequest, PubSubEventMessage, PubSubEvents, PubSubEventTypes, PubSubRequest, PubSubRequestBody, PubSubResponse } from './pubsub.models';
import { randomBytes } from 'crypto';
import { Observable, Subject } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';

// https://dev.twitch.tv/docs/pubsub
// https://dev.twitch.tv/docs/authentication/getting-tokens-oauth
// https://twitchtokengenerator.com/

const expectedScopes = [
    'bits:read',
    'channel:read:redemptions',
    'channel:read:subscriptions',
];

/**
 * 
 * Token validity
 * Token refresh
 * Ping / Pong / reconnect
 * Listener
 * 
 */

const eventMapping: {
    prefix: string;
    type: PubSubEventTypes;
}[] = [
        {
            prefix: 'channel-bits-events-v2',
            type: 'bits',
        }
    ];

class PromWrap<T = void> {

    private _resolve: (value: T) => void;
    private _reject: (error: Error) => void;

    private _promise: Promise<T>;

    constructor() {
        this._promise = new Promise<T>((res, rej) => {
            this._resolve = res;
            this._reject = rej;
        });
    }

    public resolve(value: T) {
        this._resolve(value);
    }

    public reject(error: Error) {
        this._reject(error);
    }

    public toPromise(): Promise<T> {
        return this._promise;
    }
}

class PubSubClient {

    private ws: WebSocket;
    private outgoingQueue;

    private isConnected = false;
    private hasListener = false;
    private lastPong = 0;
    private pingTimerRef: NodeJS.Timeout;

    public readonly events$: Observable<PubSubEvents>;

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
                    type: mapping.type,
                    ...parsedMessage,
                } as PubSubEvents;

                return null;
            }),
            filter(message => message !== null),
        );
    }

    private connect() {

        ws.on('message', (data: string) => {

            const message: PubSubResponse = JSON.parse(data);

            this.messages$.next(message);

        });
    }

    private reconnect() {

    }

    private internalSendBasic(basic: PubSubBasicRequest) {

    }

    public sendMessage(type: MessageTypes, body: PubSubRequestBody) {
        const nonce = randomBytes(16).toString('hex');
        const request: PubSubRequest = {
            type,
            nonce,
            data: {
                auth_token: '',
                ...body,
            }
        };

        const wrap = new PromWrap();

        ws.send(JSON.stringify(request), wrap.reject);

        this.messages$.pipe(
            filter(m => m.type === 'RESPONSE' && m.nonce === nonce),
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

}

const pingInterval = 3 * 60e3;
const pongTimeout = 30e3;
let lastPong = 0;
let ws: WebSocket;

let pingTimerRef: NodeJS.Timeout;

const hasListener = false;

async function start() {
    await connect();
}

async function connect() {
    ws = new WebSocket('wss://pubsub-edge.twitch.tv');

    pingTimerRef = setInterval(() => {

        sendSimple('PING');

        setTimeout(pongCheck, pongTimeout);

    }, pingInterval);

    ws.on('close', () => {
        clearInterval(pingTimerRef);
    });

    ws.on('message', onMessage);

    ws.on('open', () => {
        sendSimple('PING');
    });
}

async function reconnect() {
    clearInterval(pingInterval);
    if (ws) {
        ws.close();
        ws = null;
    }

    connect();
}

function onMessage(data: string) {
    const message: PubSubResponse = JSON.parse(data);

    if (message.type === 'PONG') {
        lastPong = Date.now();
    }

    console.log(data, message);
}

function pongCheck() {
    const since = Date.now() - lastPong;
    if (since > pongTimeout) {
        reconnect();
    }
}

function sendSimple(type: MessageTypes) {
    ws.send(JSON.stringify({ type }));
}

async function sendMessage(type: MessageTypes, body: PubSubRequestBody) {
    const request: PubSubRequest = {
        type,
        data: {
            ...body,
            auth_token: 'bp03hi607w4fc57yq3le6ytqzn7wa9',
        }
    };

    console.log(request);
    ws.send(JSON.stringify(request));
}

export default {
    start,
    sendMessage,

};
