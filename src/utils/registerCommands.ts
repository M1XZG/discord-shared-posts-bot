
import { REST, Routes } from 'discord.js';
import { commands } from '../bot';
import { readdirSync } from 'fs';
import { join } from 'path';

export async function registerCommands() {
    const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

    // Dynamically load all command data
    const commandFiles = readdirSync(join(__dirname, '../commands')).filter(file => {
        // Only include .ts/.js files that are not index.ts/js
        const lower = file.toLowerCase();
        return (lower.endsWith('.ts') || lower.endsWith('.js')) && !lower.startsWith('index.');
    });
    const commandsData = [];
    for (const file of commandFiles) {
        const command = require(join(__dirname, '../commands', file));
        if ('data' in command && 'execute' in command) {
            const datas = Array.isArray(command.data) ? command.data : [command.data];
            for (const builder of datas) {
                commands.set(builder.name, command);
                commandsData.push(builder.toJSON());
            }
        } else {
            console.log(`[WARNING] The command at ${file} is missing a required "data" or "execute" property.`);
        }
    }

    try {
        console.log(`Started refreshing ${commandsData.length} application (/) commands.`);

        if (process.env.DEV_GUILD_ID) {
            // Always register to the dev guild for instant updates
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.DEV_GUILD_ID),
                { body: commandsData },
            );
            console.log('Registered commands to DEV_GUILD_ID for instant update.');
        } else {
            // Only use global registration for production
            await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID!),
                { body: commandsData },
            );
            console.log('Registered commands globally (may take up to 1 hour to update).');
        }
    } catch (error) {
        console.error('Failed to register commands:', error);
        throw error;
    }
}