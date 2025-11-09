import { 
  type Product, 
  type InsertProduct,
  type StockMovement,
  type InsertStockMovement,
  type Cashflow,
  type InsertCashflow,
  type Setting,
  type User,
  type InsertUser,
  type UpdateUser,
  type WorkshopOrder,
  type InsertWorkshopOrder
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { db, pool } from "./db";
import { eq, desc } from "drizzle-orm";
import { products, stockMovements, cashflows, settings, users, workshopOrders } from "@shared/schema";
import ConnectPgSimple from "connect-pg-simple";

const MemoryStore = createMemoryStore(session);
const PgSession = ConnectPgSimple(session);

export interface IStorage {
  // Products
  getAllProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct & { createdBy: number }): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  updateProductStock(id: number, newStock: number, modifiedBy: number): Promise<Product>;

  // Stock Movements
  getAllStockMovements(): Promise<StockMovement[]>;
  getStockMovementsByProduct(productId: number): Promise<StockMovement[]>;
  createStockMovement(movement: InsertStockMovement & { createdBy: number }): Promise<StockMovement>;

  // Cashflows
  getAllCashflows(): Promise<Cashflow[]>;
  getCashflow(id: number): Promise<Cashflow | undefined>;
  createCashflow(cashflow: InsertCashflow & { createdBy: number }): Promise<Cashflow>;

  // Settings
  getSetting(key: string): Promise<Setting | undefined>;
  setSetting(key: string, value: string): Promise<Setting>;

  // Users
  getAllUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: UpdateUser): Promise<User>;

  // Workshop Orders
  getAllWorkshopOrders(): Promise<WorkshopOrder[]>;
  getWorkshopOrder(id: number): Promise<WorkshopOrder | undefined>;
  createWorkshopOrder(order: InsertWorkshopOrder & { createdBy: number }): Promise<WorkshopOrder>;
  updateWorkshopOrder(id: number, order: Partial<InsertWorkshopOrder>): Promise<WorkshopOrder>;
  deleteWorkshopOrder(id: number): Promise<void>;

  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private products: Map<number, Product> = new Map();
  private stockMovements: Map<number, StockMovement> = new Map();
  private cashflows: Map<number, Cashflow> = new Map();
  private settings: Map<string, Setting> = new Map();
  private users: Map<number, User> = new Map();
  private workshopOrders: Map<number, WorkshopOrder> = new Map();
  
  private productIdCounter = 1;
  private stockMovementIdCounter = 1;
  private cashflowIdCounter = 1;
  private settingIdCounter = 1;
  private userIdCounter = 1;
  private workshopOrderIdCounter = 1;

  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  // Products
  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct & { createdBy: number }): Promise<Product> {
    const product: Product = {
      id: this.productIdCounter++,
      ...insertProduct,
      stock: insertProduct.stock ?? 0,
      modifiedBy: null,
    };
    this.products.set(product.id, product);
    return product;
  }

  async deleteProduct(id: number): Promise<void> {
    this.products.delete(id);
    // Delete associated stock movements
    for (const [movementId, movement] of this.stockMovements.entries()) {
      if (movement.productId === id) {
        this.stockMovements.delete(movementId);
      }
    }
  }

  async updateProductStock(id: number, newStock: number, modifiedBy: number): Promise<Product> {
    const product = this.products.get(id);
    if (!product) {
      throw new Error('Product not found');
    }
    const updated = { ...product, stock: newStock, modifiedBy };
    this.products.set(id, updated);
    return updated;
  }

  // Stock Movements
  async getAllStockMovements(): Promise<StockMovement[]> {
    return Array.from(this.stockMovements.values()).sort((a, b) => 
      b.date.getTime() - a.date.getTime()
    );
  }

  async getStockMovementsByProduct(productId: number): Promise<StockMovement[]> {
    return Array.from(this.stockMovements.values())
      .filter(m => m.productId === productId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async createStockMovement(movement: InsertStockMovement & { createdBy: number }): Promise<StockMovement> {
    const stockMovement: StockMovement = {
      id: this.stockMovementIdCounter++,
      ...movement,
      note: movement.note ?? '',
      date: new Date(),
    };
    this.stockMovements.set(stockMovement.id, stockMovement);
    return stockMovement;
  }

  // Cashflows
  async getAllCashflows(): Promise<Cashflow[]> {
    return Array.from(this.cashflows.values()).sort((a, b) => 
      b.date.getTime() - a.date.getTime()
    );
  }

  async getCashflow(id: number): Promise<Cashflow | undefined> {
    return this.cashflows.get(id);
  }

  async createCashflow(insertCashflow: InsertCashflow & { createdBy: number }): Promise<Cashflow> {
    const cashflow: Cashflow = {
      id: this.cashflowIdCounter++,
      ...insertCashflow,
    };
    this.cashflows.set(cashflow.id, cashflow);
    return cashflow;
  }

  // Settings
  async getSetting(key: string): Promise<Setting | undefined> {
    return this.settings.get(key);
  }

  async setSetting(key: string, value: string): Promise<Setting> {
    const existing = this.settings.get(key);
    
    if (existing) {
      const updated = { ...existing, value };
      this.settings.set(key, updated);
      return updated;
    } else {
      const setting: Setting = {
        id: this.settingIdCounter++,
        key,
        value,
      };
      this.settings.set(key, setting);
      return setting;
    }
  }

  // Users
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: this.userIdCounter++,
      ...insertUser,
      profilePicture: insertUser.profilePicture || null,
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: number, updates: UpdateUser): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error("User not found");
    }
    const updated: User = {
      ...user,
      ...updates,
    };
    this.users.set(id, updated);
    return updated;
  }

  // Workshop Orders
  async getAllWorkshopOrders(): Promise<WorkshopOrder[]> {
    return Array.from(this.workshopOrders.values()).sort((a, b) => 
      b.date.getTime() - a.date.getTime()
    );
  }

  async getWorkshopOrder(id: number): Promise<WorkshopOrder | undefined> {
    return this.workshopOrders.get(id);
  }

  async createWorkshopOrder(insertOrder: InsertWorkshopOrder & { createdBy: number }): Promise<WorkshopOrder> {
    const order: WorkshopOrder = {
      id: this.workshopOrderIdCounter++,
      ...insertOrder,
      materialCost: insertOrder.materialCost ?? 0,
      woodCost: insertOrder.woodCost ?? 0,
      otherCosts: insertOrder.otherCosts ?? 0,
      notes: insertOrder.notes ?? '',
      date: new Date(),
    };
    this.workshopOrders.set(order.id, order);
    return order;
  }

  async updateWorkshopOrder(id: number, updates: Partial<InsertWorkshopOrder>): Promise<WorkshopOrder> {
    const existing = this.workshopOrders.get(id);
    if (!existing) {
      throw new Error("Workshop order not found");
    }
    const updated: WorkshopOrder = {
      ...existing,
      ...updates,
    };
    this.workshopOrders.set(id, updated);
    return updated;
  }

  async deleteWorkshopOrder(id: number): Promise<void> {
    this.workshopOrders.delete(id);
  }
}

