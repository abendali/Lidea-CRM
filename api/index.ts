import express, { type Request, Response, NextFunction } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "../shared/schema";
import { eq, desc } from "drizzle-orm";
import { 
  products, 
  stockMovements, 
  cashflows, 
  settings, 
  users, 
  workshopOrders, 
  productStock,
  insertProductSchema, 
  insertStockMovementSchema, 
  insertCashflowSchema, 
  insertWorkshopOrderSchema, 
  updateUserSchema, 
  insertProductStockSchema,
  type User as SelectUser,
  insertUserSchema
} from "../shared/schema";
import { z } from "zod";
import jwt from "jsonwebtoken";
import cookie from "cookie";

// Database setup
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client, { schema });

// JWT secret - use environment variable or fallback
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-please-change-in-production';

// Storage setup
class DbStorage {
  async getAllProducts() {
    return db.select().from(products).orderBy(desc(products.id));
  }

  async getProduct(id: number) {
    const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return result[0];
  }

  async createProduct(product: any) {
    const result = await db.insert(products).values(product).returning();
    return result[0];
  }

  async deleteProduct(id: number) {
    await db.delete(products).where(eq(products.id, id));
  }

  async updateProductStock(id: number, newStock: number, modifiedBy: number) {
    const result = await db
      .update(products)
      .set({ stock: newStock, modifiedBy })
      .where(eq(products.id, id))
      .returning();
    return result[0];
  }

  async getAllStockMovements() {
    return db.select().from(stockMovements).orderBy(desc(stockMovements.id));
  }

  async getStockMovementsByProduct(productId: number) {
    return db.select().from(stockMovements).where(eq(stockMovements.productId, productId)).orderBy(desc(stockMovements.id));
  }

  async createStockMovement(movement: any) {
    const result = await db.insert(stockMovements).values(movement).returning();
    return result[0];
  }

  async getAllCashflows() {
    return db.select().from(cashflows).orderBy(desc(cashflows.id));
  }

  async getCashflow(id: number) {
    const result = await db.select().from(cashflows).where(eq(cashflows.id, id)).limit(1);
    return result[0];
  }

  async createCashflow(cashflow: any) {
    const result = await db.insert(cashflows).values(cashflow).returning();
    return result[0];
  }

  async getSetting(key: string) {
    const result = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
    return result[0];
  }

  async setSetting(key: string, value: string) {
    const existing = await this.getSetting(key);
    if (existing) {
      const result = await db.update(settings).set({ value }).where(eq(settings.key, key)).returning();
      return result[0];
    } else {
      const result = await db.insert(settings).values({ key, value }).returning();
      return result[0];
    }
  }

  async getAllUsers() {
    return db.select().from(users).orderBy(desc(users.id));
  }

  async getUser(id: number) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string) {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string) {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: any) {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, updates: any) {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  async getAllWorkshopOrders() {
    return db.select().from(workshopOrders).orderBy(desc(workshopOrders.id));
  }

  async getWorkshopOrder(id: number) {
    const result = await db.select().from(workshopOrders).where(eq(workshopOrders.id, id)).limit(1);
    return result[0];
  }

  async createWorkshopOrder(order: any) {
    const result = await db.insert(workshopOrders).values(order).returning();
    return result[0];
  }

  async updateWorkshopOrder(id: number, order: any) {
    const result = await db.update(workshopOrders).set(order).where(eq(workshopOrders.id, id)).returning();
    return result[0];
  }

  async deleteWorkshopOrder(id: number) {
    await db.delete(workshopOrders).where(eq(workshopOrders.id, id));
  }

  async getAllProductStock() {
    return db.select().from(productStock).orderBy(desc(productStock.id));
  }

  async getProductStockByProduct(productId: number) {
    return db.select().from(productStock).where(eq(productStock.productId, productId)).orderBy(desc(productStock.id));
  }

  async getProductStock(id: number) {
    const result = await db.select().from(productStock).where(eq(productStock.id, id)).limit(1);
    return result[0];
  }

  async createProductStock(stock: any) {
    const result = await db.insert(productStock).values(stock).returning();
    return result[0];
  }

  async updateProductStockEntry(id: number, stock: any) {
    const result = await db.update(productStock).set(stock).where(eq(productStock.id, id)).returning();
    return result[0];
  }

  async deleteProductStock(id: number) {
    await db.delete(productStock).where(eq(productStock.id, id));
  }
}

