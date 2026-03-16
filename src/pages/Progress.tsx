import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Plus, Scale, Ruler, Camera, TrendingUp, TrendingDown, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { BulkQualityCard } from '@/components/progress/BulkQualityCard';
import { AnalyticsTab } from '@/components/progress/AnalyticsTab';
import { StrengthTab } from '@/components/progress/StrengthTab';
import { useBodyMetrics, useCreateBodyMetric } from '@/hooks/use-fitness-data';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { cn } from '@/lib/utils';

function PRFeed() {
  const { user } = useAuth();
  const { data: prs = [] } = useQuery({
    queryKey: ['pr-history', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('pr_history')
        .select('*, exercise:exercise_library(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) return [];
      return data || [];
    },
    enabled: !!user,
  });

  if (prs.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="section-label">PR History</p>
      {prs.slice(0, 5).map((pr: any) => (
        <div key={pr.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-card border border-border text-sm">
          <div>
            <span className="font-bold text-foreground">{pr.exercise?.name || 'Exercise'}</span>
            <Badge variant="outline" className="ml-2 text-[10px]">{pr.pr_type.toUpperCase()}</Badge>
          </div>
          <span className="font-bold text-primary">{pr.weight_kg}kg × {pr.reps}</span>
        </div>
      ))}
    </div>
  );
}

export default function Progress() {
  const { user } = useAuth();
  const { data: metrics = [], isLoading } = useBodyMetrics(90);
  const createMetric = useCreateBodyMetric();
  
  const [newWeight, setNewWeight] = useState('');
  const [newBodyFat, setNewBodyFat] = useState('');
  const [newWaist, setNewWaist] = useState('');
  const [newChest, setNewChest] = useState('');
  const [newArms, setNewArms] = useState('');
  const [newLegs, setNewLegs] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newWhoopRecovery, setNewWhoopRecovery] = useState('');
  const [newWhoopSleep, setNewWhoopSleep] = useState('');
  const [isLogMetricsSheetOpen, setIsLogMetricsSheetOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [activeTab, setActiveTab] = useState<'body' | 'strength' | 'analytics'>('body');

  const latestMetric = metrics[0];
  const previousMetric = metrics[1];

  const weightTrend = useMemo(() => {
    if (!latestMetric?.weight_kg || !previousMetric?.weight_kg) return null;
    const diff = latestMetric.weight_kg - previousMetric.weight_kg;
    return { value: diff, direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'same' };
  }, [latestMetric, previousMetric]);

  // Workout frequency data for bar chart
  const { data: workoutFreq = [] } = useQuery({
    queryKey: ['workout-frequency', user?.id, timeRange],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('workout_logs')
        .select('workout_date')
        .eq('user_id', user.id)
        .eq('completed', true)
        .order('workout_date', { ascending: true })
        .limit(200);
      if (!data) return [];
      // Group by week
      const weekMap: Record<string, number> = {};
      data.forEach(w => {
        const weekKey = format(new Date(w.workout_date), 'MMM d');
        weekMap[weekKey] = (weekMap[weekKey] || 0) + 1;
      });
      return Object.entries(weekMap).slice(-8).map(([week, count]) => ({ week, count }));
    },
    enabled: !!user,
  });

  const weightChartData = useMemo(() => {
    return metrics.filter(m => m.weight_kg).map(m => ({
      date: format(new Date(m.recorded_date), 'MMM d'),
      weight: m.weight_kg,
    })).reverse();
  }, [metrics]);

  // Streak
  const { data: totalWorkouts = 0 } = useQuery({
    queryKey: ['total-workouts', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from('workout_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('completed', true);
      return count || 0;
    },
    enabled: !!user,
  });

  const totalVolume = useMemo(() => {
    // Approximation from recent workouts
    return metrics.length > 0 ? '—' : '—';
  }, [metrics]);

  const handleCreateMetric = async () => {
    await createMetric.mutateAsync({
      recorded_date: format(new Date(), 'yyyy-MM-dd'),
      weight_kg: newWeight ? parseFloat(newWeight) : null,
      body_fat_percent: newBodyFat ? parseFloat(newBodyFat) : null,
      waist_cm: newWaist ? parseFloat(newWaist) : null,
      chest_cm: newChest ? parseFloat(newChest) : null,
      arms_cm: newArms ? parseFloat(newArms) : null,
      legs_cm: newLegs ? parseFloat(newLegs) : null,
      inbody_score: null,
      whoop_recovery: newWhoopRecovery ? parseInt(newWhoopRecovery) : null,
      whoop_sleep_hours: newWhoopSleep ? parseFloat(newWhoopSleep) : null,
      notes: newNotes || null,
    });
    setNewWeight(''); setNewBodyFat(''); setNewWaist(''); setNewChest('');
    setNewArms(''); setNewLegs(''); setNewNotes('');
    setNewWhoopRecovery(''); setNewWhoopSleep('');
    setIsLogMetricsSheetOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Progress</h1>
        <Button size="sm" onClick={() => setIsLogMetricsSheetOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Log
        </Button>
      </div>

      {/* Top stat cards - horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        <div className="shrink-0 rounded-2xl bg-card border border-border p-4 min-w-[130px]">
          <p className="text-2xl font-bold text-foreground">{totalWorkouts}</p>
          <p className="text-xs text-muted-foreground">Total Workouts</p>
        </div>
        <div className="shrink-0 rounded-2xl bg-card border border-border p-4 min-w-[130px]">
          <p className="text-2xl font-bold text-foreground">
            {latestMetric?.weight_kg ? `${latestMetric.weight_kg}kg` : '—'}
          </p>
          <p className="text-xs text-muted-foreground">Weight</p>
          {weightTrend && (
            <p className={cn('text-xs font-medium mt-0.5', weightTrend.direction === 'up' ? 'text-destructive' : 'text-primary')}>
              {weightTrend.value > 0 ? '+' : ''}{weightTrend.value.toFixed(1)}kg
            </p>
          )}
        </div>
        <div className="shrink-0 rounded-2xl bg-card border border-border p-4 min-w-[130px]">
          <p className="text-2xl font-bold text-foreground">
            {latestMetric?.body_fat_percent ? `${latestMetric.body_fat_percent}%` : '—'}
          </p>
          <p className="text-xs text-muted-foreground">Body Fat</p>
        </div>
      </div>

      {/* Time range tabs */}
      <div className="flex gap-2">
        {(['week', 'month', 'year'] as const).map(range => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize',
              timeRange === range ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
            )}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Workout frequency bar chart */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <p className="text-sm font-bold text-foreground mb-3">Workout Frequency</p>
        {workoutFreq.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={workoutFreq}>
              <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
            No workout data yet
          </div>
        )}
      </div>

      {/* Content tabs */}
      <div className="flex gap-2">
        {(['body', 'strength', 'analytics'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize',
              activeTab === tab ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'body' && (
        <>
          {/* Weight chart */}
          <div className="rounded-2xl bg-card border border-border p-4">
            <p className="text-sm font-bold text-foreground mb-3">Weight Trend</p>
            {weightChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weightChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis domain={['dataMin - 2', 'dataMax + 2']} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No weight data</div>
            )}
          </div>

          {/* Body stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Waist', value: latestMetric?.waist_cm, unit: 'cm', icon: Ruler },
              { label: 'Arms', value: latestMetric?.arms_cm, unit: 'cm', icon: Ruler },
              { label: 'Chest', value: latestMetric?.chest_cm, unit: 'cm', icon: Ruler },
              { label: 'Legs', value: latestMetric?.legs_cm, unit: 'cm', icon: Ruler },
            ].map(stat => (
              <div key={stat.label} className="rounded-2xl bg-card border border-border p-4">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold text-foreground">{stat.value ? `${stat.value} ${stat.unit}` : '—'}</p>
              </div>
            ))}
          </div>

          <BulkQualityCard />
          <PRFeed />
        </>
      )}

      {activeTab === 'strength' && <StrengthTab />}
      {activeTab === 'analytics' && <AnalyticsTab />}

      {/* Log Metrics Sheet */}
      <Sheet open={isLogMetricsSheetOpen} onOpenChange={setIsLogMetricsSheetOpen}>
        <SheetContent side="bottom" className="h-[85vh] w-full max-w-[100vw] rounded-t-2xl px-4">
          <div className="flex h-full flex-col">
            <SheetHeader className="pb-2">
              <SheetTitle className="text-left">Log Body Metrics</SheetTitle>
            </SheetHeader>
            <div className="flex-1 space-y-4 overflow-y-auto py-2 pr-1">
              {[
                { label: 'Weight (kg)', value: newWeight, set: setNewWeight, placeholder: '85.5', step: '0.1' },
                { label: 'Body Fat %', value: newBodyFat, set: setNewBodyFat, placeholder: '15.0', step: '0.1' },
                { label: 'Waist (cm)', value: newWaist, set: setNewWaist, placeholder: '82', step: '0.5' },
                { label: 'Chest (cm)', value: newChest, set: setNewChest, placeholder: '105', step: '0.5' },
                { label: 'Arms (cm)', value: newArms, set: setNewArms, placeholder: '40', step: '0.5' },
                { label: 'Legs (cm)', value: newLegs, set: setNewLegs, placeholder: '62', step: '0.5' },
                { label: 'WHOOP Recovery %', value: newWhoopRecovery, set: setNewWhoopRecovery, placeholder: '85' },
                { label: 'WHOOP Sleep (hrs)', value: newWhoopSleep, set: setNewWhoopSleep, placeholder: '7.5', step: '0.1' },
              ].map(field => (
                <div key={field.label} className="space-y-1">
                  <Label className="text-xs">{field.label}</Label>
                  <Input type="number" step={field.step} placeholder={field.placeholder} value={field.value} onChange={(e) => field.set(e.target.value)} />
                </div>
              ))}
              <div className="space-y-1">
                <Label className="text-xs">Notes</Label>
                <Textarea placeholder="How do you feel?" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-border pt-4 pb-[env(safe-area-inset-bottom,16px)]">
              <Button variant="outline" onClick={() => setIsLogMetricsSheetOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateMetric}>Save</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
