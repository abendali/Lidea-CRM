import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from '../_lib/auth';
import * as storage from '../_lib/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await getUserFromRequest(req);
  
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { id } = req.query;
  const productId = parseInt(id as string);

  if (isNaN(productId)) {
    return res.status(400).json({ message: 'Invalid product ID' });
  }

  if (req.method === 'GET') {
    try {
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      return res.status(200).json(product);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await storage.deleteProduct(productId);
      return res.status(204).end();
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
