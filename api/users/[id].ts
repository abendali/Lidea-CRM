import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest, hashPassword } from '../_lib/auth';
import * as storage from '../_lib/storage';
import { updateUserSchema } from '../../shared/schema';
import { z } from 'zod';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await getUserFromRequest(req);
  
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { id } = req.query;
  const userId = parseInt(id as string);

  if (isNaN(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  if (req.method === 'PATCH') {
    try {
      if (userId !== user.userId) {
        return res.status(403).json({ message: 'You can only update your own profile' });
      }
      
      const validatedData = updateUserSchema.parse(req.body);
      
      const updates = { ...validatedData };
      if (updates.password) {
        updates.password = await hashPassword(updates.password);
      }
      
      const updatedUser = await storage.updateUser(userId, updates);
      
      const { password, ...userWithoutPassword } = updatedUser;
      return res.status(200).json(userWithoutPassword);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      return res.status(500).json({ message: error.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
