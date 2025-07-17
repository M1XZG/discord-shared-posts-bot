import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ModalSubmitInteraction } from 'discord.js';
import { Post } from '../database/models/Post';
import { canManagePosts } from '../utils/permissions';

export const data = [
    new SlashCommandBuilder()
        .setName('snote-create')
        .setDescription('Create a new shared note'),
    new SlashCommandBuilder()
        .setName('sn-create')
        .setDescription('Short: Create a new shared note')
];

export async function execute(interaction: ChatInputCommandInteraction) {
    // Check permissions
    if (!await canManagePosts(interaction.member as GuildMember)) {
        await interaction.reply({ 
            content: 'You do not have permission to manage shared posts.', 
            ephemeral: true 
        });
        return;
    }

    // Show modal for post creation
    const modal = new ModalBuilder()
        .setCustomId('createpost-modal')
        .setTitle('Create Shared Post');

    const titleInput = new TextInputBuilder()
        .setCustomId('createpost-title')
        .setLabel('Title')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const contentInput = new TextInputBuilder()
        .setCustomId('createpost-content')
        .setLabel('Content (supports markdown)')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

    const tagsInput = new TextInputBuilder()
        .setCustomId('createpost-tags')
        .setLabel('Tags (comma-separated, optional)')
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

    modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(contentInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(tagsInput)
    );

    await interaction.showModal(modal);
}

export async function handleCreatePostModal(interaction: ModalSubmitInteraction) {
    try {
        console.log('Modal interaction:', {
            guildId: interaction.guildId,
            channelId: interaction.channel?.id,
            user: interaction.user.id,
            fields: Array.from(interaction.fields.fields.values()).map((f: any) => ({ id: f.customId, value: f.value }))
        });

        const title = interaction.fields.getTextInputValue('createpost-title');
        const content = interaction.fields.getTextInputValue('createpost-content');
        const tagsString = interaction.fields.getTextInputValue('createpost-tags');
        const tags = tagsString ? tagsString.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [];

        // Create an embed for better formatting
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setColor(0x0099FF)
            .setAuthor({ 
                name: interaction.user.username, 
                iconURL: interaction.user.displayAvatarURL() 
            })
            .setTimestamp();

        if (content.length > 4096) {
            embed.setDescription(content.substring(0, 4090) + '...');
            embed.addFields({ 
                name: 'Note', 
                value: 'Content was truncated. Full content is stored in the database.' 
            });
        } else {
            embed.setDescription(content);
        }

        // Use channel?.id for safety
        const channelId = interaction.channel?.id || null;
        if (!channelId) {
            await interaction.reply({ content: 'Could not determine channel for post.', ephemeral: true });
            return;
        }

        // Store in database (full content, not truncated)
        // First, send a placeholder message to get the message ID
        const tempMsg = await interaction.reply({ embeds: [embed], fetchReply: true });
        const post = await Post.create({
            guildId: interaction.guildId!,
            channelId: channelId,
            messageId: tempMsg.id,
            title: title,
            content: content, // Full content stored
            authorId: interaction.user.id,
            authorName: interaction.user.username,
            tags: tags,
            attachments: []
        });

        // Always show post number in the footer, combine with tags if present
        let footerText = `Post #${post.id}`;
        if (tags.length > 0) {
            footerText = `Tags: ${tags.join(', ')} | ${footerText}`;
        }
        embed.setFooter({ text: footerText });

        // Add Edit button
        const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = await import('discord.js');
        const editButton = new ButtonBuilder()
            .setCustomId(`editpost-btn-${post.id}`)
            .setLabel('Edit')
            .setStyle(ButtonStyle.Primary);
        const row = new ActionRowBuilder().addComponents(editButton);

        // Edit the message to update the footer and add the button
    await tempMsg.edit({ embeds: [embed], components: [row.toJSON()] });

        // Add confirmation
        await interaction.followUp({ 
            content: `Post created successfully! ID: ${post.id}`, 
            ephemeral: true 
        });
    } catch (error) {
        console.error('Error in handleCreatePostModal:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'An error occurred while creating the post.', ephemeral: true });
        } else {
            await interaction.followUp({ content: 'An error occurred while creating the post.', ephemeral: true });
        }
    }
}