import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ModalSubmitInteraction, PermissionFlagsBits } from 'discord.js';
import { Post } from '../database/models/Post';
import { canUserManagePosts } from '../utils/channelPermissions';
import { buildPostModal } from '../utils/modalUtils';
import { ButtonBuilder, ActionRowBuilder } from 'discord.js';
import { ButtonStyle } from 'discord.js';

export const data = [
    new SlashCommandBuilder()
        .setName('snote-create')
        .setDescription('Create a new shared note')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Channel to post the note in')
                .setRequired(true)
        )
    // Only require channel; other fields will be collected via modal
    ,
    new SlashCommandBuilder()
        .setName('sn-create')
        .setDescription('Short: Create a new shared note')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Channel to post the note in')
                .setRequired(true)
        )
    // Only require channel; other fields will be collected via modal
        
];

export async function execute(interaction: ChatInputCommandInteraction) {
    const channel = interaction.options.getChannel('channel', true);
    // Ensure member is fetched (not just from cache)
    let member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!member && interaction.guild) {
        member = await interaction.guild.members.fetch(interaction.user.id);
    }
    let hasPerm = false;
    let isOwner = false;
    let isAdmin = false;
    let ownerId = interaction.guild?.ownerId;
    let memberId = member?.id;
    let channelType = channel?.type;
    if (member) {
        isOwner = ownerId === memberId;
        isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);
        if (isOwner || isAdmin) {
            hasPerm = true;
        }
    }
    if (!hasPerm) {
        hasPerm = await canUserManagePosts(
            interaction.guildId!,
            channel.id,
            interaction.user.id,
            'create'
        );
    }
    // Detailed debug logging
    console.log(`[DEBUG] createPost: user=${interaction.user.id} memberId=${memberId} ownerId=${ownerId} isOwner=${isOwner} isAdmin=${isAdmin} hasPerm=${hasPerm} channelId=${channel.id} channelType=${channelType}`);
    // Check if bot has permission to send messages in the target channel
    const botMember = interaction.guild?.members.me;
    let botCanSend = false;
    // Only check permissions for text-based channels
    if (
        channel &&
        ('permissionsFor' in channel) &&
        (channel.type === 0 || channel.type === 5) // 0: GuildText, 5: GuildNews
    ) {
        botCanSend = channel.permissionsFor(botMember!)?.has(PermissionFlagsBits.SendMessages) ?? false;
    } else {
        botCanSend = true; // Assume true for unsupported types (e.g., threads, categories)
    }
    if (!botCanSend) {
        await interaction.reply({
            content: 'Bot does not have permission to send messages in the selected channel. Please update channel permissions.',
            flags: 1 << 6 // EPHEMERAL
        });
        return;
    }
    if (!hasPerm) {
        await interaction.reply({
            content: `You do not have permission to create posts in that channel. [DEBUG: user=${interaction.user.id} memberId=${memberId} ownerId=${ownerId} isOwner=${isOwner} isAdmin=${isAdmin} hasPerm=${hasPerm} channelId=${channel.id} channelType=${channelType}]`,
            flags: 1 << 6 // EPHEMERAL
        });
        return;
    }

    // Show modal for post creation
    const modal = buildPostModal({
        customId: `createpost-modal:${channel.id}`,
        title: 'Create Shared Note'
    });
    await interaction.showModal(modal);
}

// Handler for modal submission
export async function handleCreatePostModal(interaction: ModalSubmitInteraction) {
    // Extract channelId from customId
    const [_, channelId] = interaction.customId.split(':');
    const title = interaction.fields.getTextInputValue('title');
    const content = interaction.fields.getTextInputValue('content');
    const tagsString = interaction.fields.getTextInputValue('tags');
    const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(Boolean) : [];

    // Allow server owner and admins to always create posts
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    let hasPerm = false;
    if (member) {
        const isOwner = member.guild.ownerId === member.id;
        const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);
        if (isOwner || isAdmin) {
            hasPerm = true;
        }
    }
    if (!hasPerm) {
        hasPerm = await canUserManagePosts(
            interaction.guildId!,
            channelId,
            interaction.user.id,
            'create'
        );
    }
    if (!hasPerm) {
        await interaction.reply({
            content: 'You do not have permission to create posts in that channel.',
            ephemeral: true
        });
        return;
    }

    // Find the channel
    const channel = interaction.guild?.channels.cache.get(channelId);
    if (
        channel &&
        typeof channel === 'object' &&
        'send' in channel &&
        typeof (channel as any).send === 'function'
    ) {
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(content.length > 4096 ? content.substring(0, 4090) + '...' : content)
            .setColor(0x0099FF)
            .setAuthor({
                name: interaction.user.username,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();
        if (content.length > 4096) {
            embed.addFields({
                name: 'Note',
                value: 'Content was truncated. Full content is stored in the database.'
            });
        }
        // Store in database (full content, not truncated)
        // Send initial message with embed only
        const sentMsg = await (channel as any).send({ embeds: [embed] });
        // Store in database
        const post = await Post.create({
            guildId: interaction.guildId!,
            channelId: channel.id,
            messageId: sentMsg.id,
            title: title,
            content: content,
            authorId: interaction.user.id,
            authorName: interaction.user.username,
            tags: tags,
            attachments: []
        });
    // Footer and button logic moved below, just before editing message
        // Add footer and Edit button, then update message
        const createdAt = post.createdAt instanceof Date ? post.createdAt : new Date();
        let footerText = `Post #${post.id} | ${createdAt.toLocaleString()}`;
        if (tags.length > 0) {
            footerText = `Tags: ${tags.join(', ')} | ${footerText}`;
        }
        embed.setFooter({ text: footerText });
        const editButton = new ButtonBuilder()
            .setCustomId(`editpost:${interaction.user.id}:${title}:${post.id}`)
            .setLabel('Edit')
            .setStyle(ButtonStyle.Primary);
        const row = new ActionRowBuilder().addComponents(editButton);
        await sentMsg.edit({ embeds: [embed], components: [row] });
        await interaction.reply({
            content: `Post created successfully in <#${channel.id}>! ID: ${post.id}`,
            ephemeral: true
        });
        // Add footer with post number and creation date/time
        const createdAt = post.createdAt instanceof Date ? post.createdAt : new Date();
        let footerText = `Post #${post.id} | ${createdAt.toLocaleString()}`;
        if (tags.length > 0) {
            footerText = `Tags: ${tags.join(', ')} | ${footerText}`;
        }
        embed.setFooter({ text: footerText });
        // Edit the message to update the footer
        await sentMsg.edit({ embeds: [embed] });
        await interaction.reply({
            content: `Post created successfully in <#${channel.id}>! ID: ${post.id}`,
            ephemeral: true
        });
    } else {
        await interaction.reply({ content: 'Could not post in the selected channel (not a text channel).', ephemeral: true });
    }
}

// ...existing code...