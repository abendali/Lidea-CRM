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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StockMovementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  type: 'add' | 'subtract';
  onConfirm: (data: { quantity: number; reason: string; note: string }) => void;
}

const reasons = {
  add: ['Restock', 'Production', 'Return', 'Adjustment'],
  subtract: ['Sale', 'Damage', 'Loss', 'Adjustment'],
};

export function StockMovementModal({
  open,
  onOpenChange,
  productName,
  type,
  onConfirm,
}: StockMovementModalProps) {
  const [quantity, setQuantity] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const handleConfirm = () => {
    if (quantity && reason) {
      onConfirm({
        quantity: parseInt(quantity),
        reason,
        note,
      });
      setQuantity("");
      setReason("");
      setNote("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="modal-stock-movement">
        <DialogHeader>
          <DialogTitle>
            {type === 'add' ? 'Add Stock' : 'Subtract Stock'}
          </DialogTitle>
          <DialogDescription>
            {productName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="text"
              placeholder="Enter quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              data-testid="input-quantity"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason" data-testid="select-reason">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {reasons[type].map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Note (Optional)</Label>
            <Textarea
              id="note"
              placeholder="Additional notes..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              data-testid="input-note"
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
            disabled={!quantity || !reason}
            data-testid="button-confirm"
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
