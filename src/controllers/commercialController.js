import { saveProfileImage, deleteOldImage } from '../plugins/upload.js';
import { saveTicketImage } from '../plugins/r2.js';

export const getMyTickets = async (request, reply) => {
    const { Ticket } = request.server.db.models;
    const { Op } = request.server.db.sequelize.constructor;
    const { status, category, dateFrom, dateTo, page = 1, limit = 5 } = request.query;

    const where = { userId: request.user.id };
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
            newImagePath = result.url;
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
            const result = await saveTicketImage(part);
            if (result.error) return reply.code(400).send({ error: result.error });
            imagePath = result.url;
        } else {
            fields[part.fieldname] = part.value;
        }
    }

    if (!imagePath) {
        return reply.code(400).send({ error: 'Image file is required' });
    }

    if (!fields.title || !fields.amount || !fields.ticketDate || !fields.category) {
        return reply.code(400).send({ error: 'title, amount, ticketDate, and category are required' });
    }

    const validCategories = ['restaurant', 'hotel', 'work'];
    if (!validCategories.includes(fields.category)) {
        return reply.code(400).send({ error: `category must be one of: ${validCategories.join(', ')}` });
    }

    const ticket = await Ticket.create({
        title: fields.title,
        description: fields.description || null,
        amount: parseFloat(fields.amount),
        category: fields.category,
        imagePath,
        ticketDate: new Date(fields.ticketDate),
        userId: request.user.id
    });

    return reply.code(201).send({
        message: 'Ticket created successfully',
        ticket
    });
};
