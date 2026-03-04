import bcrypt from 'bcrypt';

export const login = async (request, reply) => {
    const { User } = request.server.db.models;
    const { email, password } = request.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return reply.code(401).send({ error: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return reply.code(401).send({ error: 'Invalid email or password' });

    const token = request.server.jwt.sign(
        { 
            id: user.id, 
            role: user.role 
        }, 
        { expiresIn: '24h' }
    );

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        };
};

export const getMe = async (request, reply) => {
    return { user: request.user };
};