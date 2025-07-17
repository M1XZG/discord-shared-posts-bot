import { Client } from 'discord.js';
import { registerCommands } from '../utils/registerCommands';

export async function onReady(client: Client) {
    console.log('Bot is ready!');
    
    // Register slash commands
    try {
        await registerCommands();
        console.log('Commands registered successfully!');
    } catch (error) {
        console.error('Failed to register commands:', error);
    }
}