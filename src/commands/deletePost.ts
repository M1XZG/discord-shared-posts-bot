import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { Post } from '../database/models/Post';
import { canManagePosts } from '../utils/permissions';

export const data = new SlashCommandBuilder()
    .setName('deletepost')
    .setDescription('Delete a shared post')
    .addStringOption(option =>
        option
            .setName('id')
            .setDescription('The ID of the post to delete')
            .setRequired(true)
    );

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

    try {
        // Try to delete the Discord message
        const channel = await interaction.guild!.channels.fetch(post.channelId);
        if (channel && channel.isTextBased()) {
            try {
                const message = await channel.messages.fetch(post.messageId);
                await message.delete();
            } catch (error) {
                console.log('Message already deleted or not found');
            }
        }

        // Remove from database
        await post.destroy();

        await interaction.reply({ 
            content: 'Post deleted successfully.', 
            ephemeral: true 
        });
    } catch (error) {
        console.error('Error deleting post:', error);
        await interaction.reply({ 
            content: 'Failed to delete the post.', 
            ephemeral: true 
        });
    }
}