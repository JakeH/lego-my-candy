import * as WebSocket from 'ws';

// https://dev.twitch.tv/docs/pubsub
// https://dev.twitch.tv/docs/authentication/getting-tokens-oauth

const pingInterval = 3 * 60e3;
let ws: WebSocket;
// let lastPong: Date;

let pingTimerRef: NodeJS.Timeout;

async function start() {
    ws = new WebSocket('wss://pubsub-edge.twitch.tv');

    let resolve: () => void;
    let reject: (err: Error) => void;

    const prom = new Promise((res, rej) => {
        resolve = res as any;
        reject = rej;
    });

    ws.on('open', () => {

        resolve();

        console.log('Connected to pubsub');

        clearInterval(pingTimerRef);

        pingTimerRef = setInterval(() => {
            ws.send({
                type: 'PING',
            });

            setTimeout(pongCheck, 30e3);

        }, pingInterval);
    });

    ws.on('close', () => {
        clearInterval(pingTimerRef);
    });

    ws.on('message', onMessage);

    return prom;
}

function onMessage(data: string) {
    const message = JSON.parse(data);
    console.log(data, message);
}

function pongCheck() { }

export default {
    start,

    send: (data: any) => {
        ws.send(JSON.stringify(data));
    }
};
