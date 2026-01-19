import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/prismaInstance';
import { OAuth2Client } from 'google-auth-library';

const secret = process.env.JWT_SECRET || 'super-secret-key';
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    res.status(201).json({ message: 'User created', user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid account' });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.password || '');
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid account' });
      return;
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, secret, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required' });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Invalid Google token' });
    }

    const { email, name, sub: googleId } = payload;

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          name: name || '',
          googleId,
          // password is optional in schema now
        },
      });
    } else if (!user.googleId) {
      // Link existing user with Google account
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId },
      });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, secret, { expiresIn: '1h' });

    res.json({
      token: token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

export const getMe = async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, name: true, createdAt: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const { email, password, confirm }: { email: string; password: string; confirm: boolean } = req.body;
    if (!confirm) {
      return res.status(400).json({ error: 'Confirmation required to delete account' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.findUnique({ where: { email, password: hashedPassword } });
    if (!user) {
      return res.status(404).json({ error: 'Email or password is not found' });
    }
    await prisma.user.delete({ where: { id: user.id } });

    res.json({ message: 'Account deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
