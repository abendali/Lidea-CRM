import { Express, Request, Response, NextFunction } from "express";
import { supabase } from "./supabase";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

interface AuthRequest extends Request {
  user?: SelectUser;
}

export function ensureAuthenticated(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send("Unauthorized");
  }

  const token = authHeader.substring(7);

  supabase.auth.getUser(token).then(async ({ data, error }) => {
    if (error || !data.user) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const user = await storage.getUserByEmail(data.user.email!);
      if (!user) {
        return res.status(401).send("User not found in database");
      }
      req.user = user;
      next();
    } catch (err) {
      res.status(401).send("Unauthorized");
    }
  }).catch(() => {
    res.status(401).send("Unauthorized");
  });
}

export async function setupAuth(app: Express) {
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, username, name } = req.body;

      if (!email || !password || !username) {
        return res.status(400).send("Email, password, and username are required");
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).send("Email already exists");
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        return res.status(400).send(authError.message);
      }

      if (!authData.user) {
        return res.status(400).send("Failed to create user");
      }

      const user = await storage.createUser({
        username,
        email,
        password: '',
        name: name || undefined,
      });

      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({
        user: userWithoutPassword,
        session: authData.session,
      });
    } catch (error: any) {
      console.error('Register error:', error);
      res.status(400).send(error.message || "Invalid registration data");
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).send("Email and password required");
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return res.status(401).send("Invalid credentials");
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).send("User not found");
      }

      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json({
        user: userWithoutPassword,
        session: data.session,
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).send("Login failed");
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return res.status(500).send(error.message);
      }
      res.sendStatus(200);
    } catch (error: any) {
      res.status(500).send("Logout failed");
    }
  });

  app.get("/api/auth/user", ensureAuthenticated, (req: AuthRequest, res) => {
    const { password, ...userWithoutPassword } = req.user!;
    res.json(userWithoutPassword);
  });

  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const { refresh_token } = req.body;
      
      if (!refresh_token) {
        return res.status(400).send("Refresh token required");
      }

      const { data, error } = await supabase.auth.refreshSession({
        refresh_token,
      });

      if (error) {
        return res.status(401).send(error.message);
      }

      res.json({ session: data.session });
    } catch (error: any) {
      res.status(500).send("Token refresh failed");
    }
  });
}
