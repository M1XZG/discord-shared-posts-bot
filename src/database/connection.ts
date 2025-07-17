import { Sequelize } from 'sequelize-typescript';
import { ServerConfig } from './models/ServerConfig';
import { Post } from './models/Post';
import { ChannelPermission } from './models/ChannelPermission';

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './data/database.sqlite',
    logging: false,
    models: [ServerConfig, Post, ChannelPermission]
});

export async function initializeDatabase() {
    try {
        await sequelize.authenticate();
        console.log('Database connection established.');
        
        await sequelize.sync();
        console.log('Database synchronized.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

export { sequelize };