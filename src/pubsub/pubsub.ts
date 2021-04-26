import * as WebSocket from 'ws';
import { AccessToken, ClientCredentials, ModuleOptions, Token } from 'simple-oauth2';
import { getCurrentSettings } from '../settings/settings';
import { MessageTypes, PubSubRequest, PubSubRequestBody } from './pubsub.models';

// https://dev.twitch.tv/docs/pubsub
// https://dev.twitch.tv/docs/authentication/getting-tokens-oauth

const pingInterval = 3 * 60e3;
let ws: WebSocket;
// let lastPong: Date;

let pingTimerRef: NodeJS.Timeout;

let tokenClient: ClientCredentials;
let currentToken: AccessToken;

async function ensureToken() {
    // get the token
    const { identity } = getCurrentSettings();
    const config: ModuleOptions = {
        client: {
            id: identity.clientId,
            secret: identity.clientSecret,
        },
        auth: {
            tokenHost: 'https://id.twitch.tv/',
            tokenPath: 'oauth2/token',
        },
        options: {
            authorizationMethod: 'body'
        }
    };
    tokenClient = new ClientCredentials(config);

    currentToken = await tokenClient.getToken({
        scope: 'bits:read'
    }, { json: true });

    console.log(currentToken);
}

async function getToken() {
    if (currentToken.expired()) {
        currentToken = await currentToken.refresh();
    }
    return currentToken;
}

async function start() {
    ws = new WebSocket('wss://pubsub-edge.twitch.tv');

    await ensureToken();

    // let resolve: () => void;
    // let reject: (err: Error) => void;

    // const prom = new Promise((res, rej) => {
    //     resolve = res as any;
    //     reject = rej;
    // });

    // ws.on('open', () => {

    // console.log('Connected to pubsub');

    // clearInterval(pingTimerRef);

    pingTimerRef = setInterval(() => {

        sendSimple('PING');

        setTimeout(pongCheck, 30e3);

    }, pingInterval);

    //     resolve();
    // });

    ws.on('close', () => {
        clearInterval(pingTimerRef);
    });

    ws.on('message', onMessage);

    sendSimple('PING');

}

function onMessage(data: string) {
    const message = JSON.parse(data);
    console.log(data, message);
}

function pongCheck() { }

function sendSimple(type: MessageTypes) {
    ws.send(JSON.stringify({ type }));
}

async function sendMessage(type: MessageTypes, body: PubSubRequestBody) {
    const token = await getToken();
    const request: PubSubRequest = {
        type,
        data: {
            ...body,
            auth_token: token.token.access_token,
        }
    };

    console.log(request);
    ws.send(JSON.stringify(request));
}

export default {
    start,
    sendMessage,
};
