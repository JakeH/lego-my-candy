import chatBot from './chat-bot/chat-bot';

/**
 * Main function to be ran on start
 */
async function start() {
    // connect the chat bot
    await chatBot.start();

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
                console.log(`User ${event.username} joined the chat`);
                break;
            case 'leave':
                console.log(`User ${event.username} left the chat`);
                break;
            case 'message':
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
})();
