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

  const { id } = req.query;
  const stockId = parseInt(id as string);

  if (isNaN(stockId)) {
    return res.status(400).json({ message: 'Invalid stock ID' });
  }

  if (req.method === 'GET') {
    try {
      const stock = await storage.getProductStock(stockId);
      
      if (!stock) {
        return res.status(404).json({ message: 'Product stock not found' });
      }
      
      return res.status(200).json(stock);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const validatedData = insertProductStockSchema.partial().parse(req.body);
      
      if (validatedData.productId !== undefined) {
        return res.status(400).json({ message: 'Cannot change product ID of a stock entry' });
      }

      const currentStock = await storage.getProductStock(stockId);
      if (!currentStock) {
        return res.status(404).json({ message: 'Product stock not found' });
      }

      const product = await storage.getProduct(currentStock.productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      if (validatedData.quantity !== undefined && validatedData.quantity !== currentStock.quantity) {
        const quantityDelta = validatedData.quantity - currentStock.quantity;
        const newTotalStock = product.stock + quantityDelta;
        
        if (newTotalStock < 0) {
          return res.status(400).json({ message: 'Cannot reduce stock below zero' });
        }
        
        const updatedStock = await storage.updateProductStockEntry(stockId, validatedData);
        await storage.updateProductStock(currentStock.productId, newTotalStock, user.userId);
        
        return res.status(200).json(updatedStock);
      } else {
        const updatedStock = await storage.updateProductStockEntry(stockId, validatedData);
        return res.status(200).json(updatedStock);
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      return res.status(500).json({ message: error.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const stock = await storage.getProductStock(stockId);
      if (!stock) {
        return res.status(404).json({ message: 'Product stock not found' });
      }

      const product = await storage.getProduct(stock.productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      const newTotalStock = product.stock - stock.quantity;
      if (newTotalStock < 0) {
        return res.status(400).json({ message: 'Cannot reduce stock below zero' });
      }

      await storage.deleteProductStock(stockId);
      await storage.updateProductStock(stock.productId, newTotalStock, user.userId);

      return res.status(204).end();
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
