import chatBot from './chat-bot/chat-bot';
import obs from './obs-websocket/obs-websocket';
import { checkFirstArrival } from './arrivals/arrivals';
import { tokenStringParser, wait } from './utils/utils';
import { CommandDirective } from 'commands/commands.model';
import { processScene } from './scenes/scenes';

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
                console.log(`User ${event.username} redeemed award ${event.rewardType}`);
                break;
            case 'cheer':
                console.log(`User ${event.username} just cheered with ${event.amount} bits!`);
                break;
            case 'command':
                console.log(`User ${event.username} just issued ${event.command} with the message ${event.message}`);
                break;
            case 'join':
                checkFirstArrival(event.username);
                console.log(`User ${event.username} joined the chat`);
                break;
            case 'leave':
                console.log(`User ${event.username} left the chat`);
                break;
            case 'message':
                checkFirstArrival(event.username);
                console.log(`User ${event.username} says ${event.message}`);
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
    await chatBot.stop();
    process.exit(0);
}

// clean up on exit
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

// entry point
(async () => {

    await start();

    await wait(2e3);

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

    processScene(commandOne.directives, { username: 'Grumble' });
    processScene(commandOne.directives, { username: 'Grumble' });

    // obs.getSourcesList().then(list => console.log(list));

    console.log('Started app, waiting for activity');
})();
