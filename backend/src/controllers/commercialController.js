import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

export const getMyTickets = async (request, reply) => {
    const { Ticket } = request.server.db.models;

    const tickets = await Ticket.findAll({
        where: { userId: request.user.id }
    });

    return tickets;
};

export const createTicket = async (request, reply) => {
    const { Ticket } = request.server.db.models;
    const fields = {};
    let imagePath = null;

    const parts = request.parts();

    for await (const part of parts) {
        if (part.type === 'file') {
            const ext = part.filename.substring(part.filename.lastIndexOf('.'));
            const filename = `${randomUUID()}${ext}`;
            const destPath = join(process.cwd(), 'uploads', filename);

            await pipeline(part.file, createWriteStream(destPath));
            imagePath = `uploads/${filename}`;
        } else {
            fields[part.fieldname] = part.value;
        }
    }

    if (!imagePath) {
        return reply.code(400).send({ error: 'Image file is required' });
    }

    if (!fields.title || !fields.amount || !fields.ticketDate) {
        return reply.code(400).send({ error: 'title, amount, and ticketDate are required' });
    }

    const ticket = await Ticket.create({
        title: fields.title,
        description: fields.description || null,
        amount: parseFloat(fields.amount),
        imagePath,
        ticketDate: new Date(fields.ticketDate),
        userId: request.user.id
    });

    return reply.code(201).send({
        message: 'Ticket created successfully',
        ticket
    });
};
