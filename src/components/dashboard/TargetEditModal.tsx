import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus } from 'lucide-react';
import { useUpdateProfile } from '@/hooks/use-fitness-data';
import { useToast } from '@/hooks/use-toast';

interface TargetEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  unit: string;
  currentValue: number;
  fieldName: string;
  step?: number;
  min?: number;
  max?: number;
}

export function TargetEditModal({ open, onOpenChange, label, unit, currentValue, fieldName, step = 1, min = 0, max = 99999 }: TargetEditModalProps) {
  const [value, setValue] = useState(currentValue);
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();

  const handleSave = async () => {
    await updateProfile.mutateAsync({ [fieldName]: value } as any);
    toast({ title: 'Target updated ✅' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>Edit {label} Target</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" onClick={() => setValue(v => Math.max(min, v - step))}>
              <Minus className="h-5 w-5" />
            </Button>
            <Input
              type="number"
              value={value}
              onChange={e => setValue(Number(e.target.value))}
              className="text-center text-3xl font-bold h-16 w-32"
              step={step}
              min={min}
              max={max}
            />
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" onClick={() => setValue(v => Math.min(max, v + step))}>
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          <span className="text-sm text-muted-foreground">{unit}</span>
          <Button onClick={handleSave} disabled={updateProfile.isPending} className="w-full">
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
