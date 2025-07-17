import { Table, Column, Model, DataType, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
    tableName: 'server_configs',
    timestamps: true
})
export class ServerConfig extends Model {
    @Column({
        type: DataType.STRING,
        primaryKey: true,
        allowNull: false
    })
    declare guildId: string;

    @Column({
        type: DataType.JSON,
        defaultValue: []
    })
    declare allowedRoles: string[];

    @Column({
        type: DataType.STRING,
        allowNull: true
    })
    declare defaultChannelId?: string;

    @CreatedAt
    declare createdAt: Date;

    @UpdatedAt
    declare updatedAt: Date;
}