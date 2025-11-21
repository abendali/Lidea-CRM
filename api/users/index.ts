import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from '../_lib/auth';
import * as storage from '../_lib/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await getUserFromRequest(req);
  
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      return res.status(200).json(usersWithoutPasswords);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
