import { Collection, ChatInputCommandInteraction } from 'discord.js';
import type { SlashCommandBuilder, SlashCommandOptionsOnlyBuilder, SlashCommandSubcommandsOnlyBuilder } from 'discord.js';
import * as createPost from './createPost';
import * as editPost from './editPost';
import * as deletePost from './deletePost';
import * as listPosts from './listPosts';
import * as configCommand from './config';
import * as help from './help';

export type AnySlashCommandBuilder = SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;
export interface Command {
    data: AnySlashCommandBuilder;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}


export const commands = new Collection<string, Command>();

// Gather all command modules
const allCommandModules = [createPost, editPost, deletePost, listPosts, configCommand];

// Flatten all data arrays and register each variant
const commandsData: any[] = [];
for (const mod of allCommandModules) {
    if ('data' in mod && 'execute' in mod) {
        const datas = Array.isArray(mod.data) ? mod.data : [mod.data];
        for (const builder of datas) {
            commands.set(builder.name, { data: builder, execute: mod.execute });
            commandsData.push(builder.toJSON());
        }
    }
}


// Register both /snote-help and /sn-help in a type-safe way
for (const builder of help.data) {
    commands.set(builder.name, { data: builder, execute: help.execute });
}

export { commandsData };