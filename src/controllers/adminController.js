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
            profileImagePath = result.url;
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
            newImagePath = result.url;
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
    const { Op } = request.server.db.sequelize.constructor;
    const { status, category, dateFrom, dateTo, page = 1, limit = 5 } = request.query;

    const where = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (dateFrom || dateTo) {
        where.ticketDate = {};
        if (dateFrom) where.ticketDate[Op.gte] = new Date(dateFrom);
        if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999);
            where.ticketDate[Op.lte] = to;
        }
    }

    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.max(1, parseInt(limit));

    const { count, rows } = await Ticket.findAndCountAll({
        where,
        attributes: { exclude: ['imagePath'] },
        include: [{ model: User, as: 'owner', attributes: ['email'] }],
        order: [['createdAt', 'DESC']],
        limit: pageSize,
        offset: (pageNum - 1) * pageSize
    });
    return { tickets: rows, total: count, page: pageNum, totalPages: Math.ceil(count / pageSize) };
};

export const searchCommercials = async (request, reply) => {
    const { User } = request.server.db.models;
    const { Op } = request.server.db.sequelize.constructor;
    const q = (request.query.q || '').trim();

    if (!q) return [];

    const commercials = await User.findAll({
        where: {
            role: 'commercial',
            name: { [Op.like]: `${q}%` }
        },
        attributes: ['id', 'name'],
        limit: 10,
    });
    return commercials;
};

export const getAllCommercials = async (request, reply) => {
    const { User, Ticket } = request.server.db.models;
    const { fn, col } = request.server.db.sequelize;

    const commercials = await User.findAll({
        where: { role: 'commercial' },
        attributes: {
            exclude: ['password'],
            include: [[fn('COUNT', col('tickets.id')), 'ticketsCount']]
        },
        include: [{
            model: Ticket,
            as: 'tickets',
            attributes: [],
        }],
        group: ['User.id'],
        subQuery: false,
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
    const { Op } = request.server.db.sequelize.constructor;
    const { id } = request.params;

    const commercial = await User.findOne({ where: { id, role: 'commercial' } });
    if (!commercial) return reply.code(404).send({ error: 'Commercial not found' });

    const { status, category, dateFrom, dateTo, page = 1, limit = 5 } = request.query;

    const where = { userId: id };
    if (status) where.status = status;
    if (category) where.category = category;
    if (dateFrom || dateTo) {
        where.ticketDate = {};
        if (dateFrom) where.ticketDate[Op.gte] = new Date(dateFrom);
        if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999);
            where.ticketDate[Op.lte] = to;
        }
    }

    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.max(1, parseInt(limit));

    const { count, rows } = await Ticket.findAndCountAll({
        where,
        attributes: { exclude: ['imagePath'] },
        order: [['createdAt', 'DESC']],
        limit: pageSize,
        offset: (pageNum - 1) * pageSize
    });
    return { tickets: rows, total: count, page: pageNum, totalPages: Math.ceil(count / pageSize) };
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