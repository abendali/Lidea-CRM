import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertStockMovementSchema, insertCashflowSchema, insertWorkshopOrderSchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth, ensureAuthenticated } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Products API
  app.get("/api/products", ensureAuthenticated, async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/products/:id", ensureAuthenticated, async (req, res) => {
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

  app.post("/api/products", ensureAuthenticated, async (req, res) => {
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

  app.delete("/api/products/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProduct(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Stock Movements API
  app.get("/api/stock-movements", ensureAuthenticated, async (req, res) => {
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

  app.post("/api/stock-movements", ensureAuthenticated, async (req, res) => {
    try {
      const validatedData = insertStockMovementSchema.parse(req.body);
      
      // Get current product
      const product = await storage.getProduct(validatedData.productId as number);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Calculate new stock
      let newStock = product.stock;
      const movementType = validatedData.type as 'add' | 'subtract';
      const quantity = validatedData.quantity as number;
      
      if (movementType === 'add') {
        newStock += quantity;
      } else {
        newStock -= quantity;
      }

      // Ensure stock doesn't go negative
      if (newStock < 0) {
        return res.status(400).json({ message: "Insufficient stock" });
      }

      // Create movement and update product stock
      const movement = await storage.createStockMovement({
        ...validatedData,
        createdBy: req.user!.id,
      });
      await storage.updateProductStock(validatedData.productId as number, newStock, req.user!.id);

      res.status(201).json(movement);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Cashflow API
  app.get("/api/cashflows", ensureAuthenticated, async (req, res) => {
    try {
      const cashflows = await storage.getAllCashflows();
      res.json(cashflows);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/cashflows", ensureAuthenticated, async (req, res) => {
    try {
      const validatedData = insertCashflowSchema.parse(req.body);
      const cashflow = await storage.createCashflow(validatedData);
      res.status(201).json(cashflow);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Settings API
  app.get("/api/settings/:key", ensureAuthenticated, async (req, res) => {
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

  app.post("/api/settings", ensureAuthenticated, async (req, res) => {
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
  app.get("/api/workshop-orders", ensureAuthenticated, async (req, res) => {
    try {
      const orders = await storage.getAllWorkshopOrders();
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/workshop-orders", ensureAuthenticated, async (req, res) => {
    try {
      const validatedData = insertWorkshopOrderSchema.parse(req.body);
      const order = await storage.createWorkshopOrder(validatedData);
      res.status(201).json(order);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/workshop-orders/:id", ensureAuthenticated, async (req, res) => {
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

  app.delete("/api/workshop-orders/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteWorkshopOrder(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Dashboard stats endpoint
  app.get("/api/dashboard/stats", ensureAuthenticated, async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      const cashflows = await storage.getAllCashflows();
      const initialCapitalSetting = await storage.getSetting('initial_capital');
      
      const totalProducts = products.length;
      const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
      const totalStockValue = products.reduce((sum, p) => sum + (p.estimatedPrice * p.stock), 0);
      const lowStockCount = products.filter(p => p.stock < 10).length;
      
      const totalIncome = cashflows
        .filter(c => c.type === 'income')
        .reduce((sum, c) => sum + c.amount, 0);
      const totalExpense = cashflows
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

  const httpServer = createServer(app);
  return httpServer;
}
