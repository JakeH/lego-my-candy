import { Subject } from 'rxjs';
import { getCurrentSettings } from '../settings/settings';
import {
    ChatUserstate,
    Client,
    Badges,
    client as tmiClient,
    Options as tmiOptions
} from 'tmi.js';
import { AllEventTypes, UserInfo } from './chat-bot.models';
import { logMuted, logSuccess } from '../utils/log';
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
    client.on('raided', onRaidedHandler);

    const prom = new PromWrap();

    client.on('connected', () => {
        prom.resolve();
        logSuccess(`Chat bot connected to '${hostChannel}'`);
    });

    // connect to Twitch
    client.connect();

    return prom.toPromise();
}

function parseBadges(badges: Badges): { [key in keyof Badges]: boolean } {
    return Object.entries(badges || {}).reduce((acc, [key]) => {
        // if the value is in badges, then it's set, 
        // the value doesn't seem to mean anything
        acc[key] = true;
        return acc;
    }, {});

}

function extractInfo(context: ChatUserstate): {
    sent: Date;
    username: string;
} & UserInfo {
    const username = context['display-name'];
    const sent = new Date(Number(context['tmi-sent-ts']));
    const { moderator, subscriber, broadcaster, vip, founder } = parseBadges(context.badges);

    return {
        username,
        moderator,
        sent,
        vip,
        subscriber: subscriber || founder,
        broadcaster,
        founder,
    };
}

function onRaidedHandler(channel: string, username: string, viewers: number) {
    events$.next({
        type: 'raided',
        username,
        viewers,
        sent: new Date(),
    });
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

    // if this looks like a command message, we can evalute it
    if (message && message[0] === '!') {
        const command = message.substr(1).split(' ')[0];

        // check for non-empty or valid commands
        if (/^[0-9a-zA-Z]+$/.test(command.trim())) {

            const nextMessage = message.substr(command.length + 1).trim();

            events$.next({
                type: 'command',
                command,
                context,
                message: nextMessage,
                ...extracted,
            });

            return;
        } else {
            // we will just treat this like a normal message
            logMuted(`Ignoring invalid command '${message}'`);
        }
    }

    events$.next({
        type: 'message',
        context,
        message,
        ...extracted,
    });

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
