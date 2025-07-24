import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalSubmitInteraction } from 'discord.js';
import { Post } from '../database/models/Post';
import { canManagePosts } from '../utils/permissions';

export const data = [
    new SlashCommandBuilder()
        .setName('snote-edit')
        .setDescription('Edit an existing shared note')
        .addStringOption(option =>
            option
                .setName('id')
                .setDescription('The ID of the note to edit')
                .setRequired(true)
                .setAutocomplete(true)
        ),
    new SlashCommandBuilder()
        .setName('sn-edit')
        .setDescription('Short: Edit an existing shared note')
        .addStringOption(option =>
            option
                .setName('id')
                .setDescription('The ID of the note to edit')
                .setRequired(true)
                .setAutocomplete(true)
        )
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

    const postId = interaction.options.getString('id', true);
    // Find the post
    const post = await Post.findOne({ 
        where: { 
            id: postId, 
            guildId: interaction.guildId 
        } 
    });

    if (!post) {
        await interaction.reply({ 
            content: 'Post not found.', 
            ephemeral: true 
        });
        return;
    }

    // Show modal for editing post
    const { buildPostModal } = await import('../utils/modalUtils');
    const modal = buildPostModal({
        customId: `editpost-modal-${post.id}`,
        title: 'Edit Shared Post',
        defaultTitle: post.title,
        defaultContent: post.content,
        defaultTags: post.tags ? post.tags.join(', ') : '',
        isEdit: true
    });
    await interaction.showModal(modal);
}

// Handler for modal submission (to be called from interactionCreate event)
export async function handleEditPostModal(interaction: ModalSubmitInteraction) {
    // Extract post ID from customId
    const match = interaction.customId.match(/^editpost-modal-(\d+)$/);
    if (!match) {
        await interaction.reply({ content: 'Invalid modal submission.', ephemeral: true });
        return;
    }
    const postId = match[1];
    const newTitle = interaction.fields.getTextInputValue('title');
    const newContent = interaction.fields.getTextInputValue('content');
    const newTagsString = interaction.fields.getTextInputValue('tags');
    const newTags = newTagsString ? newTagsString.split(',').map(t => t.trim()).filter(Boolean) : [];

    // Find the post
    const post = await Post.findOne({ 
        where: { 
            id: postId, 
            guildId: interaction.guildId 
        } 
    });

    if (!post) {
        await interaction.reply({ content: 'Post not found.', ephemeral: true });
        return;
    }

    // Permission check: per-user, per-channel
    const { canUserManagePosts } = await import('../utils/channelPermissions');
    const hasPerm = await canUserManagePosts(
        interaction.guildId!,
        post.channelId,
        interaction.user.id,
        'edit'
    );
    if (!hasPerm) {
        await interaction.reply({ content: 'You do not have permission to edit posts in this channel.', ephemeral: true });
        return;
    }

    try {
        // Fetch the original channel and message
        const channel = await interaction.guild!.channels.fetch(post.channelId);
        if (!channel || !channel.isTextBased()) {
            await interaction.reply({ content: 'Original channel not found.', ephemeral: true });
            return;
        }

        let oldMessage;
        try {
            oldMessage = await channel.messages.fetch(post.messageId);
        } catch (e) {
            oldMessage = null;
        }

        // Build updated embed (use new title and tags)
        const embed = {
            title: newTitle,
            description: newContent.length > 4096 ? newContent.substring(0, 4090) + '...' : newContent,
            color: 0x0099FF,
            author: {
                name: interaction.user.username,
                icon_url: interaction.user.displayAvatarURL()
            },
            timestamp: new Date().toISOString(),
            fields: [] as any[],
            footer: { text: '' }
        };
        if (newContent.length > 4096) {
            embed.fields.push({ name: 'Note', value: 'Content was truncated. Full content is stored in the database.' });
        }
        let footerText = `Post #${post.id}`;
        if (newTags.length > 0) {
            footerText = `Tags: ${newTags.join(', ')} | ${footerText}`;
        }
        embed.footer = { text: footerText };

        // Delete the old message if it exists
        if (oldMessage) {
            try { await oldMessage.delete(); } catch (e) { /* ignore */ }
        }

        // Add Edit button
        const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = await import('discord.js');
        const editButton = new ButtonBuilder()
            .setCustomId(`editpost-btn-${post.id}`)
            .setLabel('Edit')
            .setStyle(ButtonStyle.Primary);
        const row = new ActionRowBuilder().addComponents(editButton);

        // Send the new embed as a new message (repost)
        const newMessage = await channel.send({ embeds: [embed], components: [row.toJSON()] });

        // Update database with new info
        post.title = newTitle;
        post.content = newContent;
        post.tags = newTags;
        post.lastEditedBy = interaction.user.id;
        post.messageId = newMessage.id;
        post.channelId = channel.id;
        await post.save();

        await interaction.reply({ content: 'Post updated and reposted successfully.', ephemeral: true });
    } catch (error) {
        console.error('Error editing post:', error);
        await interaction.reply({ content: 'Failed to edit the post. The message may have been deleted.', ephemeral: true });
    }
}