import { Subject } from 'rxjs';
import { getCurrentSettings } from '../settings/settings';
import {
    ChatUserstate,
    Client,
    client as tmiClient,
    Options as tmiOptions
} from 'tmi.js';
import { AllEventTypes } from './chat-bot.models';

let hostChannel = '';
let client: Client;

const events$ = new Subject<AllEventTypes>();

function createTMIClient() {

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

    // connect to Twitch
    client.connect();
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

    const username = context['display-name'];
    const sent = new Date(Number(context['tmi-sent-ts']));

    if (message && message[0] === '!') {
        const command = message.substr(1).split(' ')[0];
        const nextMessage = message.substr(command.length + 1).trim();

        events$.next({
            type: 'command',
            command,
            context,
            message: nextMessage,
            username,
            sent,
        });
    } else {
        events$.next({
            type: 'message',
            context,
            message,
            username,
            sent,
        });
    }
}

function onRedeemHandler(channel: string, username: string, rewardType: string, context: ChatUserstate) {
    const sent = new Date(Number(context['tmi-sent-ts']));
    events$.next({
        type: 'redeem',
        rewardType,
        context,
        username,
        sent,
    });
}

function onCheerHandler(channel: string, context: ChatUserstate, message: string) {
    const username = context['display-name'];
    const sent = new Date(Number(context['tmi-sent-ts']));

    events$.next({
        type: 'cheer',
        amount: Number(context['bits']),
        context,
        username,
        message,
        sent,
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
        createTMIClient();
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
