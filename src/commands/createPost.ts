import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ModalSubmitInteraction, MessageFlags } from 'discord.js';
import { Post } from '../database/models/Post';
import { canUserManagePosts } from '../utils/channelPermissions';

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
    // Check per-user, per-channel permission for the selected channel
    const hasPerm = await canUserManagePosts(
        interaction.guildId!,
        channel.id,
        interaction.user.id,
        'create'
    );
    if (!hasPerm) {
        await interaction.reply({
            content: 'You do not have permission to create posts in that channel.',
            ephemeral: true
        });
        return;
    }

    // Show modal for post creation
    const modal = new ModalBuilder()
        .setCustomId(`createpost-modal:${channel.id}`)
        .setTitle('Create Shared Note')
        .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId('title')
                    .setLabel('Title')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
            ),
            new ActionRowBuilder<TextInputBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId('content')
                    .setLabel('Content (supports markdown)')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true)
            ),
            new ActionRowBuilder<TextInputBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId('tags')
                    .setLabel('Tags (comma-separated, optional)')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)
            )
        );
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

    // Check per-user, per-channel permission for the selected channel
    const hasPerm = await canUserManagePosts(
        interaction.guildId!,
        channelId,
        interaction.user.id,
        'create'
    );
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
        if (tags.length > 0) {
            embed.setFooter({ text: `Tags: ${tags.join(', ')}` });
        }
        if (content.length > 4096) {
            embed.addFields({
                name: 'Note',
                value: 'Content was truncated. Full content is stored in the database.'
            });
        }
        const sentMsg = await (channel as any).send({ embeds: [embed] });
        // Store in database (full content, not truncated)
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
        await interaction.reply({
            content: `Post created successfully in <#${channel.id}>! ID: ${post.id}`,
            ephemeral: true
        });
    } else {
        await interaction.reply({ content: 'Could not post in the selected channel (not a text channel).', ephemeral: true });
    }
}

// ...existing code...