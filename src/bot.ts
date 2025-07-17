

import { Client, GatewayIntentBits, Events, Collection } from 'discord.js';
import { config } from './config';
import { commands } from './commands';
import { registerCommands } from './utils/registerCommands';
import { initializeDatabase } from './database/connection';
import { handleInteractionCreate } from './events/interactionCreate';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.once(Events.ClientReady, async (readyClient) => {
    console.log(`Logged in as ${readyClient.user.tag}`);
    
    try {
        await registerCommands();
        console.log('Commands registered successfully');
    } catch (error) {
        console.error('Failed to register commands:', error);
    }
    
    console.log('Bot is ready!');
});

client.on(Events.InteractionCreate, async (interaction) => {
    try {
        await handleInteractionCreate(interaction, commands);
    } catch (error) {
        console.error('Error handling interaction:', error);
    }
});

export async function startBot() {
    try {
        // Initialize database first
        await initializeDatabase();
        
        // Then login to Discord
        await client.login(config.token);
    } catch (error) {
        console.error('Failed to start bot:', error);
        throw error;
    }
}

export { client, commands };