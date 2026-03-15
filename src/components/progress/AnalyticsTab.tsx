import { useMemo } from 'react';
import { format, subWeeks, startOfWeek, endOfWeek, eachWeekOfInterval, subDays, eachDayOfInterval } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { BarChart3, TrendingUp, CalendarDays } from 'lucide-react';

// Muscle group name mapping from exercise primary_muscle field
const MUSCLE_GROUP_CATEGORIES: Record<string, string> = {
  chest: 'Chest', back: 'Back', shoulders: 'Shoulders',
  biceps: 'Arms', triceps: 'Arms', forearms: 'Arms',
  quadriceps: 'Legs', hamstrings: 'Legs', glutes: 'Legs', calves: 'Legs',
  core: 'Core', traps: 'Back',
};

const MUSCLE_COLORS: Record<string, string> = {
  Chest: '#ef4444', Back: '#3b82f6', Legs: '#22c55e',
  Shoulders: '#a855f7', Arms: '#f59e0b', Core: '#ec4899',
};

export function AnalyticsTab() {
  const { user } = useAuth();
  const twelveWeeksAgo = format(subWeeks(new Date(), 12), 'yyyy-MM-dd');

  const { data: workoutData = [] } = useQuery({
    queryKey: ['analytics-workouts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('workout_logs')
        .select(`
          workout_date,
          exercise_logs(
            exercise:exercise_library(name, primary_muscle),
            set_logs(weight_kg, reps, set_number)
          )
        `)
        .eq('user_id', user.id)
        .eq('completed', true)
        .gte('workout_date', twelveWeeksAgo)
        .order('workout_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Muscle group names lookup
  const { data: muscleGroups = [] } = useQuery({
    queryKey: ['muscle-groups-lookup'],
    queryFn: async () => {
      const { data } = await supabase.from('muscle_groups').select('id, name');
      return data || [];
    },
  });

  const muscleIdToName = useMemo(() => {
    const map: Record<string, string> = {};
    muscleGroups.forEach((mg: any) => { map[mg.id] = mg.name; });
    return map;
  }, [muscleGroups]);

  // Weekly Volume Chart Data (last 8 weeks)
  const weeklyVolumeData = useMemo(() => {
    const eightWeeksAgo = subWeeks(new Date(), 8);
    const weeks = eachWeekOfInterval({ start: eightWeeksAgo, end: new Date() }, { weekStartsOn: 1 });

    return weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekLabel = format(weekStart, 'MMM d');
      const volumes: Record<string, number> = { Chest: 0, Back: 0, Legs: 0, Shoulders: 0, Arms: 0, Core: 0 };

      workoutData.forEach((w: any) => {
        const wd = new Date(w.workout_date);
        if (wd >= weekStart && wd <= weekEnd) {
          w.exercise_logs?.forEach((el: any) => {
            const muscleName = muscleIdToName[el.exercise?.primary_muscle] || '';
            const category = MUSCLE_GROUP_CATEGORIES[muscleName.toLowerCase()] || 'Core';
            el.set_logs?.forEach((s: any) => {
              if (s.weight_kg && s.reps) {
                volumes[category] += s.weight_kg * s.reps;
              }
            });
          });
        }
      });

      return { week: weekLabel, ...volumes };
    });
  }, [workoutData, muscleIdToName]);

  // Strength Progress (1RM over time for top 5 exercises)
  const strengthData = useMemo(() => {
    const exerciseMap: Record<string, { name: string; entries: { date: string; e1rm: number }[] }> = {};

    workoutData.forEach((w: any) => {
      w.exercise_logs?.forEach((el: any) => {
        const name = el.exercise?.name;
        if (!name) return;
        if (!exerciseMap[name]) exerciseMap[name] = { name, entries: [] };
        let bestE1RM = 0;
        el.set_logs?.forEach((s: any) => {
          if (s.weight_kg && s.reps && s.reps > 0) {
            const e1rm = s.weight_kg * (1 + s.reps / 30);
            if (e1rm > bestE1RM) bestE1RM = e1rm;
          }
        });
        if (bestE1RM > 0) {
          exerciseMap[name].entries.push({ date: w.workout_date, e1rm: Math.round(bestE1RM * 10) / 10 });
        }
      });
    });

    // Top 5 by frequency
    const sorted = Object.values(exerciseMap).sort((a, b) => b.entries.length - a.entries.length).slice(0, 5);

    // Build chart data: merge all dates
    const allDates = [...new Set(sorted.flatMap(e => e.entries.map(en => en.date)))].sort();
    return {
      exercises: sorted.map(e => e.name),
      data: allDates.map(date => {
        const point: any = { date: format(new Date(date), 'MMM d') };
        sorted.forEach(e => {
          const entry = e.entries.find(en => en.date === date);
          if (entry) point[e.name] = entry.e1rm;
        });
        return point;
      }),
    };
  }, [workoutData]);

  // Training frequency heatmap (52 weeks)
  const heatmapData = useMemo(() => {
    const yearAgo = subDays(new Date(), 364);
    const days = eachDayOfInterval({ start: yearAgo, end: new Date() });

    const setCountByDate: Record<string, number> = {};
    workoutData.forEach((w: any) => {
      let sets = 0;
      w.exercise_logs?.forEach((el: any) => { sets += el.set_logs?.length || 0; });
      if (sets > 0) setCountByDate[w.workout_date] = (setCountByDate[w.workout_date] || 0) + sets;
    });

    return days.map(d => ({
      date: format(d, 'yyyy-MM-dd'),
      dayOfWeek: d.getDay(),
      week: Math.floor((d.getTime() - yearAgo.getTime()) / (7 * 24 * 60 * 60 * 1000)),
      sets: setCountByDate[format(d, 'yyyy-MM-dd')] || 0,
    }));
  }, [workoutData]);

  const LINE_COLORS = ['hsl(var(--primary))', '#ef4444', '#22c55e', '#f59e0b', '#a855f7'];

  return (
    <div className="space-y-6">
      {/* Weekly Training Volume */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> Weekly Training Volume
          </CardTitle>
        </CardHeader>
        <CardContent>
          {weeklyVolumeData.some(w => Object.values(w).some(v => typeof v === 'number' && v > 0)) ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyVolumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  formatter={(v: number) => [`${Math.round(v).toLocaleString()} kg`, undefined]}
                />
                <Legend />
                {Object.entries(MUSCLE_COLORS).map(([muscle, color]) => (
                  <Bar key={muscle} dataKey={muscle} stackId="volume" fill={color} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              Complete workouts to see volume data
            </div>
          )}
        </CardContent>
      </Card>

      {/* Strength Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Estimated 1RM Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          {strengthData.data.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={strengthData.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                />
                <Legend />
                {strengthData.exercises.map((name, i) => (
                  <Line key={name} type="monotone" dataKey={name} stroke={LINE_COLORS[i]} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              Complete workouts to see strength trends
            </div>
          )}
        </CardContent>
      </Card>

      {/* Training Frequency Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" /> Training Frequency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="flex gap-[2px] min-w-[700px]">
              {Array.from({ length: 53 }, (_, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-[2px]">
                  {Array.from({ length: 7 }, (_, dayIdx) => {
                    const cell = heatmapData.find(d => d.week === weekIdx && d.dayOfWeek === dayIdx);
                    const sets = cell?.sets || 0;
                    const intensity = sets === 0 ? 0 : sets < 10 ? 1 : sets < 25 ? 2 : sets < 40 ? 3 : 4;
                    const colors = ['hsl(var(--muted))', 'hsl(142, 40%, 30%)', 'hsl(142, 50%, 40%)', 'hsl(142, 60%, 45%)', 'hsl(142, 70%, 50%)'];
                    return (
                      <div
                        key={dayIdx}
                        className="w-[11px] h-[11px] rounded-[2px]"
                        style={{ backgroundColor: colors[intensity] }}
                        title={cell ? `${cell.date}: ${sets} sets` : ''}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
              <span>Less</span>
              {['hsl(var(--muted))', 'hsl(142, 40%, 30%)', 'hsl(142, 50%, 40%)', 'hsl(142, 60%, 45%)', 'hsl(142, 70%, 50%)'].map((c, i) => (
                <div key={i} className="w-[11px] h-[11px] rounded-[2px]" style={{ backgroundColor: c }} />
              ))}
              <span>More</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}