import { startBot } from './bot';

// Start the bot
startBot().catch(error => {
    console.error('Failed to start bot:', error);
    process.exit(1);
});