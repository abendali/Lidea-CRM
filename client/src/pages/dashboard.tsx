import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package, DollarSign, TrendingUp, AlertCircle, Wrench, Plus, Trash2, Warehouse } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Cashflow, WorkshopOrder, Product, InsertWorkshopOrder, ProductStock } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-supabase-auth";

interface DashboardStats {
  totalProducts: number;
  totalStockValue: number;
  cashBalance: number;
  lowStockCount: number;
  currentCapital: number;
}

export default function Dashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isWorkshopDialogOpen, setIsWorkshopDialogOpen] = useState(false);
  const [workshopFormData, setWorkshopFormData] = useState({
    productId: '',
    quantity: 1,
    totalOrderValue: 0,
    materialCost: 0,
    woodCost: 0,
    otherCosts: 0,
    notes: ''
  });

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<Cashflow[]>({
    queryKey: ['/api/cashflows'],
  });

  const { data: workshopOrders = [], isLoading: workshopOrdersLoading } = useQuery<WorkshopOrder[]>({
    queryKey: ['/api/workshop-orders'],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const { data: productStocks = [] } = useQuery<ProductStock[]>({
    queryKey: ['/api/product-stock'],
  });

  const createWorkshopOrderMutation = useMutation({
    mutationFn: async (data: InsertWorkshopOrder) => {
      const res = await apiRequest('POST', '/api/workshop-orders', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workshop-orders'] });
      toast({
        title: "Workshop order created",
        description: "The workshop order has been added successfully.",
      });
      setIsWorkshopDialogOpen(false);
      setWorkshopFormData({
        productId: '',
        quantity: 1,
        totalOrderValue: 0,
        materialCost: 0,
        woodCost: 0,
        otherCosts: 0,
        notes: ''
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create workshop order.",
        variant: "destructive",
      });
    },
  });

  const deleteWorkshopOrderMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/workshop-orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workshop-orders'] });
      toast({
        title: "Workshop order deleted",
        description: "The workshop order has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete workshop order.",
        variant: "destructive",
      });
    },
  });

  const handleCreateWorkshopOrder = () => {
    if (!workshopFormData.productId) {
      toast({
        title: "Product required",
        description: "Please select a product for the workshop order.",
        variant: "destructive",
      });
      return;
    }

    const productId = parseInt(workshopFormData.productId);
    if (isNaN(productId)) {
      toast({
        title: "Invalid product",
        description: "Please select a valid product.",
        variant: "destructive",
      });
      return;
    }

    if (workshopFormData.quantity < 1) {
      toast({
        title: "Invalid quantity",
        description: "Quantity must be at least 1.",
        variant: "destructive",
      });
      return;
    }

    if (workshopFormData.totalOrderValue < 0 || 
        workshopFormData.materialCost < 0 || 
        workshopFormData.woodCost < 0 || 
        workshopFormData.otherCosts < 0) {
      toast({
        title: "Invalid costs",
        description: "All cost values must be zero or positive.",
        variant: "destructive",
      });
      return;
    }

    createWorkshopOrderMutation.mutate({
      productId,
      quantity: workshopFormData.quantity,
      totalOrderValue: workshopFormData.totalOrderValue,
      materialCost: workshopFormData.materialCost,
      woodCost: workshopFormData.woodCost,
      otherCosts: workshopFormData.otherCosts,
      notes: workshopFormData.notes,
    });
  };

  const getProductName = (productId: number) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Unknown Product';
  };

  const calculateWorkshopPayment = (order: WorkshopOrder) => {
    return order.totalOrderValue - order.materialCost - order.woodCost - order.otherCosts;
  };

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            Welcome back, {user?.name || user?.username || 'User'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Measure your advertising ROI and report website traffic.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" data-testid="button-export">
            Export data
          </Button>
          <Button variant="destructive" size="sm" data-testid="button-create-report">
            Create report
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pageviews</CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <span className="text-xs">•••</span>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold tabular-nums">{(stats?.totalProducts || 0) * 10}K</div>
              <Badge variant="outline" className="text-xs bg-chart-2/10 text-chart-2 border-chart-2/20">
                28.1%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="relative">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly users</CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <span className="text-xs">•••</span>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold tabular-nums">{(stats?.totalProducts || 0) * 4}K</div>
              <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/20">
                -8%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="relative">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New sign ups</CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <span className="text-xs">•••</span>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold tabular-nums">{stats?.lowStockCount || 0}</div>
              <Badge variant="outline" className="text-xs bg-chart-2/10 text-chart-2 border-chart-2/20">
                3.0%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="relative">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Subscriptions</CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <span className="text-xs">•••</span>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold tabular-nums">2.3K</div>
              <Badge variant="outline" className="text-xs bg-chart-2/10 text-chart-2 border-chart-2/20">
                11.3%
              </Badge>
            </div>
          </CardContent>
        </Card>
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
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
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
                  {formatCurrency(stats?.totalStockValue || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-muted-foreground">Available Cash</span>
                <span className="text-sm font-semibold tabular-nums text-chart-2">
                  {formatCurrency(stats?.currentCapital || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Workshop Orders
            </CardTitle>
            <CardDescription>Track orders and calculate workshop payments</CardDescription>
          </div>
          <Button onClick={() => setIsWorkshopDialogOpen(true)} data-testid="button-add-workshop-order" className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Order
          </Button>
        </CardHeader>
        <CardContent>
          {workshopOrdersLoading ? (
            <p className="text-sm text-muted-foreground">Loading workshop orders...</p>
          ) : workshopOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No workshop orders yet</p>
          ) : (
            <div className="space-y-4">
              {workshopOrders.map((order) => {
                const workshopPayment = calculateWorkshopPayment(order);
                return (
                  <div
                    key={order.id}
                    className="p-4 rounded-md border"
                    data-testid={`workshop-order-${order.id}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold" data-testid={`text-product-name-${order.id}`}>
                            {getProductName(order.productId)}
                          </p>
                          <Badge variant="secondary" data-testid={`badge-quantity-${order.id}`}>
                            Qty: {order.quantity}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Total Order:</span>
                            <span className="ml-2 font-medium tabular-nums" data-testid={`text-total-${order.id}`}>
                              {formatCurrency(order.totalOrderValue)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Material:</span>
                            <span className="ml-2 font-medium tabular-nums" data-testid={`text-material-${order.id}`}>
                              {formatCurrency(order.materialCost)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Wood:</span>
                            <span className="ml-2 font-medium tabular-nums" data-testid={`text-wood-${order.id}`}>
                              {formatCurrency(order.woodCost)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Other:</span>
                            <span className="ml-2 font-medium tabular-nums" data-testid={`text-other-${order.id}`}>
                              {formatCurrency(order.otherCosts)}
                            </span>
                          </div>
                        </div>
                        <div className="pt-2 border-t">
                          <span className="text-sm text-muted-foreground">Workshop Payment:</span>
                          <span className="ml-2 text-lg font-bold text-chart-2 tabular-nums" data-testid={`text-payment-${order.id}`}>
                            {formatCurrency(workshopPayment)}
                          </span>
                        </div>
                        {order.notes && (
                          <p className="text-xs text-muted-foreground" data-testid={`text-notes-${order.id}`}>
                            Notes: {order.notes}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground" data-testid={`text-date-${order.id}`}>
                          {format(new Date(order.date), 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteWorkshopOrderMutation.mutate(order.id)}
                        data-testid={`button-delete-order-${order.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            Stock by Location
          </CardTitle>
          <CardDescription>Product inventory across workshops</CardDescription>
        </CardHeader>
        <CardContent>
          {productStocks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No stock entries yet</p>
          ) : (
            <div className="space-y-6">
              {products
                .filter((product) => productStocks.some((stock) => stock.productId === product.id))
                .map((product) => {
                  const stocks = productStocks.filter((stock) => stock.productId === product.id);
                  const totalQuantity = stocks.reduce((sum, stock) => sum + stock.quantity, 0);
                  
                  return (
                    <div key={product.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold" data-testid={`product-name-${product.id}`}>{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Total: <span className="font-medium tabular-nums">{totalQuantity}</span> units
                          </p>
                        </div>
                      </div>
                      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                        {stocks.map((stock) => (
                          <div 
                            key={stock.id} 
                            className="p-3 rounded-md border bg-card"
                            data-testid={`dashboard-stock-${stock.id}`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" data-testid={`dashboard-stock-color-${stock.id}`}>
                                {stock.color}
                              </Badge>
                              <span className="font-bold tabular-nums" data-testid={`dashboard-stock-quantity-${stock.id}`}>
                                {stock.quantity}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate" data-testid={`dashboard-stock-workshop-${stock.id}`}>
                              <Warehouse className="h-3 w-3 inline mr-1" />
                              {stock.workshop}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isWorkshopDialogOpen} onOpenChange={setIsWorkshopDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto" data-testid="dialog-add-workshop-order">
          <DialogHeader>
            <DialogTitle>Add Workshop Order</DialogTitle>
            <DialogDescription>
              Create a new workshop order to track costs and calculate payment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product">Product</Label>
              <Select 
                value={workshopFormData.productId} 
                onValueChange={(value) => 
                  setWorkshopFormData({ ...workshopFormData, productId: value })
                }
              >
                <SelectTrigger id="product" data-testid="select-product">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="text"
                value={workshopFormData.quantity}
                onChange={(e) => setWorkshopFormData({ ...workshopFormData, quantity: parseInt(e.target.value) || 1 })}
                data-testid="input-quantity"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalOrderValue">Total Order Value</Label>
              <Input
                id="totalOrderValue"
                type="text"
                value={workshopFormData.totalOrderValue}
                onChange={(e) => setWorkshopFormData({ ...workshopFormData, totalOrderValue: parseFloat(e.target.value) || 0 })}
                data-testid="input-total-order"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="materialCost">Material Cost</Label>
              <Input
                id="materialCost"
                type="text"
                value={workshopFormData.materialCost}
                onChange={(e) => setWorkshopFormData({ ...workshopFormData, materialCost: parseFloat(e.target.value) || 0 })}
                data-testid="input-material-cost"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="woodCost">Wood Cost</Label>
              <Input
                id="woodCost"
                type="text"
                value={workshopFormData.woodCost}
                onChange={(e) => setWorkshopFormData({ ...workshopFormData, woodCost: parseFloat(e.target.value) || 0 })}
                data-testid="input-wood-cost"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="otherCosts">Other Costs</Label>
              <Input
                id="otherCosts"
                type="text"
                value={workshopFormData.otherCosts}
                onChange={(e) => setWorkshopFormData({ ...workshopFormData, otherCosts: parseFloat(e.target.value) || 0 })}
                data-testid="input-other-costs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={workshopFormData.notes}
                onChange={(e) => setWorkshopFormData({ ...workshopFormData, notes: e.target.value })}
                placeholder="Additional notes..."
                data-testid="input-notes"
              />
            </div>
            <div className="p-3 rounded-md bg-accent/50">
              <p className="text-sm text-muted-foreground">Workshop Payment:</p>
              <p className="text-lg font-bold text-chart-2 tabular-nums" data-testid="text-calculated-payment">
                {formatCurrency(
                  workshopFormData.totalOrderValue - 
                  workshopFormData.materialCost - 
                  workshopFormData.woodCost - 
                  workshopFormData.otherCosts
                )}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsWorkshopDialogOpen(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateWorkshopOrder}
              disabled={!workshopFormData.productId || createWorkshopOrderMutation.isPending}
              data-testid="button-submit-order"
            >
              {createWorkshopOrderMutation.isPending ? "Creating..." : "Create Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
