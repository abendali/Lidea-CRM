import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from '../_lib/auth';
import * as storage from '../_lib/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await getUserFromRequest(req);
  
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    try {
      const { key, value } = req.body;
      
      if (!key || value === undefined) {
        return res.status(400).json({ message: 'Key and value are required' });
      }
      
      const setting = await storage.setSetting(key, value);
      return res.status(200).json(setting);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
