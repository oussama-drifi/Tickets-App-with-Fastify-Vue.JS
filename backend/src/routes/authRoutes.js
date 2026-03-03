import * as authController from '../controllers/authController.js';

export default async function authRoutes(fastify) {
    fastify.post('/login', authController.login);

    fastify.get('/me', {
        preHandler: [fastify.authenticate]
    }, authController.getMe);
}