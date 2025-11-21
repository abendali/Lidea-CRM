import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from '../_lib/auth';
import * as storage from '../_lib/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await getUserFromRequest(req);
  
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
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
      
      return res.status(200).json({
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
      return res.status(500).json({ message: error.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
