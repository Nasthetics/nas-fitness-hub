import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SetLog } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface QuickSetInputProps {
  set: SetLog;
  previousSet?: { weight_kg: number | null; reps: number | null };
  onUpdate: (updates: Partial<SetLog>) => void;
  onDelete: () => void;
}

export function QuickSetInput({ set, previousSet, onUpdate, onDelete }: QuickSetInputProps) {
  const volume = (set.weight_kg || 0) * (set.reps || 0);
  
  const adjustWeight = (delta: number) => {
    const newWeight = Math.max(0, (set.weight_kg || 0) + delta);
    onUpdate({ weight_kg: newWeight });
  };

  const adjustReps = (delta: number) => {
    const newReps = Math.max(0, (set.reps || 0) + delta);
    onUpdate({ reps: newReps });
  };

  // Check if current set beats previous
  const isBetterThanPrevious = previousSet && 
    set.weight_kg && set.reps &&
    previousSet.weight_kg && previousSet.reps &&
    (set.weight_kg * set.reps) > (previousSet.weight_kg * previousSet.reps);

  return (
    <div className="space-y-2">
      <div 
        className={cn(
          'grid grid-cols-[40px_1fr_1fr_60px_60px_32px] gap-2 p-2 rounded-lg items-center',
          set.is_pr ? 'bg-primary/10 border border-primary/30' : 'bg-muted/50',
          isBetterThanPrevious && !set.is_pr && 'ring-1 ring-green-500/30'
        )}
      >
        {/* Set number */}
        <span className="flex items-center justify-center font-medium text-sm">
          {set.set_number}
        </span>

        {/* Weight with +/- buttons */}
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 shrink-0"
            onClick={() => adjustWeight(-2.5)}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <div className="relative flex-1">
            <Input
              type="number"
              value={set.weight_kg || ''}
              onChange={(e) => onUpdate({ weight_kg: Number(e.target.value) || null })}
              className="h-8 text-center pr-7"
              placeholder="kg"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              kg
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 shrink-0"
            onClick={() => adjustWeight(2.5)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        {/* Reps with +/- buttons */}
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 shrink-0"
            onClick={() => adjustReps(-1)}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Input
            type="number"
            value={set.reps || ''}
            onChange={(e) => onUpdate({ reps: Number(e.target.value) || null })}
            className="h-8 text-center flex-1"
            placeholder="reps"
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 shrink-0"
            onClick={() => adjustReps(1)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        {/* Previous reference */}
        <div className="text-xs text-muted-foreground text-center">
          {previousSet?.weight_kg && previousSet?.reps 
            ? `${previousSet.weight_kg}×${previousSet.reps}`
            : '—'
          }
        </div>

        {/* Volume */}
        <span className={cn(
          'text-sm text-center',
          isBetterThanPrevious ? 'text-green-500 font-medium' : 'text-muted-foreground'
        )}>
          {volume > 0 ? volume : '—'}
        </span>

        {/* Delete button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* RPE + RIR Row */}
      <div className="grid grid-cols-[40px_1fr_1fr_1fr] gap-2 px-2 items-center">
        <span></span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">RPE</span>
          <Select
            value={set.rpe?.toString() || ''}
            onValueChange={(v) => onUpdate({ rpe: v ? Number(v) : null })}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map(v => (
                <SelectItem key={v} value={v.toString()}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">RIR</span>
          <Select
            value={(set as any).rir?.toString() || ''}
            onValueChange={(v) => onUpdate({ rir: v ? Number(v) : null } as any)}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              {[0, 1, 2, 3, 4, 5].map(v => (
                <SelectItem key={v} value={v.toString()}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span></span>
      </div>
    </div>
  );
}
