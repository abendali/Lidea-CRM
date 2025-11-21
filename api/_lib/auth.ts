import jwt from 'jsonwebtoken';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import type { IncomingMessage, ServerResponse } from 'http';
import cookie from 'cookie';

const scryptAsync = promisify(scrypt);

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable must be set for production deployment');
}

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRY = '7d';

export interface TokenPayload {
  userId: number;
  username: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

export async function verifyPassword(
  storedPassword: string,
  suppliedPassword: string,
): Promise<boolean> {
  const [hashedPassword, salt] = storedPassword.split('.');
  const hashedPasswordBuf = Buffer.from(hashedPassword, 'hex');
  const suppliedPasswordBuf = (await scryptAsync(
    suppliedPassword,
    salt,
    64,
  )) as Buffer;
  return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export function setAuthCookie(res: ServerResponse, token: string): void {
  const cookieValue = cookie.serialize('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });
  res.setHeader('Set-Cookie', cookieValue);
}

export function clearAuthCookie(res: ServerResponse): void {
  const cookieValue = cookie.serialize('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  res.setHeader('Set-Cookie', cookieValue);
}

export function getTokenFromRequest(req: IncomingMessage): string | null {
  const cookies = cookie.parse(req.headers.cookie || '');
  return cookies.auth_token || null;
}

export async function getUserFromRequest(req: IncomingMessage): Promise<TokenPayload | null> {
  const token = getTokenFromRequest(req);
  if (!token) {
    return null;
  }
  return verifyToken(token);
}
