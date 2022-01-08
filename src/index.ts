import { bgRed } from 'kleur';
import { checkFirstArrival } from './arrivals/arrivals';
import chatBot from './chat-bot/chat-bot';
import { AllEventTypes } from './chat-bot/chat-bot.models';
import { processBitCommand, processCommand, processPointCommand } from './commands/commands';
import { CommandContext } from './commands/commands.model';
import keys from './keys/keys';
import obs from './obs-websocket/obs-websocket';
import nerf from './nerf/nerf';
import pubsub from './pubsub/pubsub';
import counter from './counter/counter';
import { getCurrentSettings, upgradeSettings } from './settings/settings';
import { logError, logMuted, logSuccess } from './utils/log';
import { lh, tryAwait } from './utils/utils';
import hub from './hub/hub';
import { Subscription } from 'rxjs';
import giveaway from './giveaway/giveaway';

function ev(event: AllEventTypes, message: string) {
    const eventName = bgRed().bold().white(event.type.toUpperCase());
    logMuted(`${eventName} ${message}`);
}

let pubsubSub$: Subscription = Subscription.EMPTY;
let eventsSub$: Subscription = Subscription.EMPTY;

async function startPubSub() {
    // double-check
    pubsubSub$.unsubscribe();

    // allow this to throw errors
    const client = pubsub.getClient();
    await client.connect();
    await client.startListening();

    pubsubSub$ = client.events$.subscribe(event => {
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

    const [err] = await tryAwait(() => hub.start());

    if (err) {
        logError('Failed to start Lego Hub', err);
    }
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

    // wait to connect to Nerf
    const [nerfErr] = await tryAwait(() => nerf.start());
    if (nerfErr) {
        logError(`Could not start Nerf`, nerfErr);
    }

    // connect to Twitch PubSub
    const [psErr] = await tryAwait(() => startPubSub());
    if (psErr) {
        logError('Cannot start pubsub listener', psErr);
    }

    // double-check
    eventsSub$.unsubscribe();
    // listen for chat events...
    eventsSub$ = chatBot.eventStream().subscribe(event => {

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
                // when raided, we issue a fake command, which should
                // be guarded to only allow the broadcaster to invoke
                processCommand('private-raided-command', {
                    ...event,
                    broadcaster: true,
                    founder: true,
                    moderator: true,
                    subscriber: true,
                    vip: true,
                    message: '',
                    command: 'private-raided-command',
                });
                ev(event, `${lh(event.username)} with '${lh(event.viewers)} viewers'`);
                break;
            default:
                console.log(event);
                break;
        }

    });

}

/**
 * Executes the stop function for a single individual service
 * @param name Name of the service for use in logging
 * @param stopFun The stop function to execute
 */
async function individualStop(name: string, stopFun: () => Promise<void>) {
    const [err] = await tryAwait(() => stopFun());
    if (err) {
        logError(`'${name}' failed to stop`, err);
    } else {
        logSuccess(`'${name}' stopped successfully`);
    }
}

/**
 * Stops listeners, cleans up before exiting
 */
async function stop(exitOnDone: boolean = true) {

    logMuted('Shutting down services');

    // const errHandler = (which: string) => (err: Error) => logError(`'${which}' failed to stop`, err);

    await individualStop('chatBot', chatBot.stop);
    await individualStop('pubsub', pubsub.stop);
    await individualStop('counter', counter.stop);
    await individualStop('hub', hub.stop);
    await individualStop('nerf', nerf.stop);
    await individualStop('obs', obs.stop);

    pubsubSub$.unsubscribe();
    eventsSub$.unsubscribe();

    keys.stop();

    if (exitOnDone) {
        logMuted('Bye!');
        process.exit(0);
    }
}

async function restart() {

    logMuted('Restarting all services');

    await stop(false);

    logMuted('Services are stopped');

    await start();

    logSuccess('Restart complete');
}

function handleInput(data: string) {
    const message = data.toString().toLowerCase().trim();
    switch (message) {
        case 'exit': {
            stop();
            break;
        }
        case 'restart': {
            restart();
            break;
        }
        case 'giveaway start': {
            giveaway.start();
            break;
        }
        case 'giveaway stop': {
            giveaway.stop();
            break;
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
