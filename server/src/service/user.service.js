import { prisma, jwtSecret } from '../../config.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const registerUser = async (username, email, password) => {
    // check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error('User already exists with this email');
  
    const hashedPassword = await bcrypt.hash(password, 10);
  
    const user = await prisma.user.create({
      data: { username, email, password: hashedPassword },
    });

    return user;
};

export const loginUser = async (email, password) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('User not found');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new Error('Invalid password');

    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        jwtSecret,
        { expiresIn: '1d' });

    return { token, user: { id: user.id, username: user.username, email: user.email, role: user.role } };
};