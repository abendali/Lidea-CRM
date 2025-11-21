import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from '../_lib/auth';
import * as storage from '../_lib/storage';
import { insertStockMovementSchema } from '../../shared/schema';
import { z } from 'zod';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await getUserFromRequest(req);
  
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const productId = req.query.productId ? parseInt(req.query.productId as string) : undefined;
      
      if (productId) {
        const movements = await storage.getStockMovementsByProduct(productId);
        return res.status(200).json(movements);
      } else {
        const movements = await storage.getAllStockMovements();
        return res.status(200).json(movements);
      }
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const validatedData = insertStockMovementSchema.parse(req.body);
      
      const product = await storage.getProduct(validatedData.productId as number);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      let newStock = product.stock;
      const movementType = validatedData.type as 'add' | 'subtract';
      const quantity = validatedData.quantity as number;
      
      if (movementType === 'add') {
        newStock += quantity;
      } else {
        newStock -= quantity;
      }

      if (newStock < 0) {
        return res.status(400).json({ message: 'Insufficient stock' });
      }

      const movement = await storage.createStockMovement({
        ...validatedData,
        createdBy: user.userId,
      });
      await storage.updateProductStock(validatedData.productId as number, newStock, user.userId);

      return res.status(201).json(movement);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      return res.status(500).json({ message: error.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
