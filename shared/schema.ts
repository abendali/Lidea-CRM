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
  imageUrl: text("image_url"),
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

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
});

export const workshopOrders = pgTable("workshop_orders", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  quantity: integer("quantity").notNull(),
  totalOrderValue: doublePrecision("total_order_value").notNull(),
  materialCost: doublePrecision("material_cost").notNull().default(0),
  woodCost: doublePrecision("wood_cost").notNull().default(0),
  otherCosts: doublePrecision("other_costs").notNull().default(0),
  date: timestamp("date").notNull().defaultNow(),
  notes: text("notes").notNull().default(''),
});

export const insertProductSchema = createInsertSchema(products, {
  estimatedPrice: z.number().min(0),
  stock: z.number().int().min(0),
  imageUrl: z.string().url().optional().or(z.literal('')),
}).omit({
  id: true,
});

export const insertStockMovementSchema = createInsertSchema(stockMovements, {
  quantity: z.number().int().min(1),
}).omit({
  id: true,
  date: true,
});

export const insertCashflowSchema = createInsertSchema(cashflows, {
  amount: z.number().min(0),
  date: z.string().or(z.date()).transform((val) => new Date(val)),
}).omit({
  id: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
export type StockMovement = typeof stockMovements.$inferSelect;

export type InsertCashflow = z.infer<typeof insertCashflowSchema>;
export type Cashflow = typeof cashflows.$inferSelect;

export type Setting = typeof settings.$inferSelect;

export const insertUserSchema = createInsertSchema(users, {
  username: z.string().min(3).max(50),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6),
}).omit({
  id: true,
});

export const insertWorkshopOrderSchema = createInsertSchema(workshopOrders, {
  quantity: z.number().int().min(1),
  totalOrderValue: z.number().min(0),
  materialCost: z.number().min(0),
  woodCost: z.number().min(0),
  otherCosts: z.number().min(0),
}).omit({
  id: true,
  date: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertWorkshopOrder = z.infer<typeof insertWorkshopOrderSchema>;
export type WorkshopOrder = typeof workshopOrders.$inferSelect;
