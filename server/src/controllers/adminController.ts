import { Request, Response } from 'express';
import prisma from '../prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const admin = await prisma.admin.findUnique({ where: { username } });

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const expiresInMinutes = 30;
    const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: `${expiresInMinutes}m` });
    res.json({
      token,
      username: admin.username,
      expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
};
