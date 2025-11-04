import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, doublePrecision, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const products = pgTable("products", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  estimatedPrice: doublePrecision("estimated_price").notNull(),
  stock: integer("stock").notNull().default(0),
});

export const stockMovements = pgTable("stock_movements", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  type: text("type", { enum: ['add', 'subtract'] }).notNull(),
  quantity: integer("quantity").notNull(),
  reason: text("reason").notNull(),
  note: text("note").notNull().default(''),
  date: timestamp("date").notNull().defaultNow(),
});

export const cashflows = pgTable("cashflows", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  type: text("type", { enum: ['income', 'expense'] }).notNull(),
  amount: doublePrecision("amount").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  date: timestamp("date").notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
});

export const insertStockMovementSchema = createInsertSchema(stockMovements).omit({
  id: true,
  date: true,
});

export const insertCashflowSchema = createInsertSchema(cashflows).omit({
  id: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
export type StockMovement = typeof stockMovements.$inferSelect;

export type InsertCashflow = z.infer<typeof insertCashflowSchema>;
export type Cashflow = typeof cashflows.$inferSelect;

export type Setting = typeof settings.$inferSelect;
