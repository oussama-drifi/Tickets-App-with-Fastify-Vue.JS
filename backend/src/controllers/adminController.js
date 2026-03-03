import bcrypt from 'bcrypt';

export const createCommercial = async (request, reply) => {
    const { User } = request.server.db.models;
    const { name, email, password } = request.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return reply.code(400).send({ error: 'Commercial already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newCommercial = await User.create({
        name,
        email,
        password: hashedPassword,
        role: 'commercial'
    });

    return reply.code(201).send({ 
        message: 'Commercial account created successfully', 
        id: newCommercial.id 
    });
};

export const getAllTickets = async (request, reply) => {
    const { Ticket, User } = request.server.db.models;
    
    const tickets = await Ticket.findAll({
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
    const { User, Ticket } = request.server.db.models;
    const { id } = request.params;

    const commercial = await User.findOne({
        where: { id, role: 'commercial' },
        attributes: { exclude: ['password'] },
        include: [{ model: Ticket, as: 'tickets' }]
    });

    if (!commercial) return reply.code(404).send({ error: 'Commercial not found' });
    return commercial;
};

export const getTicketById = async (request, reply) => {
    const { Ticket, User } = request.server.db.models;
    const { id } = request.params;

    const ticket = await Ticket.findByPk(id, {
        include: [{ model: User, as: 'owner', attributes: ['email'] }]
    });

    if (!ticket) return reply.code(404).send({ error: 'Ticket not found' });
    return ticket;
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