import { useState, useMemo } from 'react';
import { format, differenceInWeeks, addWeeks } from 'date-fns';
import { Calendar, Target, AlertTriangle, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const PHASES = [
  { key: 'hypertrophy', label: 'Hypertrophy', weeks: [1, 6], sets: '3-4', reps: '8-12', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', desc: 'Build muscle mass with moderate weight and higher reps' },
  { key: 'strength', label: 'Strength', weeks: [7, 10], sets: '4-5', reps: '3-6', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', desc: 'Increase max strength with heavier loads' },
  { key: 'deload', label: 'Deload', weeks: [11, 11], sets: '2-3', reps: '8-12', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', desc: '60% load, half volume. Let your body recover.' },
  { key: 'test', label: '1RM Testing', weeks: [12, 12], sets: '1-3', reps: '1-3', color: 'bg-red-500/20 text-red-400 border-red-500/30', desc: 'Test your new maxes!' },
];

function getPhaseForWeek(week: number) {
  if (week <= 6) return PHASES[0];
  if (week <= 10) return PHASES[1];
  if (week === 11) return PHASES[2];
  return PHASES[3];
}

export default function Periodization() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [startDateInput, setStartDateInput] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: plan } = useQuery({
    queryKey: ['periodization-plan', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('periodization_plans')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Check average RPE from last 2 weeks
  const { data: recentRPE } = useQuery({
    queryKey: ['recent-rpe', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const twoWeeksAgo = format(addWeeks(new Date(), -2), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('set_logs')
        .select('rpe, exercise_log:exercise_logs!inner(workout_log:workout_logs!inner(workout_date, user_id))')
        .not('rpe', 'is', null)
        .gte('exercise_log.workout_log.workout_date', twoWeeksAgo)
        .eq('exercise_log.workout_log.user_id', user.id);
      if (error) return null;
      if (!data || data.length === 0) return null;
      const avg = data.reduce((sum: number, s: any) => sum + (s.rpe || 0), 0) / data.length;
      return Math.round(avg * 10) / 10;
    },
    enabled: !!user,
  });

  const currentWeek = useMemo(() => {
    if (!plan) return 1;
    const weeks = differenceInWeeks(new Date(), new Date(plan.start_date)) + 1;
    return Math.max(1, Math.min(12, weeks));
  }, [plan]);

  const currentPhase = getPhaseForWeek(currentWeek);
  const progressPercent = (currentWeek / 12) * 100;
  const shouldDeload = recentRPE !== null && recentRPE > 8;

  const createPlan = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('periodization_plans')
        .upsert({
          user_id: user.id,
          start_date: startDateInput,
          current_week: 1,
          phase: 'hypertrophy',
          name: 'Current Mesocycle',
        }, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periodization-plan'] });
      toast({ title: 'Mesocycle started! 🏋️' });
    },
  });

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Periodization</h1>
        <p className="text-muted-foreground mt-1">12-week mesocycle planner</p>
      </div>

      {/* Deload Warning */}
      {shouldDeload && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <div>
              <p className="font-medium text-amber-400">Deload Suggested</p>
              <p className="text-sm text-muted-foreground">
                Your average RPE over the last 2 weeks is {recentRPE}. Consider taking a deload week.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!plan ? (
        <Card>
          <CardHeader>
            <CardTitle>Start Your Mesocycle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDateInput}
                onChange={(e) => setStartDateInput(e.target.value)}
              />
            </div>
            <Button onClick={() => createPlan.mutate()} disabled={createPlan.isPending}>
              <Calendar className="h-4 w-4 mr-2" />
              Start 12-Week Cycle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Current Phase */}
          <Card className="border-primary/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Badge className={currentPhase.color}>{currentPhase.label}</Badge>
                  <div className="text-2xl font-bold mt-2">Week {currentWeek} of 12</div>
                  <p className="text-sm text-muted-foreground">{currentPhase.desc}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Sets × Reps</div>
                  <div className="text-lg font-bold">{currentPhase.sets} × {currentPhase.reps}</div>
                </div>
              </div>
              <Progress value={progressPercent} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Started {format(new Date(plan.start_date), 'MMM d')}</span>
                <span>Ends {format(addWeeks(new Date(plan.start_date), 12), 'MMM d')}</span>
              </div>
            </CardContent>
          </Card>

          {/* All Phases */}
          <div className="grid md:grid-cols-2 gap-4">
            {PHASES.map((phase) => {
              const isActive = phase.key === currentPhase.key;
              const isPast = currentWeek > phase.weeks[1];
              return (
                <Card key={phase.key} className={isActive ? 'border-primary/50 ring-1 ring-primary/20' : isPast ? 'opacity-60' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={phase.color}>{phase.label}</Badge>
                      <span className="text-sm text-muted-foreground">
                        Weeks {phase.weeks[0]}-{phase.weeks[1]}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{phase.desc}</p>
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <span><strong>{phase.sets}</strong> sets</span>
                      <span><strong>{phase.reps}</strong> reps</span>
                    </div>
                    {isActive && (
                      <Badge variant="outline" className="mt-3 text-primary border-primary/30">
                        ← Current Phase
                      </Badge>
                    )}
                    {isPast && (
                      <Badge variant="outline" className="mt-3">✓ Completed</Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Reset */}
          <div className="text-center">
            <Button variant="outline" onClick={() => createPlan.mutate()}>
              Reset Mesocycle
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
