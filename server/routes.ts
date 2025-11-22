import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertStockMovementSchema, insertCashflowSchema, insertWorkshopOrderSchema, updateUserSchema, insertProductStockSchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth, ensureAuthenticated, hashPassword } from "./auth";

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
  app.get("/api/users", ensureAuthenticated, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/users/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (id !== req.user!.id) {
        return res.status(403).json({ message: "You can only update your own profile" });
      }
      
      const validatedData = updateUserSchema.parse(req.body);
      
      // Hash password if provided
      const updates = { ...validatedData };
      if (updates.password) {
        updates.password = await hashPassword(updates.password);
      }
      
      const user = await storage.updateUser(id, updates);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // User Management API (Admin only)
  app.get("/api/users", ensureAuthenticated, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/users/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Prevent users from deleting themselves
      if (id === req.user!.id) {
        return res.status(400).json({ message: "You cannot delete your own account" });
      }
      
      await storage.deleteUser(id);
      res.status(204).send();
    } catch (error: any) {
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

  // Product Stock API
  app.get("/api/product-stock", ensureAuthenticated, async (req, res) => {
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

  app.get("/api/product-stock/:id", ensureAuthenticated, async (req, res) => {
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

  app.post("/api/product-stock", ensureAuthenticated, async (req, res) => {
    try {
      const validatedData = insertProductStockSchema.parse(req.body);
      
      // Verify product exists
      const product = await storage.getProduct(validatedData.productId as number);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Create the stock entry
      const stock = await storage.createProductStock({
        ...validatedData,
        createdBy: req.user!.id,
      });

      // Update the product's total stock
      const newTotalStock = product.stock + validatedData.quantity;
      await storage.updateProductStock(validatedData.productId as number, newTotalStock, req.user!.id);

      res.status(201).json(stock);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/product-stock/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertProductStockSchema.partial().parse(req.body);
      
      // Prevent changing productId
      if (validatedData.productId !== undefined) {
        return res.status(400).json({ message: "Cannot change product ID of a stock entry" });
      }

      // Get the current stock entry
      const currentStock = await storage.getProductStock(id);
      if (!currentStock) {
        return res.status(404).json({ message: "Product stock not found" });
      }

      // Get the product
      const product = await storage.getProduct(currentStock.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // If quantity is changing, validate the new total would be non-negative
      if (validatedData.quantity !== undefined && validatedData.quantity !== currentStock.quantity) {
        const quantityDelta = validatedData.quantity - currentStock.quantity;
        const newTotalStock = product.stock + quantityDelta;
        
        if (newTotalStock < 0) {
          return res.status(400).json({ message: "Cannot reduce stock below zero" });
        }
        
        // Update the stock entry first
        const updatedStock = await storage.updateProductStockEntry(id, validatedData);
        
        // Then update the product's total stock
        await storage.updateProductStock(currentStock.productId, newTotalStock, req.user!.id);
        
        res.json(updatedStock);
      } else {
        // No quantity change, just update other fields
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

  app.delete("/api/product-stock/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the stock entry before deleting
      const stock = await storage.getProductStock(id);
      if (!stock) {
        return res.status(404).json({ message: "Product stock not found" });
      }

      // Get the product
      const product = await storage.getProduct(stock.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Check if we can reduce stock
      const newTotalStock = product.stock - stock.quantity;
      if (newTotalStock < 0) {
        return res.status(400).json({ message: "Cannot reduce stock below zero" });
      }

      // Delete the stock entry
      await storage.deleteProductStock(id);

      // Update the product's total stock
      await storage.updateProductStock(stock.productId, newTotalStock, req.user!.id);

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
