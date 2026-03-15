import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ExerciseLog } from '@/lib/types';

interface ExerciseJumpNavProps {
  exerciseLogs: ExerciseLog[];
  currentIndex: number;
  onJump: (index: number) => void;
}

export function ExerciseJumpNav({ exerciseLogs, currentIndex, onJump }: ExerciseJumpNavProps) {
  if (exerciseLogs.length <= 1) return null;

  return (
    <TooltipProvider>
      <div className="fixed right-2 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2">
        {exerciseLogs.map((el, i) => {
          const hasCompletedSets = el.set_logs?.some(s => s.weight_kg && s.reps);
          const isActive = i === currentIndex;

          return (
            <Tooltip key={el.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onJump(i)}
                  className={cn(
                    'w-3 h-3 rounded-full transition-all',
                    isActive
                      ? 'bg-info scale-125 shadow-sm shadow-info/50'
                      : hasCompletedSets
                      ? 'bg-success'
                      : 'bg-muted-foreground/30'
                  )}
                />
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs">
                {i + 1}. {el.exercise?.name || 'Exercise'}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
