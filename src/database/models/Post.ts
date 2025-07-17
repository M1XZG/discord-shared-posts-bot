import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { ServerConfig } from './ServerConfig';

@Table({
    tableName: 'posts',
    timestamps: true
})
export class Post extends Model {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true
    })
    declare id: number;

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    declare guildId: string;

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    declare channelId: string;

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    declare messageId: string;

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    declare title: string;

    @Column({
        type: DataType.TEXT,
        allowNull: false
    })
    declare content: string;

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    declare authorId: string;

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    declare authorName: string;

    @Column({
        type: DataType.STRING,
        allowNull: true
    })
    declare lastEditedBy?: string;

    @Column({
        type: DataType.JSON,
        defaultValue: []
    })
    declare attachments: string[];

    @Column({
        type: DataType.JSON,
        defaultValue: []
    })
    declare tags: string[];

    @CreatedAt
    declare createdAt: Date;

    @UpdatedAt
    declare updatedAt: Date;
}