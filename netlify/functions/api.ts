import express, { type Request, Response, NextFunction } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "../../shared/schema";
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
  type InsertUser,
  type InsertStockMovement,
  type InsertProductStock,
  type InsertProduct,
  type InsertCashflow,
  type InsertWorkshopOrder,
  insertUserSchema
} from "../../shared/schema";
import { z } from "zod";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { createClient } from '@supabase/supabase-js';
import serverless from 'serverless-http';

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision the database?"
  );
}

const client = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});
const db = drizzle(client, { schema });

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-please-change-in-production';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

class DbStorage {
  async getAllProducts() {
    return db.select().from(products).orderBy(desc(products.id));
  }

  async getProduct(id: number) {
    const result = await db.select().from(products).where(eq(products.id, id));
    return result[0];
  }

  async createProduct(product: typeof products.$inferInsert) {
    const result = await db.insert(products).values(product).returning();
    return result[0];
  }

  async updateProduct(id: number, product: Partial<typeof products.$inferInsert>) {
    const result = await db.update(products).set(product).where(eq(products.id, id)).returning();
    return result[0];
  }

  async deleteProduct(id: number) {
    await db.delete(products).where(eq(products.id, id));
  }

  async updateProductStockCount(id: number, newStock: number, modifiedBy: number) {
    const result = await db
      .update(products)
      .set({ stock: newStock, modifiedBy })
      .where(eq(products.id, id))
      .returning();
    return result[0];
  }

  async getStockMovementsByProduct(productId: number) {
    return db.select().from(stockMovements).where(eq(stockMovements.productId, productId)).orderBy(desc(stockMovements.id));
  }

  async getAllStockMovements() {
    return db.select().from(stockMovements).orderBy(desc(stockMovements.id));
  }

  async getStockMovement(id: number) {
    const result = await db.select().from(stockMovements).where(eq(stockMovements.id, id));
    return result[0];
  }

  async createStockMovement(movement: typeof stockMovements.$inferInsert) {
    const result = await db.insert(stockMovements).values(movement).returning();
    return result[0];
  }

  async getAllCashflows() {
    return db.select().from(cashflows).orderBy(desc(cashflows.id));
  }

  async getCashflow(id: number) {
    const result = await db.select().from(cashflows).where(eq(cashflows.id, id));
    return result[0];
  }

  async createCashflow(cashflow: typeof cashflows.$inferInsert) {
    const result = await db.insert(cashflows).values(cashflow).returning();
    return result[0];
  }

  async updateCashflow(id: number, cashflow: Partial<typeof cashflows.$inferInsert>) {
    const result = await db.update(cashflows).set(cashflow).where(eq(cashflows.id, id)).returning();
    return result[0];
  }

  async deleteCashflow(id: number) {
    await db.delete(cashflows).where(eq(cashflows.id, id));
  }

  async getAllWorkshopOrders() {
    return db.select().from(workshopOrders).orderBy(desc(workshopOrders.id));
  }

  async getWorkshopOrder(id: number) {
    const result = await db.select().from(workshopOrders).where(eq(workshopOrders.id, id));
    return result[0];
  }

  async createWorkshopOrder(order: typeof workshopOrders.$inferInsert) {
    const result = await db.insert(workshopOrders).values(order).returning();
    return result[0];
  }

  async updateWorkshopOrder(id: number, order: Partial<typeof workshopOrders.$inferInsert>) {
    const result = await db.update(workshopOrders).set(order).where(eq(workshopOrders.id, id)).returning();
    return result[0];
  }

  async deleteWorkshopOrder(id: number) {
    await db.delete(workshopOrders).where(eq(workshopOrders.id, id));
  }

  async getSettings() {
    const result = await db.select().from(settings).limit(1);
    return result[0] || null;
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

  async updateSettings(newSettings: typeof settings.$inferInsert) {
    const existing = await this.getSettings();
    if (existing) {
      const result = await db.update(settings).set(newSettings).where(eq(settings.id, existing.id)).returning();
      return result[0];
    } else {
      const result = await db.insert(settings).values(newSettings).returning();
      return result[0];
    }
  }

  async getAllUsers() {
    return db.select().from(users).orderBy(desc(users.id));
  }

  async getUserByUsername(username: string) {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string) {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async getUserById(id: number) {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async createUser(user: typeof users.$inferInsert) {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, user: Partial<typeof users.$inferInsert>) {
    const result = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return result[0];
  }

  async getAllProductStock() {
    return db.select().from(productStock).orderBy(desc(productStock.id));
  }

  async getProductStock(id: number) {
    const result = await db.select().from(productStock).where(eq(productStock.id, id));
    return result[0];
  }

  async getProductStockByProductId(productId: number) {
    const result = await db.select().from(productStock).where(eq(productStock.productId, productId));
    return result[0];
  }

  async createProductStock(stock: typeof productStock.$inferInsert) {
    const result = await db.insert(productStock).values(stock).returning();
    return result[0];
  }

  async updateProductStock(id: number, stock: Partial<typeof productStock.$inferInsert>) {
    const result = await db.update(productStock).set(stock).where(eq(productStock.id, id)).returning();
    return result[0];
  }

  async updateProductStockByProductId(productId: number, stock: Partial<typeof productStock.$inferInsert>) {
    const result = await db.update(productStock).set(stock).where(eq(productStock.productId, productId)).returning();
    return result[0];
  }
}

const storage = new DbStorage();

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashedPassword, salt] = stored.split('.');
  const hashedPasswordBuf = Buffer.from(hashedPassword, 'hex');
  const suppliedPasswordBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
}

interface AuthRequest extends Request {
  user?: SelectUser;
}

function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authCookie = req.headers.cookie?.split('; ').find(row => row.startsWith('auth_token='));
  const token = authCookie?.split('=')[1];

