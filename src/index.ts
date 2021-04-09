import chatBot from './chat-bot/chat-bot';

/**
 * Main function to be ran on start
 */
async function start() {
    // connect the chat bot
    await chatBot.start();

    // listen for chat events...
    chatBot.eventStream().subscribe(event => {
        if (event.type === 'redeem') {
            // do something with specific event types
            console.log(`User ${event.username} redeemed award ${event.rewardType}`);
        } else {
            console.log(event);
        }
    });

}

/**
 * Stops listeners, cleans up before exiting
 */
async function stop() {
    await chatBot.stop();
    process.exit(1);
}

// clean up on exit
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

// entry point
(async () => {
    await start();
})();
