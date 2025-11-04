import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Minus, Trash2, Search } from "lucide-react";
import { AddProductModal } from "@/components/add-product-modal";
import { StockMovementModal } from "@/components/stock-movement-modal";
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

// TODO: remove mock data
const mockProducts = [
  { id: 1, name: 'Widget A', category: 'Electronics', estimatedPrice: 45.99, stock: 120 },
  { id: 2, name: 'Widget B', category: 'Electronics', estimatedPrice: 32.50, stock: 85 },
  { id: 3, name: 'Gadget X', category: 'Accessories', estimatedPrice: 18.75, stock: 200 },
  { id: 4, name: 'Tool Pro', category: 'Tools', estimatedPrice: 89.99, stock: 45 },
  { id: 5, name: 'Component Z', category: 'Parts', estimatedPrice: 12.30, stock: 5 },
];

export default function Inventory() {
  const [products, setProducts] = useState(mockProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [stockMovementOpen, setStockMovementOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [movementType, setMovementType] = useState<'add' | 'subtract'>('add');

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const totalValue = products.reduce((sum, p) => sum + (p.estimatedPrice * p.stock), 0);

  const handleAddProduct = (data: any) => {
    const newProduct = {
      id: Math.max(...products.map(p => p.id)) + 1,
      ...data,
    };
    setProducts([...products, newProduct]);
    console.log('Product added:', newProduct);
  };

  const handleStockMovement = (data: any) => {
    if (selectedProduct) {
      setProducts(products.map(p => {
        if (p.id === selectedProduct.id) {
          const newStock = movementType === 'add'
            ? p.stock + data.quantity
            : p.stock - data.quantity;
          return { ...p, stock: Math.max(0, newStock) };
        }
        return p;
      }));
      console.log('Stock movement:', { product: selectedProduct, type: movementType, ...data });
    }
  };

  const handleDeleteProduct = () => {
    if (selectedProduct) {
      setProducts(products.filter(p => p.id !== selectedProduct.id));
      console.log('Product deleted:', selectedProduct);
      setDeleteDialogOpen(false);
    }
  };

  const openStockModal = (product: any, type: 'add' | 'subtract') => {
    setSelectedProduct(product);
    setMovementType(type);
    setStockMovementOpen(true);
  };

  const openDeleteDialog = (product: any) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

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
            <div className="text-2xl font-bold tabular-nums" data-testid="text-total-value">${totalValue.toFixed(2)}</div>
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
          <div className="overflow-x-auto">
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
                  <tr key={product.id} className="border-b last:border-0" data-testid={`row-product-${product.id}`}>
                    <td className="p-4 text-sm font-medium">{product.name}</td>
                    <td className="p-4 text-sm">{product.category}</td>
                    <td className="p-4 text-sm text-right tabular-nums">${product.estimatedPrice.toFixed(2)}</td>
                    <td className="p-4 text-sm text-right tabular-nums">
                      <span className={product.stock < 10 ? 'text-destructive font-semibold' : ''}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-right tabular-nums font-semibold">
                      ${(product.estimatedPrice * product.stock).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openStockModal(product, 'add')}
                          data-testid={`button-add-stock-${product.id}`}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openStockModal(product, 'subtract')}
                          data-testid={`button-subtract-stock-${product.id}`}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openDeleteDialog(product)}
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
        </CardContent>
      </Card>

      <AddProductModal
        open={addProductOpen}
        onOpenChange={setAddProductOpen}
        onConfirm={handleAddProduct}
      />

      {selectedProduct && (
        <StockMovementModal
          open={stockMovementOpen}
          onOpenChange={setStockMovementOpen}
          productName={selectedProduct.name}
          type={movementType}
          onConfirm={handleStockMovement}
        />
      )}

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
