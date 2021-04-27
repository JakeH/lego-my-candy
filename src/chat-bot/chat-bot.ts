import { Subject } from 'rxjs';
import { getCurrentSettings } from '../settings/settings';
import {
    ChatUserstate,
    Client,
    client as tmiClient,
    Options as tmiOptions
} from 'tmi.js';
import { AllEventTypes } from './chat-bot.models';
import { logMuted } from '../utils/log';
import { PromWrap } from '../utils/utils';

let hostChannel = '';
let client: Client;

const events$ = new Subject<AllEventTypes>();

function createTMIClient(): Promise<void> {

    const { channel, identity } = getCurrentSettings();
    const { clientId, username, password } = identity;

    hostChannel = channel;

    const opts: tmiOptions = {
        connection: {
            reconnect: true,
            secure: true,
        },
        channels: [
            channel,
        ],
        identity: {
            username,
            password,
        },
        options: {
            clientId,
        }
    };
    client = new tmiClient(opts);

    // client.on('raw_message', event => console.log(event));

    // register our event handlers
    client.on('message', onMessageHandler);
    client.on('redeem', onRedeemHandler);
    client.on('cheer', onCheerHandler);
    client.on('join', onJoinHandler);
    client.on('part', onPartHandler);

    const prom = new PromWrap();

    client.on('connected', () => {
        prom.resolve();
        logMuted(`Chat bot connected to '${hostChannel}'`);
    });

    // connect to Twitch
    client.connect();

    return prom.toPromise();
}

function extractInfo(context: ChatUserstate): {
    moderator: boolean;
    vip: boolean;
    sent: Date;
    username: string;
} {
    const username = context['display-name'];
    const sent = new Date(Number(context['tmi-sent-ts']));
    const moderator = context.mod || false;

    // TODO: seems this value will be '1' for VIPs.
    // I'm not sure if there are multiple states or not...
    const { vip } = context.badges || { vip: '0' };

    return {
        username,
        moderator,
        sent,
        vip: vip === '1',
    };
}

function onJoinHandler(channel: string, username: string, self: boolean) {
    if (self) {
        return;
    }
    events$.next({
        type: 'join',
        username,
        sent: new Date(),
    });
}

function onPartHandler(channel: string, username: string, self: boolean) {
    if (self) {
        return;
    }
    events$.next({
        type: 'leave',
        username,
        sent: new Date(),
    });
}

function onMessageHandler(channel: string, context: ChatUserstate, message: string, self: boolean) {
    if (self) { return; } // Ignore messages from the bot

    const extracted = extractInfo(context);

    if (message && message[0] === '!') {
        const command = message.substr(1).split(' ')[0];
        const nextMessage = message.substr(command.length + 1).trim();

        events$.next({
            type: 'command',
            command,
            context,
            message: nextMessage,
            ...extracted,
        });
    } else {
        events$.next({
            type: 'message',
            context,
            message,
            ...extracted,
        });
    }
}

function onRedeemHandler(channel: string, username: string, rewardType: string, context: ChatUserstate) {
    const extracted = extractInfo(context);
    events$.next({
        type: 'redeem',
        rewardType,
        context,
        ...extracted,
        username, // don't override the provided name with the extracted
    });
}

function onCheerHandler(channel: string, context: ChatUserstate, message: string) {
    const extracted = extractInfo(context);

    events$.next({
        type: 'cheer',
        amount: Number(context['bits']),
        context,
        message,
        ...extracted,
    });
}

async function endProcessing() {
    if (client) {
        await client.part(hostChannel);
    }
}

export default {

    /**
     * Connects to the channel's chat and processes incoming messages
     */
    start: async () => {
        return createTMIClient();
    },

    /**
     * Closes the client stops processing chat information
     */
    stop: async () => {
        await endProcessing();
    },

    /**
     * Sends the message to the channel's chat
     * 
     * @param message Message to be displayed
     */
    say: (message: string) => {
        client.say(hostChannel, message);
    },

    /**
     * Chat event stream 
     * 
     * @returns 
     */
    eventStream: () => events$,
};
