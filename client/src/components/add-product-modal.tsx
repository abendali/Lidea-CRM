import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { name: string; category: string; estimatedPrice: number; stock: number; imageUrl?: string }) => void;
}

export function AddProductModal({ open, onOpenChange, onConfirm }: AddProductModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [estimatedPrice, setEstimatedPrice] = useState("");
  const [stock, setStock] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const handleConfirm = () => {
    if (name && category && estimatedPrice && stock) {
      onConfirm({
        name,
        category,
        estimatedPrice: parseFloat(estimatedPrice),
        stock: parseInt(stock),
        imageUrl: imageUrl || undefined,
      });
      setName("");
      setCategory("");
      setEstimatedPrice("");
      setStock("");
      setImageUrl("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" data-testid="modal-add-product">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Enter product details to add to inventory
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              placeholder="Enter product name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="input-product-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              placeholder="Enter category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              data-testid="input-category"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Estimated Price (د.ج)</Label>
            <Input
              id="price"
              type="text"
              placeholder="0.00"
              value={estimatedPrice}
              onChange={(e) => setEstimatedPrice(e.target.value)}
              data-testid="input-price"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stock">Initial Stock</Label>
            <Input
              id="stock"
              type="text"
              placeholder="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              data-testid="input-stock"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL (Optional)</Label>
            <Input
              id="imageUrl"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              data-testid="input-image-url"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!name || !category || !estimatedPrice || !stock}
            data-testid="button-add-product"
          >
            Add Product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
