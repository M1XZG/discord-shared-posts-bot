import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const data = [
    new SlashCommandBuilder()
        .setName('snote-help')
        .setDescription('Show all available commands and their permissions'),
    new SlashCommandBuilder()
        .setName('sn-help')
        .setDescription('Short: Show all available commands and their permissions')
];

export async function execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
        .setTitle('📝 Shared Notes Bot - Command Help')
        .setDescription('**Here are all available commands and their required permissions:**')
        .setColor(0x0099FF)
        .addFields([
            {
                name: '📌 Note Management Commands',
                value:
                    `• **/snote-create** (or /sn-create) — *Permission required in channel*\n` +
                    `• **/snote-edit** (or /sn-edit) — *Permission required in channel*\n` +
                    `• **/snote-delete** (or /sn-delete) — *Permission required in channel*\n` +
                    `• **/snote-list** (or /sn-list) — *Allowed Role/Admin*`
            },
            {
                name: '⚙️ Configuration Commands',
                value:
                    `• **/snote-config** (or /sn-config) — *Server Owner Only*\n` +
                    `• **/config-grant** — *Admin/Owner: Grant user permission for a channel*`
            },
            {
                name: '📚 Help Commands',
                value:
                    `• **/snote-help** (or /sn-help) — *Everyone*`
            },
            {
                name: '🔐 Permission Details',
                value:
                    '• **Per-user, per-channel permissions**: Use `/config-grant` to allow a user to create, edit, or delete posts in a specific channel.\n' +
                    '• **Server Owner**: All commands\n' +
                    '• **Administrator**: Can grant permissions and manage posts\n' +
                    '• **Allowed Role**: Note/list commands\n' +
                    '• **Everyone**: Help command'
            }
        ])
        .setFooter({
            text: 'Tip: Use /sn- prefix for shorter command names!',
            iconURL: interaction.client.user?.displayAvatarURL()
        })
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}
