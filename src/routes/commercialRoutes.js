import * as commercialController from '../controllers/commercialController.js';

export default async function commercialRoutes(fastify) {
    fastify.addHook('preHandler', async (request, reply) => {
        await fastify.authenticate(request, reply);
    });

    fastify.patch('/profile', commercialController.updateMyProfile);
    fastify.get('/tickets', commercialController.getMyTickets);
    fastify.get('/tickets/:id/image', commercialController.getMyTicketImage);
    fastify.post('/tickets', commercialController.createTicket);
}
