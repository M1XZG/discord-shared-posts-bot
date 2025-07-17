import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember, EmbedBuilder } from 'discord.js';
import { Post } from '../database/models/Post';
import { canManagePosts } from '../utils/permissions';

export const data = [
    new SlashCommandBuilder()
        .setName('snote-list')
        .setDescription('List all shared notes')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Filter by specific channel')
                .setRequired(false)
        ),
    new SlashCommandBuilder()
        .setName('sn-list')
        .setDescription('Short: List all shared notes')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Filter by specific channel')
                .setRequired(false)
        )
];

export async function execute(interaction: ChatInputCommandInteraction) {
    // Check permissions
    if (!await canManagePosts(interaction.member as GuildMember)) {
        await interaction.reply({ 
            content: 'You do not have permission to view shared posts.', 
            ephemeral: true 
        });
        return;
    }

    const channelFilter = interaction.options.getChannel('channel');
    
    // Build query
    const whereClause: any = { guildId: interaction.guildId };
    if (channelFilter) {
        whereClause.channelId = channelFilter.id;
    }

    const posts = await Post.findAll({ 
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit: 10
    });

    if (posts.length === 0) {
        await interaction.reply({ 
            content: 'No shared posts found.', 
            ephemeral: true 
        });
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle('Shared Posts')
        .setColor(0x0099FF)
        .setTimestamp();

    for (const post of posts) {
        const contentPreview = post.content.length > 100 
            ? post.content.substring(0, 100) + '...' 
            : post.content;
        
        embed.addFields({ 
            name: `ID: ${post.id}`, 
            value: `**${post.title}**\nBy: ${post.authorName}\nCreated: ${post.createdAt.toLocaleDateString()}` 
        });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
}