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

  const { id } = req.query;
  const orderId = parseInt(id as string);

  if (isNaN(orderId)) {
    return res.status(400).json({ message: 'Invalid order ID' });
  }

  if (req.method === 'PATCH') {
    try {
      const validatedData = insertWorkshopOrderSchema.partial().parse(req.body);
      const order = await storage.updateWorkshopOrder(orderId, validatedData);
      return res.status(200).json(order);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      return res.status(500).json({ message: error.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await storage.deleteWorkshopOrder(orderId);
      return res.status(204).end();
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
