import { AllEventTypes } from 'chat-bot/chat-bot.models';
import { CommandDirective } from 'commands/commands.model';
import { bgRed } from 'kleur';
import { processScene } from './scenes/scenes';
import { checkFirstArrival } from './arrivals/arrivals';
import chatBot from './chat-bot/chat-bot';
import { processCommand } from './commands/commands';
import obs from './obs-websocket/obs-websocket';
import { logMuted } from './utils/log';
import { lh } from './utils/utils';

function ev(event: AllEventTypes, message: string) {
    const eventName = bgRed().bold().white(event.type.toUpperCase());

    logMuted(`${eventName} ${message}`);
}

/**
 * Main function to be ran on start
 */
async function start() {
    // connect the chat bot
    await chatBot.start();

    // wait to connect to OBS
    await obs.start();

    // listen for chat events...
    chatBot.eventStream().subscribe(event => {

        // do something with each event type...

        switch (event.type) {
            case 'redeem':
                ev(event, `${lh(event.username)} redeemed '${lh(event.rewardType)}'`);
                break;
            case 'cheer':
                ev(event, `${lh(event.username)} cheered ${lh(event.amount)} bits!`);
                break;
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
            default:
                logMuted(event);
                break;
        }
    });

}

/**
 * Stops listeners, cleans up before exiting
 */
async function stop() {
    await chatBot.stop();
    process.exit(0);
}

// clean up on exit
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

// entry point
(async () => {

    await start();

    const commandOne: CommandDirective = {
        command: 'test',
        directives: [{
            type: 'chat',
            message: 'Hello, {{username}}',
        }, {
            type: 'chat',
            delayInSeconds: 3,
            message: 'Goodbye, {{username}}',
        }, {
            type: 'audio',
            filename: 'c:/temp/file_example_OOG_1MG.ogg',
        }, {
            type: 'obs',
            durationInSeconds: 3,
            sceneName: 'Scene',
            sourceName: 'Image',
        }]
    };

    // processScene(commandOne.directives, { username: 'Grumble' });
    // processScene(commandOne.directives, { username: 'Grumble' });

    // obs.getSourcesList().then(list => console.log(list));

    logMuted('Started application');

})();
