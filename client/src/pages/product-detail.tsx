import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Product, StockMovement, InsertStockMovement } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, TrendingDown, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [stockFormData, setStockFormData] = useState({
    type: 'add' as 'add' | 'subtract',
    quantity: 1,
    reason: '',
    note: ''
  });

  const productId = params?.id ? parseInt(params.id) : undefined;

  const { data: product, isLoading: productLoading } = useQuery<Product>({
    queryKey: ["/api/products", productId],
    enabled: !!productId,
  });

  const { data: movements = [], isLoading: movementsLoading } = useQuery<StockMovement[]>({
    queryKey: ["/api/stock-movements", productId],
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
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update stock",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStockMovement = () => {
    if (!productId) return;
    stockMovementMutation.mutate({
      productId,
      ...stockFormData,
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
        <DialogContent data-testid="dialog-update-stock">
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
                type="number"
                min="1"
                value={stockFormData.quantity}
                onChange={(e) => setStockFormData({ ...stockFormData, quantity: parseInt(e.target.value) || 1 })}
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
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsStockDialogOpen(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleStockMovement}
              disabled={!stockFormData.reason || stockMovementMutation.isPending}
              data-testid="button-submit-movement"
            >
              {stockMovementMutation.isPending ? "Updating..." : "Update Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
