import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';

async function authPlugin(fastify, opts) {
    // first Register the JWT plugin
    await fastify.register(fastifyJwt, { secret: process.env.JWT_SECRET });

    // for routes that require a login.
    fastify.decorate('authenticate', async (request, reply) => {
        try {
            await request.jwtVerify(); // Automatically looks for 'Authorization: Bearer <token>'
        } catch (err) {
            reply.code(401).send({ error: 'Unauthorized: Invalid or missing token' });
        }
    });

    // for routes like "Create Commercial Account" or "Verify Ticket"
    fastify.decorate('isAdmin', async (request, reply) => {
        // We check the role that was encoded in the JWT payload
        if (request.user.role !== 'admin') {
            reply.code(403).send({ error: 'Forbidden: Admin access required' });
        }
    });
}

export default fp(authPlugin);