  if (!token) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    
    storage.getUserById(decoded.userId).then(user => {
      if (!user) {
        return res.status(401).send("Unauthorized");
      }
      req.user = user;
      next();
    }).catch(() => {
      res.status(401).send("Unauthorized");
    });
  } catch {
    return res.status(401).send("Unauthorized");
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.post("/api/register", async (req, res) => {
  try {
    const validatedData = insertUserSchema.parse(req.body) as InsertUser;
    
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
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
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
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
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
    secure: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  }));
  res.sendStatus(200);
});

app.get("/api/user", authenticateToken, (req: AuthRequest, res) => {
  const { password, ...userWithoutPassword } = req.user!;
  res.json(userWithoutPassword);
});

app.post("/api/auth/register", async (req, res) => {
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

function ensureSupabaseAuth(req: AuthRequest, res: Response, next: NextFunction) {
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

app.get("/api/auth/user", ensureSupabaseAuth, (req: AuthRequest, res) => {
  const { password, ...userWithoutPassword } = req.user!;
  res.json(userWithoutPassword);
});

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
    const validatedData = insertProductSchema.parse(req.body) as InsertProduct;
    const product = await storage.createProduct({
      ...validatedData,
      createdBy: req.user!.id,
    });
    res.status(201).json(product);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

app.patch("/api/products/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = insertProductSchema.partial().parse(req.body);
    const product = await storage.updateProduct(id, validatedData);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    res.json(product);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

app.delete("/api/products/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteProduct(id);
    res.sendStatus(204);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/stock-movements", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const movements = await storage.getAllStockMovements();
    res.json(movements);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/stock-movements", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const validatedData = insertStockMovementSchema.parse(req.body) as InsertStockMovement;
    
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
    await storage.updateProductStockCount(validatedData.productId, newStock, req.user!.id);
    
    res.status(201).json(movement);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

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
    const validatedData = insertCashflowSchema.parse(req.body) as InsertCashflow;
    const cashflow = await storage.createCashflow({
      ...validatedData,
      createdBy: req.user!.id,
    });
    res.status(201).json(cashflow);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

app.patch("/api/cashflows/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = insertCashflowSchema.partial().parse(req.body);
    const cashflow = await storage.updateCashflow(id, validatedData);
    
    if (!cashflow) {
      return res.status(404).json({ message: "Cashflow not found" });
    }
    
    res.json(cashflow);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

app.delete("/api/cashflows/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteCashflow(id);
    res.sendStatus(204);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

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
    const validatedData = insertWorkshopOrderSchema.parse(req.body) as InsertWorkshopOrder;
    const order = await storage.createWorkshopOrder({
      ...validatedData,
      createdBy: req.user!.id,
    });
    res.status(201).json(order);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

app.patch("/api/workshop-orders/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = insertWorkshopOrderSchema.partial().parse(req.body);
    const order = await storage.updateWorkshopOrder(id, validatedData);
    
    if (!order) {
      return res.status(404).json({ message: "Workshop order not found" });
    }
    
    res.json(order);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

app.delete("/api/workshop-orders/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteWorkshopOrder(id);
    res.sendStatus(204);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/settings", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const settingsData = await storage.getSettings();
    res.json(settingsData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.patch("/api/settings", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const settingsData = await storage.updateSettings(req.body);
    res.json(settingsData);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/api/product-stock", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const stock = await storage.getAllProductStock();
    res.json(stock);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/product-stock", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const validatedData = insertProductStockSchema.parse(req.body) as InsertProductStock;
    
    const product = await storage.getProduct(validatedData.productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const stock = await storage.createProductStock({
      ...validatedData,
      createdBy: req.user!.id,
    });

    const newTotalStock = product.stock + validatedData.quantity;
    await storage.updateProductStockCount(validatedData.productId, newTotalStock, req.user!.id);

    res.status(201).json(stock);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

app.patch("/api/product-stock/:productId", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const productId = parseInt(req.params.productId);
    const { quantity } = req.body;
    
    if (typeof quantity !== 'number') {
      return res.status(400).json({ message: "Quantity must be a number" });
    }
    
    const product = await storage.getProduct(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const updatedProduct = await storage.updateProductStockCount(productId, quantity, req.user!.id);
    res.json(updatedProduct);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Users API
app.get("/api/users", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const usersData = await storage.getAllUsers();
    const usersWithoutPasswords = usersData.map(({ password, ...user }) => user);
    res.json(usersWithoutPasswords);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Settings by key API
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

// Dashboard stats endpoint
app.get("/api/dashboard/stats", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const productsData = await storage.getAllProducts();
    const cashflowsData = await storage.getAllCashflows();
    const initialCapitalSetting = await storage.getSetting('initial_capital');
    
    const totalProducts = productsData.length;
    const totalStock = productsData.reduce((sum, p) => sum + (p.stock || 0), 0);
    const totalStockValue = productsData.reduce((sum, p) => sum + ((p.estimatedPrice || 0) * (p.stock || 0)), 0);
    const lowStockCount = productsData.filter(p => (p.stock || 0) < 10).length;
    
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

export const handler = serverless(app);
