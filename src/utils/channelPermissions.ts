import { ChannelPermission } from '../database/models/ChannelPermission';

/**
 * Checks if a user has permission for a specific action in a channel.
 * @param guildId The guild/server ID
 * @param channelId The channel ID
 * @param userId The user ID
 * @param action One of 'create' | 'edit' | 'delete'
 * @returns boolean
 */
export async function canUserManagePosts(guildId: string, channelId: string, userId: string, action: 'create' | 'edit' | 'delete'): Promise<boolean> {
    const perm = await ChannelPermission.findOne({ where: { guildId, channelId, userId } });
    if (!perm) return false;
    if (action === 'create') return perm.canCreate;
    if (action === 'edit') return perm.canEdit;
    if (action === 'delete') return perm.canDelete;
    return false;
}
