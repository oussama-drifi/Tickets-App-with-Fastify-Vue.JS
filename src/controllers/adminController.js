import bcrypt from 'bcrypt';
import { saveProfileImage, deleteOldImage } from '../plugins/upload.js';

export const createCommercial = async (request, reply) => {
    const { User } = request.server.db.models;
    const fields = {};
    let profileImagePath = null;

    const parts = request.parts();

    for await (const part of parts) {
        if (part.type === 'file') {
            const result = await saveProfileImage(part);
            if (result.error) return reply.code(400).send({ error: result.error });
            profileImagePath = result.path;
        } else {
            fields[part.fieldname] = part.value;
        }
    }

    if (!fields.name || !fields.email || !fields.password) {
        return reply.code(400).send({ error: 'name, email, and password are required' });
    }

    const existingUser = await User.findOne({ where: { email: fields.email } });
    if (existingUser) return reply.code(400).send({ error: 'Commercial already exists' });

    const hashedPassword = await bcrypt.hash(fields.password, 10);
    const newCommercial = await User.create({
        name: fields.name,
        email: fields.email,
        password: hashedPassword,
        role: 'commercial',
        status: 'active',
        bio: fields.bio || null,
        profileImagePath
    });

    return reply.code(201).send({
        message: 'Commercial account created successfully',
        id: newCommercial.id
    });
};

export const updateCommercial = async (request, reply) => {
    const { User } = request.server.db.models;
    const { id } = request.params;

    const commercial = await User.findOne({ where: { id, role: 'commercial' } });
    if (!commercial) return reply.code(404).send({ error: 'Commercial not found' });

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

    if (fields.name) commercial.name = fields.name;
    if (fields.bio !== undefined) commercial.bio = fields.bio || null;
    if (fields.status) commercial.status = fields.status;

    if (newImagePath) {
        deleteOldImage(commercial.profileImagePath);
        commercial.profileImagePath = newImagePath;
    }

    await commercial.save();

    const { password, ...commercialData } = commercial.toJSON();
    return { message: 'Commercial updated successfully', commercial: commercialData };
};

export const getAllTickets = async (request, reply) => {
    const { Ticket, User } = request.server.db.models;

    const tickets = await Ticket.findAll({
        attributes: { exclude: ['imagePath'] },
        include: [{ model: User, as: 'owner', attributes: ['email'] }]
    });
    return tickets;
};

export const getAllCommercials = async (request, reply) => {
    const { User } = request.server.db.models;

    const commercials = await User.findAll({
        where: { role: 'commercial' },
        attributes: { exclude: ['password'] }
    });
    return commercials;
};

export const getCommercialById = async (request, reply) => {
    const { User } = request.server.db.models;
    const { id } = request.params;

    const commercial = await User.findOne({
        where: { id, role: 'commercial' },
        attributes: { exclude: ['password'] }
    });

    if (!commercial) return reply.code(404).send({ error: 'Commercial not found' });
    return commercial;
};

export const getCommercialTickets = async (request, reply) => {
    const { Ticket, User } = request.server.db.models;
    const { id } = request.params;

    const commercial = await User.findOne({ where: { id, role: 'commercial' } });
    if (!commercial) return reply.code(404).send({ error: 'Commercial not found' });

    const tickets = await Ticket.findAll({
        where: { userId: id },
        attributes: { exclude: ['imagePath'] }
    });
    return tickets;
};

export const getTicketImage = async (request, reply) => {
    const { Ticket } = request.server.db.models;
    const { id } = request.params;

    const ticket = await Ticket.findByPk(id, {
        attributes: ['id', 'imagePath']
    });

    if (!ticket) return reply.code(404).send({ error: 'Ticket not found' });
    return { id: ticket.id, imagePath: ticket.imagePath };
};

export const updateTicketStatus = async (request, reply) => {
    const { Ticket } = request.server.db.models;
    const { id } = request.params;
    const { status } = request.body;

    const ticket = await Ticket.findByPk(id);
    if (!ticket) return reply.code(404).send({ error: 'Ticket not found' });

    ticket.status = status;
    await ticket.save();

    return { message: `Ticket ${id} is now ${status}` };
};