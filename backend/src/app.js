// fastify instance
import Fastify from 'fastify';
// cors built-in plugin
import cors from '@fastify/cors';
// file uploads built-in plugin
import multipart from '@fastify/multipart';
// serve static files (uploaded images)
import fastifyStatic from '@fastify/static';
import { join } from 'node:path';
// plugins
import dbConnector from './plugins/db.js';
import authPlugin from './plugins/auth.js';
// routes
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import commercialRoutes from './routes/commercialRoutes.js';

// We export a function that creates the app instance
export async function buildApp(options = {}) {
    const app = Fastify(options);

    // Register Core Plugins
    await app.register(cors, { origin: true });

    // Register Multipart (for image uploads)
    await app.register(multipart, {
        limits: {
            fileSize: 5 * 1024 * 1024 // 5MB limit
        }
    });

    // Serve uploaded images
    await app.register(fastifyStatic, {
        root: join(process.cwd(), 'uploads'),
        prefix: '/uploads/'
    });

    // Register our Database Plugin
    await app.register(dbConnector);
    await app.register(authPlugin);

    // Basic Health Check Route
    app.get('/health', async () => {
        return { status: 'ok', timestamp: new Date() };
    });

    app.register(authRoutes, { prefix: '/api/auth' });
    app.register(adminRoutes, { prefix: '/api/admin' });
    app.register(commercialRoutes, { prefix: '/api/commercials' });

    return app;
}