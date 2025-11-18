import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Search } from "lucide-react";
import { AddProductModal } from "@/components/add-product-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";

export default function Inventory() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const addProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/products', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Product added",
        description: "The product has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add product.",
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Product deleted",
        description: "The product has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete product.",
        variant: "destructive",
      });
    },
  });

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const totalValue = products.reduce((sum, p) => sum + (p.estimatedPrice * p.stock), 0);

  const handleAddProduct = (data: any) => {
    addProductMutation.mutate(data);
    setAddProductOpen(false);
  };

  const handleDeleteProduct = () => {
    if (selectedProduct) {
      deleteProductMutation.mutate(selectedProduct.id);
      setDeleteDialogOpen(false);
    }
  };

  const openDeleteDialog = (product: Product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Inventory Management</h1>
          <p className="text-sm text-muted-foreground">Manage your product inventory and stock levels</p>
        </div>
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Inventory Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage your product inventory and stock levels
          </p>
        </div>
        <Button onClick={() => setAddProductOpen(true)} data-testid="button-add-product">
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums" data-testid="text-total-products">{totalProducts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums" data-testid="text-total-stock">{totalStock}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums" data-testid="text-total-value">{formatCurrency(totalValue)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {searchTerm ? 'No products found matching your search.' : 'No products yet. Add your first product to get started.'}
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Name</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Category</th>
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground">Unit Price</th>
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground">Stock</th>
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground">Total Value</th>
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr 
                        key={product.id} 
                        className="border-b last:border-0 hover-elevate cursor-pointer" 
                        onClick={() => setLocation(`/inventory/${product.id}`)}
                        data-testid={`row-product-${product.id}`}
                      >
                        <td className="p-4 text-sm font-medium">{product.name}</td>
                        <td className="p-4 text-sm">{product.category}</td>
                        <td className="p-4 text-sm text-right tabular-nums">{formatCurrency(product.estimatedPrice)}</td>
                        <td className="p-4 text-sm text-right tabular-nums">
                          <span className={product.stock < 10 ? 'text-destructive font-semibold' : ''}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-right tabular-nums font-semibold">
                          {formatCurrency(product.estimatedPrice * product.stock)}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => { e.stopPropagation(); openDeleteDialog(product); }}
                              data-testid={`button-delete-${product.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="p-4 hover-elevate cursor-pointer"
                    onClick={() => setLocation(`/inventory/${product.id}`)}
                    data-testid={`row-product-${product.id}`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{product.category}</p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); openDeleteDialog(product); }}
                        data-testid={`button-delete-${product.id}`}
                        className="shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Price:</span>
                        <span className="ml-2 font-medium tabular-nums">{formatCurrency(product.estimatedPrice)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Stock:</span>
                        <span className={`ml-2 font-medium tabular-nums ${product.stock < 10 ? 'text-destructive font-semibold' : ''}`}>
                          {product.stock}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Total Value:</span>
                        <span className="ml-2 font-semibold tabular-nums">
                          {formatCurrency(product.estimatedPrice * product.stock)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AddProductModal
        open={addProductOpen}
        onOpenChange={setAddProductOpen}
        onConfirm={handleAddProduct}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-product">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedProduct?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} data-testid="button-confirm-delete">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
