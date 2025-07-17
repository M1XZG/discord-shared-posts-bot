import { Interaction, ModalSubmitInteraction, ButtonInteraction, Collection, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, GuildMember } from 'discord.js';
import { handleCreatePostModal } from '../commands/createPost';
import { handleEditPostModal } from '../commands/editPost';
import { Post } from '../database/models/Post';
import { canManagePosts } from '../utils/permissions';

// This function should be called from your main bot file, passing the client and commands collection
export async function handleInteractionCreate(interaction: Interaction, commands: Collection<string, any>) {
    if (interaction.isAutocomplete && interaction.isAutocomplete()) {
        // Autocomplete for /editpost and /deletepost post ID
        if ((interaction.commandName === 'editpost' || interaction.commandName === 'snote-edit' || interaction.commandName === 'sn-edit' || interaction.commandName === 'snote-delete' || interaction.commandName === 'sn-delete') && interaction.options.getFocused(true).name === 'id') {
            const { Post } = await import('../database/models/Post');
            const posts = await Post.findAll({
                where: { guildId: interaction.guildId },
                order: [['createdAt', 'DESC']],
                limit: 25
            });
            const focused = interaction.options.getFocused();
            const choices = posts.map(post => ({
                name: `${post.title} (#${post.id})`,
                value: post.id.toString()
            })).filter(choice =>
                choice.name.toLowerCase().includes(focused.toLowerCase()) ||
                choice.value.includes(focused)
            );
            await interaction.respond(choices.slice(0, 25));
        }
        return;
    }
    if (interaction.isChatInputCommand()) {
        const command = commands.get(interaction.commandName);
        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`Error executing ${interaction.commandName}`);
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ 
                    content: 'There was an error while executing this command!', 
                    ephemeral: true 
                });
            } else {
                await interaction.reply({ 
                    content: 'There was an error while executing this command!', 
                    ephemeral: true 
                });
            }
        }
    } else if (interaction.isButton && interaction.isButton()) {
        // Handle Edit button: customId = editpost-btn-<postId>
        if (interaction.customId.startsWith('editpost-btn-')) {
            const postId = interaction.customId.replace('editpost-btn-', '');
            // Fetch the post from DB
            const post = await Post.findOne({ where: { id: postId, guildId: interaction.guildId } });
            if (!post) {
                await interaction.reply({ content: 'Post not found.', ephemeral: true });
                return;
            }
            // Permission check
            const member = interaction.member as GuildMember;
            if (!await canManagePosts(member)) {
                await interaction.reply({ content: 'You do not have permission to edit this post.', ephemeral: true });
                return;
            }
            // Show the edit modal
            const modal = new ModalBuilder()
                .setCustomId(`editpost-modal-${post.id}`)
                .setTitle('Edit Shared Post');
            const contentInput = new TextInputBuilder()
                .setCustomId('editpost-content')
                .setLabel('Content (supports markdown)')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setValue(post.content);
            modal.addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(contentInput)
            );
            await interaction.showModal(modal);
        }
    } else if (interaction.isModalSubmit()) {
        // Handle create post modal (now supports customId with channelId)
        if (interaction.customId.startsWith('createpost-modal:')) {
            await handleCreatePostModal(interaction as ModalSubmitInteraction);
        } else if (interaction.customId.startsWith('editpost-modal-')) {
            await handleEditPostModal(interaction as ModalSubmitInteraction);
        }
    }
}