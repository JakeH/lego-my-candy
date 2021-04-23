import chatBot from './chat-bot/chat-bot';
import obs from './obs-websocket/obs-websocket';
import { checkFirstArrival } from './arrivals/arrivals';

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

    // obs.getSourcesList().then(list => console.log(list));

    console.log('Started app, waiting for activity');
})();
