import { useState } from 'react';
import { AddProductModal } from '../add-product-modal';
import { Button } from '@/components/ui/button';

export default function AddProductModalExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-4">
      <Button onClick={() => setOpen(true)}>Open Add Product Modal</Button>
      <AddProductModal
        open={open}
        onOpenChange={setOpen}
        onConfirm={(data) => console.log('New product:', data)}
      />
    </div>
  );
}
