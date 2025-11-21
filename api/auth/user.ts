import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from '../_lib/auth';
import * as storage from '../_lib/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const tokenPayload = await getUserFromRequest(req);
    
    if (!tokenPayload) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await storage.getUser(tokenPayload.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { password, ...userWithoutPassword } = user;
    return res.status(200).json(userWithoutPassword);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
}
