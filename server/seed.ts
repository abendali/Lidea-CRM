import { db } from "./db";
import { products, stockMovements, cashflows, settings } from "@shared/schema";

async function seed() {
  console.log("Starting seed...");

  // Clear existing data
  await db.delete(stockMovements);
  await db.delete(cashflows);
  await db.delete(products);
  await db.delete(settings);

  // Seed products
  const productData = [
    { name: 'Widget A', category: 'Electronics', estimatedPrice: 45.99, stock: 120 },
    { name: 'Widget B', category: 'Electronics', estimatedPrice: 32.50, stock: 85 },
    { name: 'Gadget X', category: 'Accessories', estimatedPrice: 18.75, stock: 200 },
    { name: 'Tool Pro', category: 'Tools', estimatedPrice: 89.99, stock: 45 },
    { name: 'Component Z', category: 'Parts', estimatedPrice: 12.30, stock: 5 },
  ];

  const insertedProducts = await db.insert(products).values(productData).returning();
  console.log(`Seeded ${insertedProducts.length} products`);

  // Seed cashflows
  const cashflowData = [
    { type: 'income' as const, amount: 450, category: 'Sales', description: 'Product Sale - Widget A', date: new Date('2025-11-03') },
    { type: 'expense' as const, amount: 850, category: 'Materials', description: 'Raw Materials Purchase', date: new Date('2025-11-03') },
    { type: 'income' as const, amount: 320, category: 'Sales', description: 'Product Sale - Widget B', date: new Date('2025-11-02') },
    { type: 'expense' as const, amount: 125, category: 'Utilities', description: 'Electricity and Water Bills', date: new Date('2025-11-02') },
    { type: 'income' as const, amount: 1200, category: 'Sales', description: 'Bulk Order - 50 units', date: new Date('2025-11-01') },
    { type: 'expense' as const, amount: 450, category: 'Labor', description: 'Worker Wages - Week 44', date: new Date('2025-11-01') },
    { type: 'expense' as const, amount: 200, category: 'Marketing', description: 'Facebook Ads Campaign', date: new Date('2025-10-31') },
    { type: 'income' as const, amount: 675, category: 'Services', description: 'Custom Assembly Service', date: new Date('2025-10-30') },
  ];

  const insertedCashflows = await db.insert(cashflows).values(cashflowData).returning();
  console.log(`Seeded ${insertedCashflows.length} cashflow transactions`);

  // Seed initial capital setting
  await db.insert(settings).values({ key: 'initial_capital', value: '5000' });
  console.log('Seeded initial capital setting');

  // Seed some stock movements
  if (insertedProducts.length > 0) {
    const stockMovementData = [
      { 
        productId: insertedProducts[0].id, 
        type: 'add' as const, 
        quantity: 50, 
        reason: 'Restock', 
        note: 'Monthly restock',
        date: new Date('2025-10-28')
      },
      { 
        productId: insertedProducts[1].id, 
        type: 'subtract' as const, 
        quantity: 15, 
        reason: 'Sale', 
        note: 'Sold to customer ABC',
        date: new Date('2025-10-29')
      },
    ];

    const insertedMovements = await db.insert(stockMovements).values(stockMovementData).returning();
    console.log(`Seeded ${insertedMovements.length} stock movements`);
  }

  console.log("Seed completed!");
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
