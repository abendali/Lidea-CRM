import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from '../_lib/auth';
import * as storage from '../_lib/storage';
import { insertProductStockSchema } from '../../shared/schema';
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
        const stocks = await storage.getProductStockByProduct(productId);
        return res.status(200).json(stocks);
      } else {
        const stocks = await storage.getAllProductStock();
        return res.status(200).json(stocks);
      }
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const validatedData = insertProductStockSchema.parse(req.body);
      
      const product = await storage.getProduct(validatedData.productId as number);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      const stock = await storage.createProductStock({
        ...validatedData,
        createdBy: user.userId,
      });

      const newTotalStock = product.stock + validatedData.quantity;
      await storage.updateProductStock(validatedData.productId as number, newTotalStock, user.userId);

      return res.status(201).json(stock);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      return res.status(500).json({ message: error.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
