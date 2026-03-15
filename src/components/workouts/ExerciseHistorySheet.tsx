import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ExerciseHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exerciseId: string | null;
  exerciseName: string;
}

export function ExerciseHistorySheet({ open, onOpenChange, exerciseId, exerciseName }: ExerciseHistorySheetProps) {
  const { user } = useAuth();

  const { data: sessions = [] } = useQuery({
    queryKey: ['exercise-history', user?.id, exerciseId],
    queryFn: async () => {
      if (!user || !exerciseId) return [];
      const { data, error } = await supabase
        .from('set_logs')
        .select(`
          weight_kg, reps, rpe, set_number,
          exercise_log:exercise_logs!inner(
            exercise_id,
            workout_log:workout_logs!inner(workout_date, user_id)
          )
        `)
        .eq('exercise_log.exercise_id', exerciseId)
        .eq('exercise_log.workout_log.user_id', user.id)
        .order('set_number', { ascending: true })
        .limit(50);

      if (error) throw error;

      // Group by workout_date
      const grouped: Record<string, { weight: number; reps: number; rpe?: number }[]> = {};
      for (const s of data || []) {
        const date = (s as any).exercise_log?.workout_log?.workout_date;
        if (!date) continue;
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push({
          weight: Number(s.weight_kg) || 0,
          reps: Number(s.reps) || 0,
          rpe: s.rpe || undefined,
        });
      }

      return Object.entries(grouped)
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 5)
        .map(([date, sets]) => ({ date, sets }));
    },
    enabled: !!user && !!exerciseId && open,
  });

  // Estimate 1RM from best set
  const best1RM = sessions.reduce((best, session) => {
    for (const s of session.sets) {
      const est = s.weight * (1 + s.reps / 30);
      if (est > best) return est;
    }
    return best;
  }, 0);

  // Volume trend
  const volumes = sessions.map(s => s.sets.reduce((sum, set) => sum + set.weight * set.reps, 0));
  const volumeTrend = volumes.length >= 2 ? (volumes[0] > volumes[1] ? 'up' : volumes[0] < volumes[1] ? 'down' : 'flat') : 'flat';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[45vh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="text-left">{exerciseName} History</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4 overflow-y-auto">
          {/* Summary row */}
          <div className="flex items-center gap-4 text-sm">
            {best1RM > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Est. 1RM:</span>
                <span className="font-bold text-foreground">{Math.round(best1RM)}kg</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Volume:</span>
              {volumeTrend === 'up' && <TrendingUp className="h-4 w-4 text-success" />}
              {volumeTrend === 'down' && <TrendingDown className="h-4 w-4 text-destructive" />}
              {volumeTrend === 'flat' && <Minus className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>

          {/* Session rows */}
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No previous sessions found</p>
          ) : (
            sessions.map((session) => (
              <div key={session.date} className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
                <p className="text-sm text-foreground">
                  {session.sets.map((s, i) => (
                    <span key={i}>
                      {i > 0 && ', '}
                      <span className="font-mono">{s.weight}×{s.reps}</span>
                      {s.rpe && <span className="text-muted-foreground"> RPE{s.rpe}</span>}
                    </span>
                  ))}
                </p>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
