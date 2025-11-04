import { useState } from 'react';
import { AddTransactionModal } from '../add-transaction-modal';
import { Button } from '@/components/ui/button';

export default function AddTransactionModalExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-4">
      <Button onClick={() => setOpen(true)}>Open Add Transaction Modal</Button>
      <AddTransactionModal
        open={open}
        onOpenChange={setOpen}
        type="income"
        onConfirm={(data) => console.log('New transaction:', data)}
      />
    </div>
  );
}
