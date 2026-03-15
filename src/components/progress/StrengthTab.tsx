import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useProfile } from '@/hooks/use-fitness-data';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { format, subWeeks } from 'date-fns';

const COMPOUND_LIFTS = [
  { name: 'Bench Press', key: 'bench', standards: [0.5, 0.75, 1.0, 1.25, 1.5], type: 'weight' },
  { name: 'Back Squat', key: 'squat', standards: [0.75, 1.0, 1.25, 1.5, 2.0], type: 'weight', aliases: ['Squat'] },
  { name: 'Deadlift', key: 'deadlift', standards: [1.0, 1.25, 1.5, 2.0, 2.5], type: 'weight' },
  { name: 'Overhead Press', key: 'ohp', standards: [0.35, 0.5, 0.65, 0.8, 1.0], type: 'weight', aliases: ['OHP', 'Military Press'] },
  { name: 'Barbell Row', key: 'row', standards: [0.35, 0.5, 0.65, 0.8, 1.0], type: 'weight', aliases: ['Bent Over Row'] },
  { name: 'Pull-up', key: 'pullup', standards: [5, 8, 12, 15, 20], type: 'reps', aliases: ['Pull Up', 'Chin-up', 'Chin Up'] },
];

const LEVELS = ['Beginner', 'Novice', 'Intermediate', 'Advanced', 'Elite'];
const LEVEL_COLORS = ['text-muted-foreground', 'text-blue-400', 'text-green-400', 'text-amber-400', 'text-red-400'];

export function StrengthTab() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const bodyweight = 95; // Nas's bodyweight

  // Fetch all PR history
  const { data: allSets = [] } = useQuery({
    queryKey: ['all-set-logs-for-strength', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('set_logs')
        .select(`
          weight_kg, reps, created_at,
          exercise_log:exercise_logs!inner(
            exercise:exercise_library!inner(name)
          )
        `)
        .order('created_at', { ascending: true });
      if (error) return [];
      return data || [];
    },
    enabled: !!user,
  });

  const liftData = useMemo(() => {
    return COMPOUND_LIFTS.map(lift => {
      const names = [lift.name, ...(lift.aliases || [])].map(n => n.toLowerCase());
      const sets = allSets.filter((s: any) => {
        const exName = s.exercise_log?.exercise?.name?.toLowerCase() || '';
        return names.some(n => exName.includes(n));
      });

      if (lift.type === 'reps') {
        // Pull-up: use max reps
        const maxReps = sets.reduce((max: number, s: any) => Math.max(max, s.reps || 0), 0);
        const level = lift.standards.findIndex((std, i) => {
          if (i === lift.standards.length - 1) return maxReps >= std;
          return maxReps < lift.standards[i + 1];
        });
        const currentLevel = Math.max(0, level);
        const nextStd = currentLevel < 4 ? lift.standards[currentLevel + 1] : null;

        // Trend data (weekly best reps)
        const weeklyBest: { week: string; value: number }[] = [];
        for (let i = 11; i >= 0; i--) {
          const weekEnd = subWeeks(new Date(), i);
          const weekStart = subWeeks(new Date(), i + 1);
          const weekSets = sets.filter((s: any) => {
            const d = new Date(s.created_at);
            return d >= weekStart && d < weekEnd;
          });
          const best = weekSets.reduce((max: number, s: any) => Math.max(max, s.reps || 0), 0);
          if (best > 0) weeklyBest.push({ week: format(weekEnd, 'MMM d'), value: best });
        }

        return {
          ...lift, e1rm: maxReps, level: currentLevel, levelName: LEVELS[currentLevel],
          nextStd, needed: nextStd ? nextStd - maxReps : null, unit: 'reps',
          normalized: Math.min(maxReps / (lift.standards[4] || 20), 1) * 100,
          trendData: weeklyBest,
        };
      }

      // Weight-based lift: Epley e1RM
      let bestE1RM = 0;
      sets.forEach((s: any) => {
        if (s.weight_kg && s.reps && s.reps > 0) {
          const e1rm = s.weight_kg * (1 + s.reps / 30);
          if (e1rm > bestE1RM) bestE1RM = e1rm;
        }
      });

      const ratio = bestE1RM / bodyweight;
      const level = lift.standards.findIndex((std, i) => {
        if (i === lift.standards.length - 1) return ratio >= std;
        return ratio < lift.standards[i + 1];
      });
      const currentLevel = ratio < lift.standards[0] ? 0 : Math.max(0, level);
      const nextStd = currentLevel < 4 ? lift.standards[currentLevel + 1] : null;
      const nextKg = nextStd ? Math.round(nextStd * bodyweight) : null;

      // Weekly trend
      const weeklyBest: { week: string; value: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const weekEnd = subWeeks(new Date(), i);
        const weekStart = subWeeks(new Date(), i + 1);
        const weekSets = sets.filter((s: any) => {
          const d = new Date(s.created_at);
          return d >= weekStart && d < weekEnd;
        });
        let best = 0;
        weekSets.forEach((s: any) => {
          if (s.weight_kg && s.reps) {
            const e1rm = s.weight_kg * (1 + s.reps / 30);
            if (e1rm > best) best = e1rm;
          }
        });
        if (best > 0) weeklyBest.push({ week: format(weekEnd, 'MMM d'), value: Math.round(best) });
      }

      return {
        ...lift, e1rm: Math.round(bestE1RM), level: currentLevel, levelName: LEVELS[currentLevel],
        nextStd: nextKg, needed: nextKg ? nextKg - Math.round(bestE1RM) : null, unit: 'kg',
        normalized: Math.min(ratio / lift.standards[4], 1) * 100,
        trendData: weeklyBest,
      };
    });
  }, [allSets, bodyweight]);

  // Radar chart data
  const radarData = liftData.map(l => ({
    lift: l.key.toUpperCase(),
    value: Math.round(l.normalized),
    fullMark: 100,
  }));

  return (
    <div className="space-y-6">
      {/* Radar chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Strength Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="lift" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Strength" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Per-lift cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {liftData.map(lift => (
          <Card key={lift.key}>
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{lift.name}</h3>
                <Badge className={`${LEVEL_COLORS[lift.level]} bg-transparent border`}>
                  {lift.levelName}
                </Badge>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{lift.e1rm || '—'}</span>
                <span className="text-sm text-muted-foreground">{lift.unit === 'reps' ? 'max reps' : 'kg e1RM'}</span>
              </div>

              {/* Progress to next level */}
              {lift.needed !== null && lift.needed > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>→ {LEVELS[lift.level + 1]}</span>
                    <span>{lift.needed} {lift.unit} to go</span>
                  </div>
                  <Progress value={Math.max(0, 100 - (lift.needed / (lift.nextStd || 1)) * 100)} className="h-2" />
                </div>
              )}

              {/* Mini trend */}
              {lift.trendData.length > 1 && (
                <div className="h-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lift.trendData}>
                      <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} />
                      <XAxis dataKey="week" hide />
                      <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
