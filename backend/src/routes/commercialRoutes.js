import * as commercialController from '../controllers/commercialController.js';

export default async function commercialRoutes(fastify) {
    fastify.addHook('preHandler', async (request, reply) => {
        await fastify.authenticate(request, reply);
    });

    fastify.get('/tickets', commercialController.getMyTickets);
    fastify.post('/tickets', commercialController.createTicket);
}
