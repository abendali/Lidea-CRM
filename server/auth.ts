import { Express, Request, Response, NextFunction } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { User as SelectUser, insertUserSchema } from "@shared/schema";
import { getJwtSecret } from "./config";

declare global {
  namespace Express {
    interface Request {
      user?: SelectUser;
    }
  }
}

const scryptAsync = promisify(scrypt);
const JWT_COOKIE_NAME = 'auth_token';

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

function generateToken(userId: number): string {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: '7d' });
}

function verifyToken(token: string): { userId: number } | null {
  try {
    return jwt.verify(token, getJwtSecret()) as { userId: number };
  } catch {
    return null;
  }
}

export async function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[JWT_COOKIE_NAME];
  
  if (!token) {
    return res.status(401).send("Unauthorized");
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.clearCookie(JWT_COOKIE_NAME);
    return res.status(401).send("Unauthorized");
  }

  const user = await storage.getUser(payload.userId);
  if (!user) {
    res.clearCookie(JWT_COOKIE_NAME);
    return res.status(401).send("Unauthorized");
  }

  req.user = user;
  next();
}

export function setupAuth(app: Express) {
  app.set("trust proxy", 1);

  app.post("/api/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).send("Email already exists");
      }

      const user = await storage.createUser({
        ...validatedData,
        password: await hashPassword(validatedData.password),
      });

      const token = generateToken(user.id);
      res.cookie(JWT_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      });

      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).send(error.message || "Invalid registration data");
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).send("Username and password are required");
      }

      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return res.status(401).send("Invalid credentials");
      }

      const token = generateToken(user.id);
      res.cookie(JWT_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      });

      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).send("Login failed");
    }
  });

  app.post("/api/logout", (req, res) => {
    res.clearCookie(JWT_COOKIE_NAME);
    res.sendStatus(200);
  });

  app.get("/api/user", ensureAuthenticated, (req, res) => {
    const { password, ...userWithoutPassword } = req.user!;
    res.json(userWithoutPassword);
  });
}
