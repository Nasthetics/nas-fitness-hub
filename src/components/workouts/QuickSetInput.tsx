import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Trash2, MessageSquare, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SetLog } from '@/lib/types';
import { useState, useRef, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface QuickSetInputProps {
  set: SetLog;
  previousSet?: { weight_kg: number | null; reps: number | null };
  onUpdate: (updates: Partial<SetLog>) => void;
  onDelete: () => void;
  onLogSet?: () => void;
  isLogged?: boolean;
}

const RPE_VALUES = [6, 7, 8, 9, 10];
const RIR_VALUES = [0, 1, 2, 3];

export function QuickSetInput({ set, previousSet, onUpdate, onDelete, onLogSet, isLogged }: QuickSetInputProps) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState(set.notes || '');
  const [flash, setFlash] = useState(false);
  const longPressRef = useRef<NodeJS.Timeout | null>(null);

  const volume = (set.weight_kg || 0) * (set.reps || 0);
  
  const adjustWeight = (delta: number) => {
    const newWeight = Math.max(0, (set.weight_kg || 0) + delta);
    onUpdate({ weight_kg: newWeight });
  };

  const adjustReps = (delta: number) => {
    const newReps = Math.max(0, (set.reps || 0) + delta);
    onUpdate({ reps: newReps });
  };

  const handleLongPressStart = useCallback((delta: number) => {
    longPressRef.current = setTimeout(() => {
      adjustWeight(delta > 0 ? 10 : -10);
    }, 500);
  }, [set.weight_kg]);

  const handleLongPressEnd = useCallback(() => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  }, []);

  const handleLogSet = () => {
    if (onLogSet) {
      // Vibrate feedback
      if (navigator.vibrate) navigator.vibrate(50);
      setFlash(true);
      setTimeout(() => setFlash(false), 500);
      onLogSet();
    }
  };

  const saveNote = () => {
    onUpdate({ notes: noteText || null });
    setNoteOpen(false);
  };

  const isBetterThanPrevious = previousSet && 
    set.weight_kg && set.reps &&
    previousSet.weight_kg && previousSet.reps &&
    (set.weight_kg * set.reps) > (previousSet.weight_kg * previousSet.reps);

  return (
    <div className={cn(
      'rounded-xl border transition-all duration-300',
      flash && 'bg-success/20 border-success/50',
      isLogged ? 'bg-muted/30 border-border opacity-75' : 'bg-card border-border',
      set.is_dropset && 'border-warning/50 bg-warning/5',
      !isLogged && !flash && 'border-l-2 border-l-info',
    )}>
      {/* Main set row */}
      <div className="p-3 space-y-3">
        {/* Set number + delete + note + dropset */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-info/20 text-xs font-bold text-info">
              {isLogged ? <Check className="h-3.5 w-3.5" /> : set.set_number}
            </span>
            {previousSet?.weight_kg && previousSet?.reps && (
              <span className="text-xs text-muted-foreground">
                Prev: {previousSet.weight_kg}×{previousSet.reps}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {set.is_dropset && (
              <span className="text-[10px] font-bold text-warning bg-warning/20 px-1.5 py-0.5 rounded">DS</span>
            )}
            {(set as any).superset_group_id && (
              <span className="text-[10px] font-bold text-info bg-info/20 px-1.5 py-0.5 rounded">SS</span>
            )}
            <button
              onClick={() => onUpdate({ is_dropset: !set.is_dropset } as any)}
              className={cn(
                'text-[10px] px-1.5 py-0.5 rounded border transition-colors',
                set.is_dropset ? 'bg-warning/20 border-warning/30 text-warning' : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              DS
            </button>
            <Popover open={noteOpen} onOpenChange={setNoteOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className={cn('h-7 w-7', set.notes && 'text-info')}>
                  <MessageSquare className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="end">
                <Input
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="e.g. felt easy, left shoulder tight"
                  className="text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && saveNote()}
                />
                <Button size="sm" className="w-full mt-2" onClick={saveNote}>Save Note</Button>
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Weight stepper */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-12">Weight</span>
          <Button 
            variant="outline" size="icon" 
            className="h-12 w-12 shrink-0 rounded-xl text-lg"
            onClick={() => adjustWeight(-2.5)}
            onMouseDown={() => handleLongPressStart(-2.5)}
            onMouseUp={handleLongPressEnd}
            onMouseLeave={handleLongPressEnd}
            onTouchStart={() => handleLongPressStart(-2.5)}
            onTouchEnd={handleLongPressEnd}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <div className="flex-1 text-center">
            <Input
              type="number"
              inputMode="decimal"
              value={set.weight_kg || ''}
              onChange={(e) => onUpdate({ weight_kg: Number(e.target.value) || null })}
              className="h-12 text-center text-xl font-bold bg-transparent border-none focus-visible:ring-0"
            />
            <span className="text-[10px] text-muted-foreground -mt-1 block">kg</span>
          </div>
          <Button 
            variant="outline" size="icon" 
            className="h-12 w-12 shrink-0 rounded-xl text-lg"
            onClick={() => adjustWeight(2.5)}
            onMouseDown={() => handleLongPressStart(2.5)}
            onMouseUp={handleLongPressEnd}
            onMouseLeave={handleLongPressEnd}
            onTouchStart={() => handleLongPressStart(2.5)}
            onTouchEnd={handleLongPressEnd}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Reps stepper */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-12">Reps</span>
          <Button 
            variant="outline" size="icon" 
            className="h-12 w-12 shrink-0 rounded-xl text-lg"
            onClick={() => adjustReps(-1)}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <div className="flex-1 text-center">
            <Input
              type="number"
              inputMode="numeric"
              value={set.reps || ''}
              onChange={(e) => onUpdate({ reps: Number(e.target.value) || null })}
              className="h-12 text-center text-xl font-bold bg-transparent border-none focus-visible:ring-0"
            />
            <span className="text-[10px] text-muted-foreground -mt-1 block">reps</span>
          </div>
          <Button 
            variant="outline" size="icon" 
            className="h-12 w-12 shrink-0 rounded-xl text-lg"
            onClick={() => adjustReps(1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* RPE pills */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-12">RPE</span>
          <div className="flex gap-1.5 flex-1">
            {RPE_VALUES.map(v => (
              <button
                key={v}
                onClick={() => onUpdate({ rpe: set.rpe === v ? null : v })}
                className={cn(
                  'flex-1 h-9 rounded-lg text-sm font-medium transition-all',
                  set.rpe === v 
                    ? 'bg-info text-info-foreground shadow-sm' 
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* RIR pills */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-12">RIR</span>
          <div className="flex gap-1.5 flex-1">
            {RIR_VALUES.map(v => (
              <button
                key={v}
                onClick={() => onUpdate({ rir: set.rir === v ? null : v })}
                className={cn(
                  'flex-1 h-9 rounded-lg text-sm font-medium transition-all',
                  set.rir === v 
                    ? 'bg-info text-info-foreground shadow-sm' 
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Volume display */}
        {volume > 0 && (
          <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
            <span>Volume: {volume.toLocaleString()} kg</span>
            {isBetterThanPrevious && <span className="text-success font-medium">↑ Better than last</span>}
          </div>
        )}

        {/* LOG SET button */}
        {onLogSet && !isLogged && (
          <Button 
            onClick={handleLogSet}
            className="w-full h-14 text-base font-bold bg-info hover:bg-info/90 text-info-foreground rounded-xl"
          >
            LOG SET
          </Button>
        )}
      </div>
    </div>
  );
}
