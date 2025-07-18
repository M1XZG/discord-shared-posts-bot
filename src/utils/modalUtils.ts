// Utility for building modals for post creation/editing
import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';

interface BuildPostModalOptions {
    customId: string;
    title: string;
    defaultTitle?: string;
    defaultContent?: string;
    defaultTags?: string;
    isEdit?: boolean;
}

export function buildPostModal({ customId, title, defaultTitle = '', defaultContent = '', defaultTags = '', isEdit = false }: BuildPostModalOptions) {
    const modal = new ModalBuilder()
        .setCustomId(customId)
        .setTitle(title);

    const titleInput = new TextInputBuilder()
        .setCustomId('title')
        .setLabel('Title')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setValue(defaultTitle);

    const contentInput = new TextInputBuilder()
        .setCustomId('content')
        .setLabel('Content (supports markdown)')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setValue(defaultContent);

    const tagsInput = new TextInputBuilder()
        .setCustomId('tags')
        .setLabel('Tags (comma-separated, optional)')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setValue(defaultTags);

    modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(contentInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(tagsInput)
    );
    return modal;
}
