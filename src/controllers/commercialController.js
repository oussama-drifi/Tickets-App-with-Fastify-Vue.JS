import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { saveProfileImage, deleteOldImage } from '../plugins/upload.js';

export const getMyTickets = async (request, reply) => {
    const { Ticket } = request.server.db.models;

    const tickets = await Ticket.findAll({
        where: { userId: request.user.id },
        attributes: { exclude: ['imagePath'] }
    });

    return tickets;
};

export const getMyTicketImage = async (request, reply) => {
    const { Ticket } = request.server.db.models;
    const { id } = request.params;

    const ticket = await Ticket.findOne({
        where: { id, userId: request.user.id },
        attributes: ['id', 'imagePath']
    });

    if (!ticket) return reply.code(404).send({ error: 'Ticket not found' });
    return { id: ticket.id, imagePath: ticket.imagePath };
};

export const updateMyProfile = async (request, reply) => {
    const { User } = request.server.db.models;

    const user = await User.findByPk(request.user.id);
    if (!user) return reply.code(404).send({ error: 'User not found' });

    const fields = {};
    let newImagePath = null;

    const parts = request.parts();

    for await (const part of parts) {
        if (part.type === 'file') {
            const result = await saveProfileImage(part);
            if (result.error) return reply.code(400).send({ error: result.error });
            newImagePath = result.path;
        } else {
            fields[part.fieldname] = part.value;
        }
    }

    if (fields.name) user.name = fields.name;
    if (fields.bio !== undefined) user.bio = fields.bio || null;

    if (newImagePath) {
        deleteOldImage(user.profileImagePath);
        user.profileImagePath = newImagePath;
    }

    await user.save();

    const { password, ...userData } = user.toJSON();
    return { message: 'Profile updated successfully', user: userData };
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
