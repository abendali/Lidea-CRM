import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from '../_lib/auth';
import * as storage from '../_lib/storage';
import { insertProductSchema } from '../../shared/schema';
import { z } from 'zod';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await getUserFromRequest(req);
  
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const products = await storage.getAllProducts();
      return res.status(200).json(products);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct({
        ...validatedData,
        createdBy: user.userId,
      });
      return res.status(201).json(product);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      return res.status(500).json({ message: error.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
