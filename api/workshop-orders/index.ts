import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from '../_lib/auth';
import * as storage from '../_lib/storage';
import { insertWorkshopOrderSchema } from '../../shared/schema';
import { z } from 'zod';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await getUserFromRequest(req);
  
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const orders = await storage.getAllWorkshopOrders();
      return res.status(200).json(orders);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const validatedData = insertWorkshopOrderSchema.parse(req.body);
      const order = await storage.createWorkshopOrder({
        ...validatedData,
        createdBy: user.userId,
      });
      return res.status(201).json(order);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      return res.status(500).json({ message: error.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
