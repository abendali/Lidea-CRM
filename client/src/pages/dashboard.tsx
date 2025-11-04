import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// TODO: remove mock data
const mockStats = {
  totalProducts: 24,
  totalStockValue: 12450,
  cashBalance: 8750,
  lowStockCount: 3,
};

const mockRecentTransactions = [
  { id: 1, type: 'income', description: 'Product Sale - Widget A', amount: 450, date: '2025-11-03' },
  { id: 2, type: 'expense', description: 'Raw Materials Purchase', amount: 850, date: '2025-11-03' },
  { id: 3, type: 'income', description: 'Product Sale - Widget B', amount: 320, date: '2025-11-02' },
  { id: 4, type: 'expense', description: 'Utility Bills', amount: 125, date: '2025-11-02' },
  { id: 5, type: 'income', description: 'Bulk Order', amount: 1200, date: '2025-11-01' },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your store's performance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Products"
          value={mockStats.totalProducts}
          icon={Package}
          testId="card-total-products"
        />
        <MetricCard
          title="Stock Value"
          value={`$${mockStats.totalStockValue.toLocaleString()}`}
          icon={TrendingUp}
          testId="card-stock-value"
        />
        <MetricCard
          title="Cash Balance"
          value={`$${mockStats.cashBalance.toLocaleString()}`}
          icon={DollarSign}
          testId="card-cash-balance"
        />
        <MetricCard
          title="Low Stock Items"
          value={mockStats.lowStockCount}
          icon={AlertCircle}
          testId="card-low-stock"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between gap-4"
                  data-testid={`transaction-${transaction.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={transaction.type === 'income' ? 'default' : 'secondary'}
                        className="shrink-0"
                      >
                        {transaction.type}
                      </Badge>
                      <p className="text-sm font-medium truncate">
                        {transaction.description}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div
                    className={`text-sm font-semibold tabular-nums ${
                      transaction.type === 'income' ? 'text-chart-2' : 'text-destructive'
                    }`}
                  >
                    {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-sm text-muted-foreground">Total Inventory Items</span>
                <span className="text-sm font-semibold tabular-nums">{mockStats.totalProducts}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-sm text-muted-foreground">Items Needing Restock</span>
                <span className="text-sm font-semibold tabular-nums text-destructive">
                  {mockStats.lowStockCount}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-sm text-muted-foreground">Total Stock Value</span>
                <span className="text-sm font-semibold tabular-nums">
                  ${mockStats.totalStockValue.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-muted-foreground">Available Cash</span>
                <span className="text-sm font-semibold tabular-nums text-chart-2">
                  ${mockStats.cashBalance.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
