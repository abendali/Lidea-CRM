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
  type WorkshopOrder,
  type InsertWorkshopOrder
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Products
  getAllProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  updateProductStock(id: number, newStock: number): Promise<Product>;

  // Stock Movements
  getAllStockMovements(): Promise<StockMovement[]>;
  getStockMovementsByProduct(productId: number): Promise<StockMovement[]>;
  createStockMovement(movement: InsertStockMovement): Promise<StockMovement>;

  // Cashflows
  getAllCashflows(): Promise<Cashflow[]>;
  getCashflow(id: number): Promise<Cashflow | undefined>;
  createCashflow(cashflow: InsertCashflow): Promise<Cashflow>;

  // Settings
  getSetting(key: string): Promise<Setting | undefined>;
  setSetting(key: string, value: string): Promise<Setting>;

  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Workshop Orders
  getAllWorkshopOrders(): Promise<WorkshopOrder[]>;
  getWorkshopOrder(id: number): Promise<WorkshopOrder | undefined>;
  createWorkshopOrder(order: InsertWorkshopOrder): Promise<WorkshopOrder>;
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

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const product: Product = {
      id: this.productIdCounter++,
      ...insertProduct,
      stock: insertProduct.stock ?? 0,
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

  async updateProductStock(id: number, newStock: number): Promise<Product> {
    const product = this.products.get(id);
    if (!product) {
      throw new Error('Product not found');
    }
    const updated = { ...product, stock: newStock };
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

  async createStockMovement(movement: InsertStockMovement): Promise<StockMovement> {
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

  async createCashflow(insertCashflow: InsertCashflow): Promise<Cashflow> {
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
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: this.userIdCounter++,
      ...insertUser,
    };
    this.users.set(user.id, user);
    return user;
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

  async createWorkshopOrder(insertOrder: InsertWorkshopOrder): Promise<WorkshopOrder> {
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

  async deleteWorkshopOrder(id: number): Promise<void> {
    this.workshopOrders.delete(id);
  }
}

export const storage = new MemStorage();
