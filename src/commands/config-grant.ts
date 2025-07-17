import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { ChannelPermission } from '../database/models/ChannelPermission';

export const data = new SlashCommandBuilder()
    .setName('config-grant')
    .setDescription('Grant a user permission to manage posts in a specific channel')
    .addUserOption(option =>
        option.setName('user').setDescription('User to grant permission').setRequired(true)
    )
    .addChannelOption(option =>
        option.setName('channel').setDescription('Channel to grant permission in').setRequired(true)
    )
    .addStringOption(option =>
        option.setName('action').setDescription('Action to grant').setRequired(true)
        .addChoices(
            { name: 'Create', value: 'create' },
            { name: 'Edit', value: 'edit' },
            { name: 'Delete', value: 'delete' }
        )
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    // Only allow server owner or admin
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) && interaction.guild?.ownerId !== interaction.user.id) {
        await interaction.reply({ content: 'Only the server owner or an admin can grant permissions.', ephemeral: true });
        return;
    }
    const user = interaction.options.getUser('user', true);
    const channel = interaction.options.getChannel('channel', true);
    const action = interaction.options.getString('action', true);

    let perm = await ChannelPermission.findOne({ where: { guildId: interaction.guildId, channelId: channel.id, userId: user.id } });
    if (!perm) {
        perm = await ChannelPermission.create({
            guildId: interaction.guildId!,
            channelId: channel.id,
            userId: user.id,
            canCreate: false,
            canEdit: false,
            canDelete: false
        });
    }
    if (action === 'create') perm.canCreate = true;
    if (action === 'edit') perm.canEdit = true;
    if (action === 'delete') perm.canDelete = true;
    await perm.save();
    await interaction.reply({ content: `Granted ${action} permission to <@${user.id}> in <#${channel.id}>.`, ephemeral: true });
}
