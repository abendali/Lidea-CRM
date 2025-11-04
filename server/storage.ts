import { 
  products, 
  stockMovements, 
  cashflows, 
  settings,
  type Product, 
  type InsertProduct,
  type StockMovement,
  type InsertStockMovement,
  type Cashflow,
  type InsertCashflow,
  type Setting
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

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
}

export class DatabaseStorage implements IStorage {
  // Products
  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct as any).returning();
    return product;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async updateProductStock(id: number, newStock: number): Promise<Product> {
    const [product] = await db
      .update(products)
      .set({ stock: newStock })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  // Stock Movements
  async getAllStockMovements(): Promise<StockMovement[]> {
    return await db.select().from(stockMovements).orderBy(desc(stockMovements.date));
  }

  async getStockMovementsByProduct(productId: number): Promise<StockMovement[]> {
    return await db
      .select()
      .from(stockMovements)
      .where(eq(stockMovements.productId, productId))
      .orderBy(desc(stockMovements.date));
  }

  async createStockMovement(movement: InsertStockMovement): Promise<StockMovement> {
    const [stockMovement] = await db.insert(stockMovements).values(movement as any).returning();
    return stockMovement;
  }

  // Cashflows
  async getAllCashflows(): Promise<Cashflow[]> {
    return await db.select().from(cashflows).orderBy(desc(cashflows.date));
  }

  async getCashflow(id: number): Promise<Cashflow | undefined> {
    const [cashflow] = await db.select().from(cashflows).where(eq(cashflows.id, id));
    return cashflow || undefined;
  }

  async createCashflow(insertCashflow: InsertCashflow): Promise<Cashflow> {
    const [cashflow] = await db.insert(cashflows).values(insertCashflow as any).returning();
    return cashflow;
  }

  // Settings
  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting || undefined;
  }

  async setSetting(key: string, value: string): Promise<Setting> {
    const existing = await this.getSetting(key);
    
    if (existing) {
      const [setting] = await db
        .update(settings)
        .set({ value })
        .where(eq(settings.key, key))
        .returning();
      return setting;
    } else {
      const [setting] = await db.insert(settings).values({ key, value }).returning();
      return setting;
    }
  }
}

export const storage = new DatabaseStorage();
