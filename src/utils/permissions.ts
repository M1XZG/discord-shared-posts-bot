import { GuildMember, PermissionFlagsBits } from 'discord.js';
import { ServerConfig } from '../database/models/ServerConfig';

export async function canManagePosts(member: GuildMember): Promise<boolean> {
    // Server owner always has permission
    if (member.guild.ownerId === member.id) {
        return true;
    }

    // Administrators always have permission
    if (member.permissions.has(PermissionFlagsBits.Administrator)) {
        return true;
    }

    // Check configured roles
    const config = await ServerConfig.findOne({
        where: { guildId: member.guild.id }
    });

    if (!config || !config.allowedRoles || config.allowedRoles.length === 0) {
        return false;
    }

    // Check if member has any of the allowed roles
    return member.roles.cache.some(role => 
        config.allowedRoles.includes(role.id)
    );
}

export function isServerOwner(member: GuildMember): boolean {
    return member.guild.ownerId === member.id;
}

// For backward compatibility if you have files using checkPermissions
export const checkPermissions = canManagePosts;