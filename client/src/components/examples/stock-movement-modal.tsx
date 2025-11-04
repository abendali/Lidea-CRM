import { useState } from 'react';
import { StockMovementModal } from '../stock-movement-modal';
import { Button } from '@/components/ui/button';

export default function StockMovementModalExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-4">
      <Button onClick={() => setOpen(true)}>Open Stock Movement Modal</Button>
      <StockMovementModal
        open={open}
        onOpenChange={setOpen}
        productName="Sample Product"
        type="add"
        onConfirm={(data) => console.log('Stock movement:', data)}
      />
    </div>
  );
}
