import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyPassword, signToken, setAuthCookie } from '../_lib/auth';
import * as storage from '../_lib/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await storage.getUserByUsername(username);
    
    if (!user || !(await verifyPassword(user.password, password))) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = signToken({
      userId: user.id,
      username: user.username,
    });

    setAuthCookie(res, token);

    const { password: _, ...userWithoutPassword } = user;
    return res.status(200).json(userWithoutPassword);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
}
