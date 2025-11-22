import { Express, Request, Response, NextFunction } from "express";
import { supabase, isSupabaseConfigured } from "./supabase";
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
  app.post("/api/login", async (req, res) => {
    if (!isSupabaseConfigured) {
      return res.status(503).send("Authentication service not configured. Please contact administrator.");
    }
    
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).send("Username and password required");
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).send("Invalid credentials");
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });

      if (error) {
        console.error('Supabase login error:', error);
        return res.status(401).send("Invalid credentials");
      }

      if (!data.session) {
        console.error('No session returned from Supabase');
        return res.status(401).send("Login failed - no session created");
      }

      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).send("Login failed");
    }
  });

  app.post("/api/register", async (req, res) => {
    if (!isSupabaseConfigured) {
      return res.status(503).send("Authentication service not configured. Please contact administrator.");
    }
    
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
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      console.error('Register error:', error);
      res.status(400).send(error.message || "Invalid registration data");
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    if (!isSupabaseConfigured) {
      return res.status(503).send("Authentication service not configured. Please contact administrator.");
    }
    
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
        console.error('Supabase login error:', error);
        return res.status(401).send(error.message || "Invalid credentials");
      }

      if (!data.session) {
        console.error('No session returned from Supabase');
        return res.status(401).send("Login failed - no session created");
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.error('User not found in database:', email);
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

  app.post("/api/logout", async (req, res) => {
    res.sendStatus(200);
  });

  app.get("/api/user", ensureAuthenticated, (req: AuthRequest, res) => {
    const { password, ...userWithoutPassword } = req.user!;
    res.json(userWithoutPassword);
  });

  app.get("/api/user-by-username", async (req, res) => {
    try {
      const username = req.query.username as string;
      if (!username) {
        return res.status(400).send("Username required");
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).send("User not found");
      }

      // Only return email and username for lookup
      res.json({ email: user.email, username: user.username });
    } catch (error: any) {
      res.status(500).send("Lookup failed");
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    res.sendStatus(200);
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
