import { Collection, SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import * as createPost from './createPost';
import * as editPost from './editPost';
import * as deletePost from './deletePost';
import * as listPosts from './listPosts';
import * as configCommand from './config';

export interface Command {
    data: SlashCommandBuilder;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export const commands = new Collection<string, Command>();

// Register all commands
const allCommands = [createPost, editPost, deletePost, listPosts, configCommand];

for (const command of allCommands) {
    if ('data' in command && 'execute' in command) {
        commands.set(command.data.name, command as Command);
    }
}

// Export array of command data for registration
export const commandsData = allCommands.map(cmd => cmd.data.toJSON());