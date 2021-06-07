import { bgRed } from 'kleur';
import { checkFirstArrival } from './arrivals/arrivals';
import chatBot from './chat-bot/chat-bot';
import { AllEventTypes } from './chat-bot/chat-bot.models';
import { processBitCommand, processCommand, processPointCommand } from './commands/commands';
import { CommandContext } from './commands/commands.model';
import keys from './keys/keys';
import obs from './obs-websocket/obs-websocket';
import pubsub from './pubsub/pubsub';
import counter from './counter/counter';
import { getCurrentSettings, upgradeSettings } from './settings/settings';
import { logError, logMuted, logSuccess } from './utils/log';
import { lh, tryAwait } from './utils/utils';
import hub from './hub/hub';

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
                processBitCommand(event.data.bits_used, {
                    username: event.data.user_name
                } as CommandContext);

                message = `${lh(event.data.user_name || 'anon')} cheered ${lh(event.data.bits_used)} bits!`;
                break;

            case 'points':
                processPointCommand(event.data.redemption.reward.title, {
                    username: event.data.redemption.user.display_name
                } as CommandContext);

                message = `${lh(event.data.redemption.user.display_name)} redeemed ${lh(event.data.redemption.reward.title)}`;
                break;

            case 'sub':
                return;
        }

        logMuted(`${eventName} ${message}`);
    });
}

async function startLegoHub() {
    const { legoHub } = getCurrentSettings();

    if (!legoHub || legoHub.disabled) {
        logMuted('Lego Hub is disabled');
        return;
    }

    await hub.start();
}

/**
 * Main function to be ran on start
 */
async function start() {
    // connect the chat bot
    await chatBot.start();

    // listen for keypresses
    keys.start();

    // start counter
    await counter.start();

    // start lego hub
    await startLegoHub();

    // wait to connect to OBS
    const [obsErr] = await tryAwait(() => obs.start());
    if (obsErr) {
        logError(`Could not connect to OBS`, obsErr);
    }

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
            case 'redeem':
            case 'cheer':
                // ignoring these types from TMI as we handle it with the PubSub now
                break;
            case 'command':
                processCommand(event.command, event);
                ev(event, `${lh(event.username)} issued '${lh(event.command)}', '${lh(event.message)}'`);
                break;
            case 'leave':
                ev(event, `${lh(event.username)}`);
                break;
            case 'message':
                checkFirstArrival(event.username);
                ev(event, `${lh(event.username)} says '${lh(event.message)}'`);
                break;
            case 'raided':
                ev(event, `${lh(event.username)} with '${lh(event.viewers)} viewers'`);
                break;
            default:
                console.log(event);
                break;
        }

    });

}

/**
 * Stops listeners, cleans up before exiting
 */
async function stop() {

    logMuted('Cleaning up before exit');

    const errHandler = (which: string) => (err: Error) => logError(`'${which}' failed to stop`, err);

    await chatBot.stop().catch(errHandler('chatBot'));
    await pubsub.stop().catch(errHandler('pubsub'));
    await counter.stop().catch(errHandler('counter'));
    await hub.stop().catch(errHandler('hub'));

    keys.stop();

    logMuted('Bye!');

    process.exit(0);
}

function handleInput(data: string) {
    const message = data.toString().toLowerCase().trim();
    switch (message) {
        case 'exit': {
            stop();
        }
    }
}

// clean up on exit
['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => {
    process.on(signal, () => {
        logError(`PROCESS ENDED WITH ${signal}! USE THE 'exit' COMMAND NEXT TIME!`);
        stop();
    });
});

// entry point
(async () => {

    if (upgradeSettings()) {
        logError('Your settings were upgraded. Please ensure the file contents are correct and launch again');
        process.exit(0);
    }

    logSuccess(`Starting application. Type 'exit' to end`);

    const stdin = process.openStdin();
    stdin.on('data', handleInput);

    await start();

})();
