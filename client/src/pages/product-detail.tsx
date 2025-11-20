import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Product, StockMovement, InsertStockMovement, ProductStock, InsertProductStock } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, TrendingDown, Package, Warehouse, Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUsers } from "@/hooks/use-users";
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

export default function ProductDetail() {
  const [, params] = useRoute("/inventory/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { getUserName } = useUsers();
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [stockFormData, setStockFormData] = useState({
    type: 'add' as 'add' | 'subtract',
    quantity: 1,
    reason: '',
    note: ''
  });
  const [isProductStockDialogOpen, setIsProductStockDialogOpen] = useState(false);
  const [productStockFormData, setProductStockFormData] = useState({
    color: '',
    quantity: 1,
    workshop: ''
  });

  const productId = params?.id ? parseInt(params.id) : undefined;

  const { data: product, isLoading: productLoading } = useQuery<Product>({
    queryKey: ["/api/products", productId],
    enabled: !!productId,
  });

  const { data: movements = [], isLoading: movementsLoading } = useQuery<StockMovement[]>({
    queryKey: ["/api/stock-movements", { productId }],
    queryFn: async () => {
      const res = await fetch(`/api/stock-movements?productId=${productId}`);
      if (!res.ok) throw new Error('Failed to fetch stock movements');
      return res.json();
    },
    enabled: !!productId,
  });

  const { data: productStocks = [], isLoading: productStocksLoading } = useQuery<ProductStock[]>({
    queryKey: ["/api/product-stock", { productId }],
    queryFn: async () => {
      const res = await fetch(`/api/product-stock?productId=${productId}`);
      if (!res.ok) throw new Error('Failed to fetch product stock');
      return res.json();
    },
    enabled: !!productId,
  });

  const stockMovementMutation = useMutation({
    mutationFn: async (data: InsertStockMovement) => {
      const res = await apiRequest("POST", "/api/stock-movements", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-movements"] });
      toast({
        title: "Stock updated",
        description: "Stock movement recorded successfully",
      });
      setIsStockDialogOpen(false);
      setStockFormData({ type: 'add', quantity: 1, reason: '', note: '' });
      setConfirmationText('');
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update stock",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addProductStockMutation = useMutation({
    mutationFn: async (data: InsertProductStock) => {
      const res = await apiRequest("POST", "/api/product-stock", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/product-stock", { productId }] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId] });
      toast({
        title: "Stock added",
        description: "Product stock entry added successfully",
      });
      setIsProductStockDialogOpen(false);
      setProductStockFormData({ color: '', quantity: 1, workshop: '' });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add stock",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteProductStockMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/product-stock/${id}`, undefined);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/product-stock", { productId }] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId] });
      toast({
        title: "Stock deleted",
        description: "Product stock entry deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete stock",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStockMovement = () => {
    if (!productId || !product) return;
    
    if (confirmationText.toLowerCase() !== 'i confirm') {
      toast({
        title: "Confirmation required",
        description: "Please type 'i confirm' to proceed.",
        variant: "destructive",
      });
      return;
    }

    if (stockFormData.quantity < 1) {
      toast({
        title: "Invalid quantity",
        description: "Quantity must be at least 1.",
        variant: "destructive",
      });
      return;
    }

    if (stockFormData.type === 'subtract' && stockFormData.quantity > product.stock) {
      toast({
        title: "Insufficient stock",
        description: `Cannot remove ${stockFormData.quantity} items. Only ${product.stock} available.`,
        variant: "destructive",
      });
      return;
    }

    stockMovementMutation.mutate({
      productId,
      ...stockFormData,
    });
  };

  const handleAddProductStock = () => {
    if (!productId) return;
    
    if (!productStockFormData.color.trim()) {
      toast({
        title: "Color required",
        description: "Please enter a color.",
        variant: "destructive",
      });
      return;
    }

    if (!productStockFormData.workshop.trim()) {
      toast({
        title: "Workshop required",
        description: "Please enter a workshop location.",
        variant: "destructive",
      });
      return;
    }

    if (productStockFormData.quantity < 1) {
      toast({
        title: "Invalid quantity",
        description: "Quantity must be at least 1.",
        variant: "destructive",
      });
      return;
    }

    addProductStockMutation.mutate({
      productId,
      ...productStockFormData,
    });
  };

  if (!productId) {
    return <div>Invalid product ID</div>;
  }

  if (productLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setLocation("/inventory")} data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Inventory
        </Button>
        <div className="text-center text-muted-foreground">Product not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => setLocation("/inventory")} data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {product.imageUrl && (
              <div className="w-full h-48 rounded-md overflow-hidden bg-accent/50">
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                  data-testid="img-product"
                />
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="text-lg font-semibold" data-testid="text-product-name">{product.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Category</p>
              <Badge variant="secondary" data-testid="badge-category">{product.category}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estimated Price</p>
              <p className="text-lg font-semibold" data-testid="text-price">{formatCurrency(product.estimatedPrice)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Stock</p>
              <p className="text-2xl font-bold" data-testid="text-stock">{product.stock}</p>
            </div>
            <Button 
              onClick={() => setIsStockDialogOpen(true)} 
              className="w-full"
              data-testid="button-update-stock"
            >
              Update Stock
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock Movement History</CardTitle>
            <CardDescription>Recent stock changes for this product</CardDescription>
          </CardHeader>
          <CardContent>
            {movementsLoading ? (
              <div className="text-center text-muted-foreground">Loading movements...</div>
            ) : movements.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No stock movements yet
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {movements.map((movement) => (
                  <div 
                    key={movement.id} 
                    className="flex items-start gap-3 p-3 rounded-md bg-accent/50"
                    data-testid={`movement-${movement.id}`}
                  >
                    <div className={`mt-1 ${movement.type === 'add' ? 'text-green-500' : 'text-red-500'}`}>
                      {movement.type === 'add' ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : (
                        <TrendingDown className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {movement.type === 'add' ? '+' : '-'}{movement.quantity}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(movement.date), 'MMM d, yyyy HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{movement.reason}</p>
                      {movement.note && (
                        <p className="text-xs text-muted-foreground mt-1">{movement.note}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        By: {getUserName(movement.createdBy)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Warehouse className="h-5 w-5" />
                Stock by Location
              </CardTitle>
              <CardDescription>Stock distributed across workshops by color</CardDescription>
            </div>
            <Button 
              onClick={() => setIsProductStockDialogOpen(true)}
              data-testid="button-add-product-stock"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Stock
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {productStocksLoading ? (
            <div className="text-center text-muted-foreground">Loading stock...</div>
          ) : productStocks.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No stock entries yet
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {productStocks.map((stock) => (
                <div 
                  key={stock.id} 
                  className="p-4 rounded-md border bg-card"
                  data-testid={`stock-${stock.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" data-testid={`stock-color-${stock.id}`}>
                          {stock.color}
                        </Badge>
                        <span className="text-lg font-bold tabular-nums" data-testid={`stock-quantity-${stock.id}`}>
                          {stock.quantity}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate" data-testid={`stock-workshop-${stock.id}`}>
                        <Warehouse className="h-3 w-3 inline mr-1" />
                        {stock.workshop}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteProductStockMutation.mutate(stock.id)}
                      disabled={deleteProductStockMutation.isPending}
                      data-testid={`button-delete-stock-${stock.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto" data-testid="dialog-update-stock">
          <DialogHeader>
            <DialogTitle>Update Stock</DialogTitle>
            <DialogDescription>
              Add or remove stock for {product.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select 
                value={stockFormData.type} 
                onValueChange={(value: 'add' | 'subtract') => 
                  setStockFormData({ ...stockFormData, type: value })
                }
              >
                <SelectTrigger id="type" data-testid="select-movement-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add Stock</SelectItem>
                  <SelectItem value="subtract">Remove Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="text"
                value={stockFormData.quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setStockFormData({ ...stockFormData, quantity: val > 0 ? val : 1 });
                }}
                data-testid="input-quantity"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                value={stockFormData.reason}
                onChange={(e) => setStockFormData({ ...stockFormData, reason: e.target.value })}
                placeholder="e.g., Restock, Sale, Damaged"
                data-testid="input-reason"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Note (Optional)</Label>
              <Textarea
                id="note"
                value={stockFormData.note}
                onChange={(e) => setStockFormData({ ...stockFormData, note: e.target.value })}
                placeholder="Additional notes..."
                data-testid="input-note"
              />
            </div>
            <div className="space-y-2 pt-2 border-t">
              <Label htmlFor="confirmation" className="text-destructive">
                Confirmation Required
              </Label>
              <p className="text-xs text-muted-foreground">
                This action cannot be reversed. Type "i confirm" to proceed.
              </p>
              <Input
                id="confirmation"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Type: i confirm"
                data-testid="input-confirmation"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsStockDialogOpen(false);
                setConfirmationText('');
              }}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleStockMovement}
              disabled={
                !stockFormData.reason || 
                confirmationText !== 'i confirm' || 
                stockMovementMutation.isPending
              }
              data-testid="button-submit-movement"
            >
              {stockMovementMutation.isPending ? "Updating..." : "Update Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isProductStockDialogOpen} onOpenChange={setIsProductStockDialogOpen}>
        <DialogContent data-testid="dialog-add-product-stock">
          <DialogHeader>
            <DialogTitle>Add Product Stock</DialogTitle>
            <DialogDescription>
              Add stock entry with color and workshop location for {product.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={productStockFormData.color}
                onChange={(e) => setProductStockFormData({ ...productStockFormData, color: e.target.value })}
                placeholder="e.g., Pink, Grey, Blue"
                data-testid="input-stock-color"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock-quantity">Quantity</Label>
              <Input
                id="stock-quantity"
                type="number"
                min="1"
                value={productStockFormData.quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setProductStockFormData({ ...productStockFormData, quantity: val > 0 ? val : 1 });
                }}
                data-testid="input-stock-quantity"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workshop">Workshop</Label>
              <Input
                id="workshop"
                value={productStockFormData.workshop}
                onChange={(e) => setProductStockFormData({ ...productStockFormData, workshop: e.target.value })}
                placeholder="e.g., Omar's, Main Workshop, Warehouse A"
                data-testid="input-stock-workshop"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsProductStockDialogOpen(false)}
              data-testid="button-cancel-stock"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddProductStock}
              disabled={
                !productStockFormData.color.trim() || 
                !productStockFormData.workshop.trim() || 
                addProductStockMutation.isPending
              }
              data-testid="button-submit-stock"
            >
              {addProductStockMutation.isPending ? "Adding..." : "Add Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
