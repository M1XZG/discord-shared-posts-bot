import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember, PermissionFlagsBits, ChannelType, MessageFlags } from 'discord.js';
import { ServerConfig } from '../database/models/ServerConfig';
import { isServerOwner } from '../utils/permissions';

export const data = new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configure bot settings for this server')
    .addSubcommand(subcommand =>
        subcommand
            .setName('setchannel')
            .setDescription('Set the default channel for shared posts')
            .addChannelOption(option =>
                option
                    .setName('channel')
                    .setDescription('The channel to use for shared posts')
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('createrole')
            .setDescription('Create a role with permissions to manage posts in the configured channel')
            .addStringOption(option =>
                option
                    .setName('name')
                    .setDescription('Name for the new role')
                    .setRequired(false)
            )
            .addUserOption(option =>
                option
                    .setName('user1')
                    .setDescription('First user to add to the role')
                    .setRequired(false)
            )
            .addUserOption(option =>
                option
                    .setName('user2')
                    .setDescription('Second user to add to the role')
                    .setRequired(false)
            )
            .addUserOption(option =>
                option
                    .setName('user3')
                    .setDescription('Third user to add to the role')
                    .setRequired(false)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('assignrole')
            .setDescription('Add or remove users from a shared posts role')
            .addRoleOption(option =>
                option
                    .setName('role')
                    .setDescription('The role to manage')
                    .setRequired(true)
            )
            .addUserOption(option =>
                option
                    .setName('user')
                    .setDescription('The user to add/remove')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName('action')
                    .setDescription('Add or remove the user')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Add', value: 'add' },
                        { name: 'Remove', value: 'remove' }
                    )
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('addrole')
            .setDescription('Add a role that can manage shared posts')
            .addRoleOption(option =>
                option
                    .setName('role')
                    .setDescription('The role to add')
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('removerole')
            .setDescription('Remove a role from managing shared posts')
            .addRoleOption(option =>
                option
                    .setName('role')
                    .setDescription('The role to remove')
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('listroles')
            .setDescription('List all roles that can manage shared posts')
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('info')
            .setDescription('Show current bot configuration')
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    // Check if user is server owner
    if (!interaction.guild || !isServerOwner(interaction.member as GuildMember)) {
        await interaction.reply({ 
            content: 'Only the server owner can configure bot settings.', 
            flags: MessageFlags.Ephemeral 
        });
        return;
    }

    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    // Get or create server config
    const [config] = await ServerConfig.findOrCreate({
        where: { guildId },
        defaults: { allowedRoles: [] }
    });

    switch (subcommand) {
        case 'setchannel': {
            const channel = interaction.options.getChannel('channel', true);
            
            await config.update({ defaultChannelId: channel.id });
            
            await interaction.reply({ 
                content: `Set <#${channel.id}> as the default channel for shared posts.`, 
                flags: MessageFlags.Ephemeral 
            });
            break;
        }

        case 'createrole': {
            console.log('Config state:', {
                guildId: config.guildId,
                defaultChannelId: config.defaultChannelId,
                allowedRoles: config.allowedRoles
            });

            if (!config.defaultChannelId) {
                await interaction.reply({
                    content: 'Please set a default channel first using `/config setchannel`.',
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            try {
                const roleName = interaction.options.getString('name') || 'Shared Posts Manager';

                console.log(`Creating role with name: ${roleName}`);

                // Create the role
                const role = await interaction.guild.roles.create({
                    name: roleName,
                    color: 0x3498db, // Nice blue color
                    reason: 'Auto-created role for shared posts management',
                    permissions: [] // Start with no permissions, we'll set channel-specific ones
                });

                console.log(`Role created successfully: ${role.name} (${role.id})`);

                // Get the channel
                const channel = await interaction.guild.channels.fetch(config.defaultChannelId);
                if (!channel || !channel.isTextBased()) {
                    await interaction.editReply('Default channel not found.');
                    return;
                }

                // Set channel-specific permissions
                if (channel && !channel.isThread()) {
                    console.log(`Setting permissions for role in channel ${channel.name}`);
                    await channel.permissionOverwrites.create(role.id, {
                        ViewChannel: true,
                        SendMessages: true,
                        ManageMessages: true,
                        ReadMessageHistory: true,
                        EmbedLinks: true,
                        AttachFiles: true
                    });
                    console.log('Channel permissions set successfully');
                }

                // Save the role to the database!
                const allowedRoles = config.allowedRoles || [];
                const updatedRoles = [...allowedRoles, role.id];
                config.allowedRoles = updatedRoles;
                await config.save();
                console.log('Role added to allowed roles in database');

                // After saving, verify it was saved
                const verifyConfig = await ServerConfig.findOne({ where: { guildId } });
                console.log('Verified saved roles:', verifyConfig?.allowedRoles);

                // Add users to the role if specified
                const addedUsers = [];
                for (let i = 1; i <= 3; i++) {
                    const user = interaction.options.getUser(`user${i}`);
                    if (user) {
                        try {
                            const member = await interaction.guild.members.fetch(user.id);
                            await member.roles.add(role.id);
                            addedUsers.push(user.username);
                            console.log(`Added ${user.username} to role`);
                        } catch (error) {
                            console.error(`Failed to add role to ${user.username}:`, error);
                        }
                    }
                }

                let responseMessage = `Created role ${role} with permissions to manage posts in <#${channel.id}>.`;
                if (addedUsers.length > 0) {
                    responseMessage += `\n\nAdded to role: ${addedUsers.join(', ')}`;
                }
                responseMessage += '\n\nUse `/config assignrole` to add more users to this role.';

                await interaction.editReply({ content: responseMessage });
            } catch (error) {
                console.error('Error creating role:', error);
                await interaction.editReply(`Failed to create role. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
            break;
        }

        case 'assignrole': {
            const role = interaction.options.getRole('role', true);
            const user = interaction.options.getUser('user', true);
            const action = interaction.options.getString('action', true);

            // Add debugging
            console.log('Assign role debug:', {
                roleId: role.id,
                roleName: role.name,
                allowedRoles: config.allowedRoles
            });

            // Verify this is an allowed role
            const allowedRoles = config.allowedRoles || [];
            if (!allowedRoles.includes(role.id)) {
                await interaction.reply({ 
                    content: 'This role is not configured for shared posts management. Add it with `/config addrole` first.', 
                    flags: MessageFlags.Ephemeral 
                });
                return;
            }

            try {
                const member = await interaction.guild.members.fetch(user.id);
                
                if (action === 'add') {
                    await member.roles.add(role.id);
                    await interaction.reply({ 
                        content: `Added ${user.username} to ${role.name}.`, 
                        ephemeral: true 
                    });
                } else {
                    await member.roles.remove(role.id);
                    await interaction.reply({ 
                        content: `Removed ${user.username} from ${role.name}.`, 
                        ephemeral: true 
                    });
                }
            } catch (error) {
                console.error('Error managing role assignment:', error);
                await interaction.reply({ 
                    content: 'Failed to update role assignment. Please check my permissions.', 
                    ephemeral: true 
                });
            }
            break;
        }

        case 'addrole': {
            const role = interaction.options.getRole('role', true);
            const allowedRoles = config.allowedRoles || [];
            
            if (allowedRoles.includes(role.id)) {
                await interaction.reply({ 
                    content: 'This role is already allowed to manage shared posts.', 
                    ephemeral: true 
                });
                return;
            }

            // Create a new array to force Sequelize to detect the change
            const updatedRoles = [...allowedRoles, role.id];
            config.allowedRoles = updatedRoles;
            await config.save();
            
            // Alternative approach if the above doesn't work:
            // await ServerConfig.update(
            //     { allowedRoles: updatedRoles },
            //     { where: { guildId: interaction.guildId } }
            // );

            // If a default channel is set, add permissions for this role
            if (config.defaultChannelId) {
                try {
                    const channel = await interaction.guild.channels.fetch(config.defaultChannelId);
                    if (channel && !channel.isThread()) {
                        await channel.permissionOverwrites.create(role.id, {
                            ViewChannel: true,
                            SendMessages: true,
                            ManageMessages: true,
                            ReadMessageHistory: true,
                            EmbedLinks: true,
                            AttachFiles: true
                        });
                        
                        await interaction.reply({ 
                            content: `Added ${role.name} to allowed roles and granted permissions in <#${channel.id}>.`, 
                            ephemeral: true 
                        });
                    } else {
                        await interaction.reply({ 
                            content: `Added ${role.name} to allowed roles.`, 
                            ephemeral: true 
                        });
                    }
                } catch (error) {
                    console.error('Error setting channel permissions:', error);
                    await interaction.reply({ 
                        content: `Added ${role.name} to allowed roles, but couldn't set channel permissions.`, 
                        ephemeral: true 
                    });
                }
            } else {
                await interaction.reply({ 
                    content: `Added ${role.name} to allowed roles.`, 
                    ephemeral: true 
                });
            }
            break;
        }

        case 'removerole': {
            const role = interaction.options.getRole('role', true);
            const allowedRoles = config.allowedRoles || [];
            
            const index = allowedRoles.indexOf(role.id);
            if (index === -1) {
                await interaction.reply({ 
                    content: 'This role is not in the allowed list.', 
                    ephemeral: true 
                });
                return;
            }

            allowedRoles.splice(index, 1);
            await config.update({ allowedRoles });
            
            await interaction.reply({ 
                content: `Removed ${role.name} from allowed roles.`, 
                ephemeral: true 
            });
            break;
        }

        case 'listroles': {
            const allowedRoles = config.allowedRoles || [];
            
            if (allowedRoles.length === 0) {
                await interaction.reply({ 
                    content: 'No roles are configured. Server owner and administrators can always manage posts.', 
                    ephemeral: true 
                });
                return;
            }

            const roleNames = allowedRoles.map(roleId => `<@&${roleId}>`).join(', ');
            await interaction.reply({ 
                content: `Allowed roles: ${roleNames}\n*Note: Server owner and administrators can always manage posts.*`, 
                ephemeral: true 
            });
            break;
        }

        case 'info': {
            const allowedRoles = config.allowedRoles || [];
            const rolesList = allowedRoles.length > 0 
                ? allowedRoles.map(roleId => `<@&${roleId}>`).join(', ')
                : 'None (only owner and admins)';
            
            const channelInfo = config.defaultChannelId 
                ? `<#${config.defaultChannelId}>`
                : 'Not set';

            await interaction.reply({ 
                content: `**Bot Configuration**\n\n**Default Channel:** ${channelInfo}\n**Allowed Roles:** ${rolesList}`, 
                ephemeral: true 
            });
            break;
        }
    }
}