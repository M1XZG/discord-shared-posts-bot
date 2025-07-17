import { SlashCommandBuilder, ChatInputCommandInteraction, ChannelType, EmbedBuilder } from 'discord.js';
import { ChannelPermission } from '../database/models/ChannelPermission';

export const data = new SlashCommandBuilder()
    .setName('list-permissions')
    .setDescription('List which users have which permissions in which channel')
    .addChannelOption(option =>
        option.setName('channel')
            .setDescription('Channel to list permissions for (leave blank for all channels)')
            .setRequired(false)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    const channel = interaction.options.getChannel('channel');
    let permissions;
    if (channel) {
        permissions = await ChannelPermission.findAll({ where: { guildId: interaction.guildId, channelId: channel.id } });
    } else {
        permissions = await ChannelPermission.findAll({ where: { guildId: interaction.guildId } });
    }

    if (!permissions.length) {
        await interaction.reply({ content: 'No permissions found for the selected channel(s).', ephemeral: true });
        return;
    }

    // Group by channel
    const channelMap: Record<string, { userId: string, permission: string }[]> = {};
    for (const perm of permissions) {
        if (!channelMap[perm.channelId]) channelMap[perm.channelId] = [];
        const perms: string[] = [];
        if (perm.canCreate) perms.push('create');
        if (perm.canEdit) perms.push('edit');
        if (perm.canDelete) perms.push('delete');
        channelMap[perm.channelId].push({ userId: perm.userId, permission: perms.join(', ') || 'none' });
    }

    const embed = new EmbedBuilder()
        .setTitle('Channel Permissions')
        .setColor(0x00BFFF);

    for (const [chanId, perms] of Object.entries(channelMap)) {
        const userPerms = perms.map(p => `<@${p.userId}>: 
- ${p.permission}`).join('\n');
        embed.addFields({ name: `<#${chanId}>`, value: userPerms });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
}
