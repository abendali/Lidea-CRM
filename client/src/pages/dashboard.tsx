import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { Cashflow } from "@shared/schema";

interface DashboardStats {
  totalProducts: number;
  totalStockValue: number;
  cashBalance: number;
  lowStockCount: number;
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<Cashflow[]>({
    queryKey: ['/api/cashflows'],
  });

  const recentTransactions = transactions?.slice(0, 5) || [];

  if (statsLoading || transactionsLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of your store's performance</p>
        </div>
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

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
          value={stats?.totalProducts || 0}
          icon={Package}
          testId="card-total-products"
        />
        <MetricCard
          title="Stock Value"
          value={`$${(stats?.totalStockValue || 0).toLocaleString()}`}
          icon={TrendingUp}
          testId="card-stock-value"
        />
        <MetricCard
          title="Cash Balance"
          value={`$${(stats?.currentCapital || 0).toLocaleString()}`}
          icon={DollarSign}
          testId="card-cash-balance"
        />
        <MetricCard
          title="Low Stock Items"
          value={stats?.lowStockCount || 0}
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
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No transactions yet</p>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
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
            )}
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
                <span className="text-sm font-semibold tabular-nums">{stats?.totalProducts || 0}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-sm text-muted-foreground">Items Needing Restock</span>
                <span className="text-sm font-semibold tabular-nums text-destructive">
                  {stats?.lowStockCount || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-sm text-muted-foreground">Total Stock Value</span>
                <span className="text-sm font-semibold tabular-nums">
                  ${(stats?.totalStockValue || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-muted-foreground">Available Cash</span>
                <span className="text-sm font-semibold tabular-nums text-chart-2">
                  ${(stats?.currentCapital || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
