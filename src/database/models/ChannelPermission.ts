import { Table, Column, Model, DataType, PrimaryKey } from 'sequelize-typescript';

@Table({
    tableName: 'channel_permissions',
    timestamps: false
})
export class ChannelPermission extends Model {
    @PrimaryKey
    @Column({ type: DataType.STRING })
    declare guildId: string;

    @PrimaryKey
    @Column({ type: DataType.STRING })
    declare channelId: string;

    @PrimaryKey
    @Column({ type: DataType.STRING })
    declare userId: string;

    @Column({ type: DataType.BOOLEAN, defaultValue: false })
    declare canCreate: boolean;

    @Column({ type: DataType.BOOLEAN, defaultValue: false })
    declare canEdit: boolean;

    @Column({ type: DataType.BOOLEAN, defaultValue: false })
    declare canDelete: boolean;
}