export class DbStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PgSession({
      pool: pool,
      createTableIfMissing: true,
    });
  }

  // Products
  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id));
    return result[0];
  }

  async createProduct(insertProduct: InsertProduct & { createdBy: number }): Promise<Product> {
    const result = await db.insert(products).values(insertProduct).returning();
    return result[0];
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async updateProductStock(id: number, newStock: number, modifiedBy: number): Promise<Product> {
    const result = await db.update(products).set({ stock: newStock, modifiedBy }).where(eq(products.id, id)).returning();
    return result[0];
  }

  // Stock Movements
  async getAllStockMovements(): Promise<StockMovement[]> {
    return await db.select().from(stockMovements).orderBy(desc(stockMovements.date));
  }

  async getStockMovementsByProduct(productId: number): Promise<StockMovement[]> {
    return await db.select().from(stockMovements).where(eq(stockMovements.productId, productId)).orderBy(desc(stockMovements.date));
  }

  async createStockMovement(movement: InsertStockMovement & { createdBy: number }): Promise<StockMovement> {
    const result = await db.insert(stockMovements).values(movement).returning();
    return result[0];
  }

  // Cashflows
  async getAllCashflows(): Promise<Cashflow[]> {
    return await db.select().from(cashflows).orderBy(desc(cashflows.date));
  }

  async getCashflow(id: number): Promise<Cashflow | undefined> {
    const result = await db.select().from(cashflows).where(eq(cashflows.id, id));
    return result[0];
  }

  async createCashflow(insertCashflow: InsertCashflow & { createdBy: number }): Promise<Cashflow> {
    const result = await db.insert(cashflows).values(insertCashflow).returning();
    return result[0];
  }

  // Settings
  async getSetting(key: string): Promise<Setting | undefined> {
    const result = await db.select().from(settings).where(eq(settings.key, key));
    return result[0];
  }

  async setSetting(key: string, value: string): Promise<Setting> {
    const existing = await this.getSetting(key);
    
    if (existing) {
      const result = await db.update(settings).set({ value }).where(eq(settings.key, key)).returning();
      return result[0];
    } else {
      const result = await db.insert(settings).values({ key, value }).returning();
      return result[0];
    }
  }

  // Users
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: number, updates: UpdateUser): Promise<User> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    if (result.length === 0) {
      throw new Error("User not found");
    }
    return result[0];
  }

  // Workshop Orders
  async getAllWorkshopOrders(): Promise<WorkshopOrder[]> {
    return await db.select().from(workshopOrders).orderBy(desc(workshopOrders.date));
  }

  async getWorkshopOrder(id: number): Promise<WorkshopOrder | undefined> {
    const result = await db.select().from(workshopOrders).where(eq(workshopOrders.id, id));
    return result[0];
  }

  async createWorkshopOrder(insertOrder: InsertWorkshopOrder & { createdBy: number }): Promise<WorkshopOrder> {
    const result = await db.insert(workshopOrders).values(insertOrder).returning();
    return result[0];
  }

  async updateWorkshopOrder(id: number, updates: Partial<InsertWorkshopOrder>): Promise<WorkshopOrder> {
    const result = await db.update(workshopOrders)
      .set(updates)
      .where(eq(workshopOrders.id, id))
      .returning();
    if (result.length === 0) {
      throw new Error("Workshop order not found");
    }
    return result[0];
  }

  async deleteWorkshopOrder(id: number): Promise<void> {
    await db.delete(workshopOrders).where(eq(workshopOrders.id, id));
  }
}

export const storage = new DbStorage();
