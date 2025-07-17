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
        ),
    new SlashCommandBuilder()
        .setName('sn-create')
        .setDescription('Short: Create a new shared note')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Channel to post the note in')
                .setRequired(true)
        )
];

export async function execute(interaction: ChatInputCommandInteraction) {
            // Check per-user, per-channel permission
            const hasPerm = await canUserManagePosts(
                interaction.guildId!,
                interaction.channelId,
                interaction.user.id,
                'create'
            );
            if (!hasPerm) {
                await interaction.reply({ 
                    content: 'You do not have permission to create posts in this channel.', 
                    ephemeral: true 
                });
                return;
    }

    // Get the selected channel
    const channel = interaction.options.getChannel('channel', true);

    // Show modal for post creation, encode channelId in customId
    const modal = new ModalBuilder()
        .setCustomId(`createpost-modal:${channel.id}`)
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
        // Extract channelId from customId
        const match = interaction.customId.match(/^createpost-modal:(\d+)$/);
        const channelId = match ? match[1] : null;
        if (!channelId) {
            await interaction.reply({ content: 'Could not determine channel for post.', ephemeral: true });
            return;
        }

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

        // Fetch the selected channel
        const channel = await interaction.guild?.channels.fetch(channelId);
        if (!channel || !channel.isTextBased()) {
            await interaction.reply({ content: 'Selected channel not found or not text-based.', ephemeral: true });
            return;
        }

        // Send the post to the selected channel
        const sentMsg = await channel.send({ embeds: [embed] });

        // Store in database (full content, not truncated)
        const post = await Post.create({
            guildId: interaction.guildId!,
            channelId: channelId,
            messageId: sentMsg.id,
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
        await sentMsg.edit({ embeds: [embed], components: [row.toJSON()] });

        // Confirm to the user in the original channel
        await interaction.reply({ 
            content: `Post created successfully in <#${channelId}>! ID: ${post.id}`, 
            flags: MessageFlags.Ephemeral 
        });
    } catch (error) {
        console.error('Error in handleCreatePostModal:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'An error occurred while creating the post.', flags: MessageFlags.Ephemeral });
        } else {
            await interaction.followUp({ content: 'An error occurred while creating the post.', flags: MessageFlags.Ephemeral });
        }
    }
}