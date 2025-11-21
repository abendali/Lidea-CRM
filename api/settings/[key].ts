import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from '../_lib/auth';
import * as storage from '../_lib/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await getUserFromRequest(req);
  
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { key } = req.query;

  if (!key || typeof key !== 'string') {
    return res.status(400).json({ message: 'Invalid key' });
  }

  if (req.method === 'GET') {
    try {
      const setting = await storage.getSetting(key);
      
      if (!setting) {
        return res.status(404).json({ message: 'Setting not found' });
      }
      
      return res.status(200).json(setting);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
