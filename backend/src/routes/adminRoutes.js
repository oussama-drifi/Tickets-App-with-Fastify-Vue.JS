import * as adminController from '../controllers/adminController.js';

export default async function adminRoutes(fastify) {
    // This hook runs for EVERY route in this file
    fastify.addHook('preHandler', async (request, reply) => {
        await fastify.authenticate(request, reply);
        await fastify.isAdmin(request, reply);
    });

    fastify.post('/commercials', adminController.createCommercial);
    fastify.get('/commercials', adminController.getAllCommercials);
    fastify.get('/commercials/:id', adminController.getCommercialById);

    fastify.get('/tickets', adminController.getAllTickets);
    fastify.get('/tickets/:id', adminController.getTicketById);
    fastify.patch('/tickets/:id/status', adminController.updateTicketStatus);
}