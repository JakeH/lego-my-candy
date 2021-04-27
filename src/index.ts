import { AllEventTypes } from 'chat-bot/chat-bot.models';
import { bgRed } from 'kleur';
import { checkFirstArrival } from './arrivals/arrivals';
import chatBot from './chat-bot/chat-bot';
import { processCommand } from './commands/commands';
import obs from './obs-websocket/obs-websocket';
import pubsub from './pubsub/pubsub';
import { logError, logMuted } from './utils/log';
import { lh } from './utils/utils';

function ev(event: AllEventTypes, message: string) {
    const eventName = bgRed().bold().white(event.type.toUpperCase());
    logMuted(`${eventName} ${message}`);
}

async function startPubSub() {
    // allow this to throw errors
    const client = pubsub.getClient();
    await client.connect();
    await client.startListening();

    client.events$.subscribe(event => {
        const eventName = bgRed().bold().white(event.type.toUpperCase());
        let message = '';

        switch (event.type) {
            case 'bits':
                message = `${lh(event.data.user_name || 'anon')} cheered ${lh(event.data.bits_used)} bits!`;
                break;

            case 'points':
                message = `todo`;
                break;
        }

        console.log(event);

        logMuted(`${eventName} ${message}`);
    });
}

/**
 * Main function to be ran on start
 */
async function start() {
    // connect the chat bot
    await chatBot.start();

    // wait to connect to OBS
    await obs.start();

    // connect to Twitch PubSub
    try {
        startPubSub();
    } catch (error) {
        logError('Cannot start pubsub listener', error);
    }

    // listen for chat events...
    chatBot.eventStream().subscribe(event => {

        // do something with each event type...

        switch (event.type) {
            // case 'redeem':
            //     ev(event, `${lh(event.username)} redeemed '${lh(event.rewardType)}'`);
            //     break;
            // case 'cheer':
            //     ev(event, `${lh(event.username)} cheered ${lh(event.amount)} bits!`);
            //     break;
            case 'command':
                processCommand(event.command, event);
                ev(event, `${lh(event.username)} issued '${lh(event.command)}', '${lh(event.message)}'`);
                break;
            case 'join':
                checkFirstArrival(event.username);
                ev(event, `${lh(event.username)}`);
                break;
            case 'leave':
                ev(event, `${lh(event.username)}`);
                break;
            case 'message':
                checkFirstArrival(event.username);
                ev(event, `${lh(event.username)} says '${lh(event.message)}'`);
                break;
        }

    });

}

/**
 * Stops listeners, cleans up before exiting
 */
async function stop() {
    await chatBot.stop();
    await pubsub.getClient().disconnect();
    process.exit(0);
}

// clean up on exit
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

// entry point
(async () => {

    await start();

    // obs.getSourcesList().then(list => console.log(list));

    logMuted('Started application');

})();
