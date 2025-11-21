import type { VercelRequest, VercelResponse } from '@vercel/node';
import { insertUserSchema } from '../../shared/schema';
import { hashPassword, signToken, setAuthCookie } from '../_lib/auth';
import * as storage from '../_lib/storage';
import { z } from 'zod';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const validatedData = insertUserSchema.parse(req.body);
    
    const existingUser = await storage.getUserByUsername(validatedData.username);
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const existingEmail = await storage.getUserByEmail(validatedData.email);
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const user = await storage.createUser({
      ...validatedData,
      password: await hashPassword(validatedData.password),
    });

    const token = signToken({
      userId: user.id,
      username: user.username,
    });

    setAuthCookie(res, token);

    const { password, ...userWithoutPassword } = user;
    return res.status(201).json(userWithoutPassword);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    return res.status(400).json({ message: error.message || 'Invalid registration data' });
  }
}
