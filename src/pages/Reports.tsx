import { useMemo, useRef } from 'react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { Download, Trophy, TrendingUp, Pill, Apple, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useBodyMetrics, useSupplements, useSupplementLogs } from '@/hooks/use-fitness-data';

export default function Reports() {
  const { user } = useAuth();
  const reportRef = useRef<HTMLDivElement>(null);

  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');
  const lastMonthStart = format(startOfMonth(subDays(startOfMonth(new Date()), 1)), 'yyyy-MM-dd');

  const { data: metrics = [] } = useBodyMetrics(60);
  const { data: supplements = [] } = useSupplements();

  // PRs this month
  const { data: monthlyPRs = [] } = useQuery({
    queryKey: ['monthly-prs', user?.id, monthStart],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('set_logs')
        .select(`
          weight_kg, reps, is_pr,
          exercise_log:exercise_logs!inner(
            exercise:exercise_library(name),
            workout_log:workout_logs!inner(workout_date, user_id)
          )
        `)
        .eq('is_pr', true)
        .gte('exercise_log.workout_log.workout_date', monthStart)
        .lte('exercise_log.workout_log.workout_date', monthEnd)
        .eq('exercise_log.workout_log.user_id', user.id);
      if (error) return [];
      return (data || []).map((s: any) => ({
        exercise: s.exercise_log?.exercise?.name || 'Unknown',
        weight: s.weight_kg,
        reps: s.reps,
      }));
    },
    enabled: !!user,
  });

  // Workout count this month
  const { data: workoutCount = 0 } = useQuery({
    queryKey: ['monthly-workouts', user?.id, monthStart],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from('workout_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('completed', true)
        .gte('workout_date', monthStart)
        .lte('workout_date', monthEnd);
      if (error) return 0;
      return count || 0;
    },
    enabled: !!user,
  });

  const latestWeight = metrics.find(m => m.weight_kg)?.weight_kg;
  const latestBF = metrics.find(m => m.body_fat_percent)?.body_fat_percent;
  const activeSupps = supplements.filter(s => s.is_active).length;

  const handleExport = async () => {
    if (!reportRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#0f0f14',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = `nas-fitness-report-${format(new Date(), 'yyyy-MM')}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch {
      // Fallback: just alert
      alert('Export failed. Try again.');
    }
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Monthly Report</h1>
          <p className="text-muted-foreground mt-1">{format(new Date(), 'MMMM yyyy')}</p>
        </div>
        <Button onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Export as Image
        </Button>
      </div>

      <div ref={reportRef} className="space-y-4 p-6 rounded-xl bg-card border">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">🏋️ Nas Fitness OS</h2>
          <p className="text-muted-foreground">{format(new Date(), 'MMMM yyyy')} Performance Report</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Workouts */}
          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="h-8 w-8 mx-auto text-primary mb-2" />
              <div className="text-3xl font-bold">{workoutCount}</div>
              <div className="text-sm text-muted-foreground">Workouts Completed</div>
            </CardContent>
          </Card>

          {/* Body */}
          <Card>
            <CardContent className="pt-6 text-center">
              <Scale className="h-8 w-8 mx-auto text-blue-400 mb-2" />
              <div className="text-3xl font-bold">{latestWeight || '—'} kg</div>
              <div className="text-sm text-muted-foreground">
                {latestBF ? `${latestBF}% BF` : 'Current Weight'}
              </div>
            </CardContent>
          </Card>

          {/* Supplements */}
          <Card>
            <CardContent className="pt-6 text-center">
              <Pill className="h-8 w-8 mx-auto text-purple-400 mb-2" />
              <div className="text-3xl font-bold">{activeSupps}</div>
              <div className="text-sm text-muted-foreground">Active Supplements</div>
            </CardContent>
          </Card>
        </div>

        {/* PRs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              Personal Records This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyPRs.length > 0 ? (
              <div className="space-y-2">
                {monthlyPRs.slice(0, 10).map((pr: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 bg-amber-500/5 rounded-lg">
                    <span className="font-medium">{pr.exercise}</span>
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                      {pr.weight}kg × {pr.reps}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No PRs logged this month yet</p>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-4 border-t">
          Generated by Nas Fitness OS • {format(new Date(), 'MMMM d, yyyy')}
        </div>
      </div>
    </div>
  );
}
