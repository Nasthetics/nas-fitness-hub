import { Timer, Dumbbell, CheckSquare, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkoutStatsBarProps {
  totalVolume: number;
  setsDone: number;
  totalSets: number;
  elapsedSeconds: number;
  className?: string;
}

export function WorkoutStatsBar({ totalVolume, setsDone, totalSets, elapsedSeconds, className }: WorkoutStatsBarProps) {
  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const estCalories = Math.round(elapsedSeconds / 60 * 8); // ~8 cal/min estimate

  return (
    <div className={cn(
      'sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border py-2 px-4',
      className
    )}>
      <div className="flex items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-1.5">
          <Dumbbell className="h-3.5 w-3.5 text-info" />
          <span className="font-mono font-bold text-foreground">{totalVolume.toLocaleString()}<span className="text-muted-foreground font-normal">kg</span></span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckSquare className="h-3.5 w-3.5 text-success" />
          <span className="font-bold text-foreground">{setsDone}<span className="text-muted-foreground font-normal">/{totalSets}</span></span>
        </div>
        <div className="flex items-center gap-1.5">
          <Timer className="h-3.5 w-3.5 text-warning" />
          <span className="font-mono font-bold text-foreground">{mins}:{secs.toString().padStart(2, '0')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Flame className="h-3.5 w-3.5 text-destructive" />
          <span className="font-bold text-foreground">~{estCalories}<span className="text-muted-foreground font-normal">cal</span></span>
        </div>
      </div>
    </div>
  );
}
