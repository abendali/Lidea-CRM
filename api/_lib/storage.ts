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
  type InsertWorkshopOrder,
  type ProductStock,
  type InsertProductStock,
  products, 
  stockMovements, 
  cashflows, 
  settings, 
  users, 
  workshopOrders, 
  productStock 
} from "../../shared/schema";
import { getDb } from "./db";
import { eq, desc } from "drizzle-orm";

// Products
export async function getAllProducts(): Promise<Product[]> {
  const db = getDb();
  return await db.select().from(products);
}

export async function getProduct(id: number): Promise<Product | undefined> {
  const db = getDb();
  const result = await db.select().from(products).where(eq(products.id, id));
  return result[0];
}

export async function createProduct(insertProduct: InsertProduct & { createdBy: number }): Promise<Product> {
  const db = getDb();
  const result = await db.insert(products).values(insertProduct).returning();
  return result[0];
}

export async function deleteProduct(id: number): Promise<void> {
  const db = getDb();
  await db.delete(products).where(eq(products.id, id));
}

export async function updateProductStock(id: number, newStock: number, modifiedBy: number): Promise<Product> {
  const db = getDb();
  const result = await db.update(products).set({ stock: newStock, modifiedBy }).where(eq(products.id, id)).returning();
  return result[0];
}

// Stock Movements
export async function getAllStockMovements(): Promise<StockMovement[]> {
  const db = getDb();
  return await db.select().from(stockMovements).orderBy(desc(stockMovements.date));
}

export async function getStockMovementsByProduct(productId: number): Promise<StockMovement[]> {
  const db = getDb();
  return await db.select().from(stockMovements).where(eq(stockMovements.productId, productId)).orderBy(desc(stockMovements.date));
}

export async function createStockMovement(movement: InsertStockMovement & { createdBy: number }): Promise<StockMovement> {
  const db = getDb();
  const result = await db.insert(stockMovements).values(movement).returning();
  return result[0];
}

// Cashflows
export async function getAllCashflows(): Promise<Cashflow[]> {
  const db = getDb();
  return await db.select().from(cashflows).orderBy(desc(cashflows.date));
}

export async function getCashflow(id: number): Promise<Cashflow | undefined> {
  const db = getDb();
  const result = await db.select().from(cashflows).where(eq(cashflows.id, id));
  return result[0];
}

export async function createCashflow(insertCashflow: InsertCashflow & { createdBy: number }): Promise<Cashflow> {
  const db = getDb();
  const result = await db.insert(cashflows).values(insertCashflow).returning();
  return result[0];
}

// Settings
export async function getSetting(key: string): Promise<Setting | undefined> {
  const db = getDb();
  const result = await db.select().from(settings).where(eq(settings.key, key));
  return result[0];
}

export async function setSetting(key: string, value: string): Promise<Setting> {
  const db = getDb();
  const existing = await getSetting(key);
  
  if (existing) {
    const result = await db.update(settings).set({ value }).where(eq(settings.key, key)).returning();
    return result[0];
  } else {
    const result = await db.insert(settings).values({ key, value }).returning();
    return result[0];
  }
}

// Users
export async function getAllUsers(): Promise<User[]> {
  const db = getDb();
  return await db.select().from(users);
}

export async function getUser(id: number): Promise<User | undefined> {
  const db = getDb();
  const result = await db.select().from(users).where(eq(users.id, id));
  return result[0];
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const db = getDb();
  const result = await db.select().from(users).where(eq(users.username, username));
  return result[0];
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = getDb();
  const result = await db.select().from(users).where(eq(users.email, email));
  return result[0];
}

export async function createUser(insertUser: InsertUser): Promise<User> {
  const db = getDb();
  const result = await db.insert(users).values(insertUser).returning();
  return result[0];
}

export async function updateUser(id: number, updates: UpdateUser): Promise<User> {
  const db = getDb();
  const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
  if (result.length === 0) {
    throw new Error("User not found");
  }
  return result[0];
}

// Workshop Orders
export async function getAllWorkshopOrders(): Promise<WorkshopOrder[]> {
  const db = getDb();
  return await db.select().from(workshopOrders).orderBy(desc(workshopOrders.date));
}

export async function getWorkshopOrder(id: number): Promise<WorkshopOrder | undefined> {
  const db = getDb();
  const result = await db.select().from(workshopOrders).where(eq(workshopOrders.id, id));
  return result[0];
}

export async function createWorkshopOrder(insertOrder: InsertWorkshopOrder & { createdBy: number }): Promise<WorkshopOrder> {
  const db = getDb();
  const result = await db.insert(workshopOrders).values(insertOrder).returning();
  return result[0];
}

export async function updateWorkshopOrder(id: number, updates: Partial<InsertWorkshopOrder>): Promise<WorkshopOrder> {
  const db = getDb();
  const result = await db.update(workshopOrders)
    .set(updates)
    .where(eq(workshopOrders.id, id))
    .returning();
  if (result.length === 0) {
    throw new Error("Workshop order not found");
  }
  return result[0];
}

export async function deleteWorkshopOrder(id: number): Promise<void> {
  const db = getDb();
  await db.delete(workshopOrders).where(eq(workshopOrders.id, id));
}

// Product Stock
export async function getAllProductStock(): Promise<ProductStock[]> {
  const db = getDb();
  return await db.select().from(productStock);
}

export async function getProductStockByProduct(productId: number): Promise<ProductStock[]> {
  const db = getDb();
  return await db.select().from(productStock).where(eq(productStock.productId, productId));
}

export async function getProductStock(id: number): Promise<ProductStock | undefined> {
  const db = getDb();
  const result = await db.select().from(productStock).where(eq(productStock.id, id));
  return result[0];
}

export async function createProductStock(insertStock: InsertProductStock & { createdBy: number }): Promise<ProductStock> {
  const db = getDb();
  const result = await db.insert(productStock).values(insertStock).returning();
  return result[0];
}

export async function updateProductStockEntry(id: number, updates: Partial<InsertProductStock>): Promise<ProductStock> {
  const db = getDb();
  const result = await db.update(productStock)
    .set(updates)
    .where(eq(productStock.id, id))
    .returning();
  if (result.length === 0) {
    throw new Error("Product stock not found");
  }
  return result[0];
}

export async function deleteProductStock(id: number): Promise<void> {
  const db = getDb();
  await db.delete(productStock).where(eq(productStock.id, id));
}