const storage = new DbStorage();

// Auth utilities
declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

interface AuthRequest extends Request {
  user?: SelectUser;
}

// JWT authentication middleware
function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies.auth_token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    storage.getUser(decoded.userId).then(user => {
      if (!user) {
        return res.status(401).send("Unauthorized");
      }
      req.user = user;
      next();
    }).catch(() => {
      res.status(401).send("Unauthorized");
    });
  } catch (err) {
    res.status(401).send("Unauthorized");
  }
}

async function hashPassword(password: string) {
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

// Express app setup
const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

let isInitialized = false;

async function initializeApp() {
  if (!isInitialized) {
    // Auth routes
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

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        
        res.setHeader('Set-Cookie', cookie.serialize('auth_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: '/'
        }));

        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      } catch (error: any) {
        console.error('Register error:', error);
        res.status(400).send(error.message || "Invalid registration data");
      }
    });

    app.post("/api/login", async (req, res) => {
      try {
        const { username, password } = req.body;
        
        if (!username || !password) {
          return res.status(400).send("Username and password required");
        }

        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return res.status(401).send("Invalid credentials");
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        
        res.setHeader('Set-Cookie', cookie.serialize('auth_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: '/'
        }));

        const { password: _, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).send("Login failed");
      }
    });

    app.post("/api/logout", (req, res) => {
      res.setHeader('Set-Cookie', cookie.serialize('auth_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/'
      }));
      res.sendStatus(200);
    });

    app.get("/api/user", authenticateToken, (req: AuthRequest, res) => {
      const { password, ...userWithoutPassword } = req.user!;
      res.json(userWithoutPassword);
    });

    // Products API
    app.get("/api/products", authenticateToken, async (req: AuthRequest, res) => {
      try {
        const productsData = await storage.getAllProducts();
        res.json(productsData);
      } catch (error: any) {
        console.error('Get products error:', error);
        res.status(500).json({ message: error.message });
      }
    });

    app.get("/api/products/:id", authenticateToken, async (req: AuthRequest, res) => {
      try {
        const id = parseInt(req.params.id);
        const product = await storage.getProduct(id);
        
        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }
        
        res.json(product);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    });

    app.post("/api/products", authenticateToken, async (req: AuthRequest, res) => {
      try {
        const validatedData = insertProductSchema.parse(req.body);
        const product = await storage.createProduct({
          ...validatedData,
          createdBy: req.user!.id,
        });
        res.status(201).json(product);
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Validation error", errors: error.errors });
        }
        res.status(500).json({ message: error.message });
      }
    });

    app.delete("/api/products/:id", authenticateToken, async (req: AuthRequest, res) => {
      try {
        const id = parseInt(req.params.id);
        await storage.deleteProduct(id);
        res.status(204).send();
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    });

    // Stock Movements API
    app.get("/api/stock-movements", authenticateToken, async (req: AuthRequest, res) => {
      try {
        const productId = req.query.productId ? parseInt(req.query.productId as string) : undefined;
        
        if (productId) {
          const movements = await storage.getStockMovementsByProduct(productId);
          res.json(movements);
        } else {
          const movements = await storage.getAllStockMovements();
          res.json(movements);
        }
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    });

    app.post("/api/stock-movements", authenticateToken, async (req: AuthRequest, res) => {
      try {
        const validatedData = insertStockMovementSchema.parse(req.body);
        
        const product = await storage.getProduct(validatedData.productId);
        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }

        let newStock = product.stock;
        const movementType = validatedData.type;
        const quantity = validatedData.quantity;
        
        if (movementType === 'add') {
          newStock += quantity;
        } else {
          newStock -= quantity;
        }

        if (newStock < 0) {
          return res.status(400).json({ message: "Insufficient stock" });
        }

        const movement = await storage.createStockMovement({
          ...validatedData,
          createdBy: req.user!.id,
        });
        await storage.updateProductStock(validatedData.productId, newStock, req.user!.id);

        res.status(201).json(movement);
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Validation error", errors: error.errors });
        }
        res.status(500).json({ message: error.message });
      }
    });

    // Cashflow API
    app.get("/api/cashflows", authenticateToken, async (req: AuthRequest, res) => {
      try {
        const cashflowsData = await storage.getAllCashflows();
        res.json(cashflowsData);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    });

    app.post("/api/cashflows", authenticateToken, async (req: AuthRequest, res) => {
      try {
        const validatedData = insertCashflowSchema.parse(req.body);
        const cashflow = await storage.createCashflow({
          ...validatedData,
          createdBy: req.user!.id,
        });
        res.status(201).json(cashflow);
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Validation error", errors: error.errors });
        }
        res.status(500).json({ message: error.message });
      }
    });

    // User API
    app.get("/api/users", authenticateToken, async (req: AuthRequest, res) => {
      try {
        const usersData = await storage.getAllUsers();
        const usersWithoutPasswords = usersData.map(({ password, ...user }) => user);
        res.json(usersWithoutPasswords);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    });

    app.patch("/api/users/:id", authenticateToken, async (req: AuthRequest, res) => {
      try {
        const id = parseInt(req.params.id);
        
        if (id !== req.user!.id) {
          return res.status(403).json({ message: "You can only update your own profile" });
        }
        
        const validatedData = updateUserSchema.parse(req.body);
        
        const updates = { ...validatedData };
        if (updates.password) {
          updates.password = await hashPassword(updates.password);
        }
        
        const user = await storage.updateUser(id, updates);
        
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Validation error", errors: error.errors });
        }
        res.status(500).json({ message: error.message });
      }
    });

    // Settings API
    app.get("/api/settings/:key", authenticateToken, async (req: AuthRequest, res) => {
      try {
        const setting = await storage.getSetting(req.params.key);
        
        if (!setting) {
          return res.status(404).json({ message: "Setting not found" });
        }
        
        res.json(setting);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    });

    app.post("/api/settings", authenticateToken, async (req: AuthRequest, res) => {
      try {
        const { key, value } = req.body;
        
        if (!key || value === undefined) {
          return res.status(400).json({ message: "Key and value are required" });
        }
        
        const setting = await storage.setSetting(key, value);
        res.json(setting);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    });

    // Workshop Orders API
    app.get("/api/workshop-orders", authenticateToken, async (req: AuthRequest, res) => {
      try {
        const orders = await storage.getAllWorkshopOrders();
        res.json(orders);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    });

    app.post("/api/workshop-orders", authenticateToken, async (req: AuthRequest, res) => {
      try {
        const validatedData = insertWorkshopOrderSchema.parse(req.body);
        const order = await storage.createWorkshopOrder({
          ...validatedData,
          createdBy: req.user!.id,
        });
        res.status(201).json(order);
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Validation error", errors: error.errors });
        }
        res.status(500).json({ message: error.message });
      }
    });

    app.patch("/api/workshop-orders/:id", authenticateToken, async (req: AuthRequest, res) => {
      try {
        const id = parseInt(req.params.id);
        const validatedData = insertWorkshopOrderSchema.partial().parse(req.body);
        const order = await storage.updateWorkshopOrder(id, validatedData);
        res.json(order);
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Validation error", errors: error.errors });
        }
        res.status(500).json({ message: error.message });
      }
    });

    app.delete("/api/workshop-orders/:id", authenticateToken, async (req: AuthRequest, res) => {
      try {
        const id = parseInt(req.params.id);
        await storage.deleteWorkshopOrder(id);
        res.status(204).send();
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    });

    // Product Stock API
    app.get("/api/product-stock", authenticateToken, async (req: AuthRequest, res) => {
      try {
        const productId = req.query.productId ? parseInt(req.query.productId as string) : undefined;
        
        if (productId) {
          const stocks = await storage.getProductStockByProduct(productId);
          res.json(stocks);
        } else {
          const stocks = await storage.getAllProductStock();
          res.json(stocks);
        }
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    });

    app.get("/api/product-stock/:id", authenticateToken, async (req: AuthRequest, res) => {
      try {
        const id = parseInt(req.params.id);
        const stock = await storage.getProductStock(id);
        
        if (!stock) {
          return res.status(404).json({ message: "Product stock not found" });
        }
        
        res.json(stock);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    });

    app.post("/api/product-stock", authenticateToken, async (req: AuthRequest, res) => {
      try {
        const validatedData = insertProductStockSchema.parse(req.body);
        
        const product = await storage.getProduct(validatedData.productId);
        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }

        const stock = await storage.createProductStock({
          ...validatedData,
          createdBy: req.user!.id,
        });

        const newTotalStock = product.stock + validatedData.quantity;
        await storage.updateProductStock(validatedData.productId, newTotalStock, req.user!.id);

        res.status(201).json(stock);
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Validation error", errors: error.errors });
        }
        res.status(500).json({ message: error.message });
      }
    });

    app.patch("/api/product-stock/:id", authenticateToken, async (req: AuthRequest, res) => {
      try {
        const id = parseInt(req.params.id);
        const validatedData = insertProductStockSchema.partial().parse(req.body);
        
        if (validatedData.productId !== undefined) {
          return res.status(400).json({ message: "Cannot change product ID of a stock entry" });
        }

        const currentStock = await storage.getProductStock(id);
        if (!currentStock) {
          return res.status(404).json({ message: "Product stock not found" });
        }

        const product = await storage.getProduct(currentStock.productId);
        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }

        if (validatedData.quantity !== undefined && validatedData.quantity !== currentStock.quantity) {
          const quantityDelta = validatedData.quantity - currentStock.quantity;
          const newTotalStock = product.stock + quantityDelta;
          
          if (newTotalStock < 0) {
            return res.status(400).json({ message: "Cannot reduce stock below zero" });
          }
          
          const updatedStock = await storage.updateProductStockEntry(id, validatedData);
          await storage.updateProductStock(currentStock.productId, newTotalStock, req.user!.id);
          
          res.json(updatedStock);
        } else {
          const updatedStock = await storage.updateProductStockEntry(id, validatedData);
          res.json(updatedStock);
        }
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Validation error", errors: error.errors });
        }
        res.status(500).json({ message: error.message });
      }
    });

    app.delete("/api/product-stock/:id", authenticateToken, async (req: AuthRequest, res) => {
      try {
        const id = parseInt(req.params.id);
        
        const stock = await storage.getProductStock(id);
        if (!stock) {
          return res.status(404).json({ message: "Product stock not found" });
        }

        const product = await storage.getProduct(stock.productId);
        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }

        const newTotalStock = product.stock - stock.quantity;
        if (newTotalStock < 0) {
          return res.status(400).json({ message: "Cannot reduce stock below zero" });
        }

        await storage.deleteProductStock(id);
        await storage.updateProductStock(stock.productId, newTotalStock, req.user!.id);

        res.status(204).send();
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    });

    // Dashboard stats endpoint
    app.get("/api/dashboard/stats", authenticateToken, async (req: AuthRequest, res) => {
      try {
        const productsData = await storage.getAllProducts();
        const cashflowsData = await storage.getAllCashflows();
        const initialCapitalSetting = await storage.getSetting('initial_capital');
        
        const totalProducts = productsData.length;
        const totalStock = productsData.reduce((sum, p) => sum + p.stock, 0);
        const totalStockValue = productsData.reduce((sum, p) => sum + (p.estimatedPrice * p.stock), 0);
        const lowStockCount = productsData.filter(p => p.stock < 10).length;
        
        const totalIncome = cashflowsData
          .filter(c => c.type === 'income')
          .reduce((sum, c) => sum + c.amount, 0);
        const totalExpense = cashflowsData
          .filter(c => c.type === 'expense')
          .reduce((sum, c) => sum + c.amount, 0);
        const netBalance = totalIncome - totalExpense;
        const initialCapital = initialCapitalSetting ? parseFloat(initialCapitalSetting.value) : 0;
        const currentCapital = initialCapital + netBalance;
        
        res.json({
          totalProducts,
          totalStock,
          totalStockValue,
          lowStockCount,
          totalIncome,
          totalExpense,
          netBalance,
          initialCapital,
          currentCapital,
        });
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    });

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      console.error(err);
    });

    isInitialized = true;
  }
}

export default async function handler(req: any, res: any) {
  try {
    await initializeApp();
    return app(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
