import fp from 'fastify-plugin';
import { Sequelize } from 'sequelize';
import bcrypt from 'bcrypt';
import { initUserModel } from '../models/User.js';
import { initTicketModel } from '../models/Ticket.js';
import 'dotenv/config';

async function dbConnector(fastify, options) {
    const sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASS,
        {
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT) || 3306,
            dialect: 'mysql',
            logging: false,
        }
    );

    const User = initUserModel(sequelize);
    const Ticket = initTicketModel(sequelize);

    User.hasMany(Ticket, { foreignKey: 'userId', as: 'tickets' });
    Ticket.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

    try {
        await sequelize.authenticate();
        // Sync models with DB (in dev only!)
        await sequelize.sync({ alter: true }); 
        
        fastify.log.info('success: Database connected and synced');

        // Seed default admin if none exists
        const adminExists = await User.findOne({ where: { role: 'admin' } });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'test123', 10);
            await User.create({
                name: 'Admin',
                email: process.env.ADMIN_EMAIL || 'test@example.com',
                password: hashedPassword,
                role: 'admin'
            });
            fastify.log.info('Default admin account created');
        }

        // Decorate fastify instance
        fastify.decorate('db', {
            sequelize,
            models: { User, Ticket }
        });
    } catch (error) {
        fastify.log.error('error: Database connection failed:', error);
    }
}

export default fp(dbConnector);