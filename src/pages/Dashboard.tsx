import { useMemo } from 'react';
import { format, startOfWeek, endOfWeek, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dumbbell, Pill, PlayCircle, Scale, Flame, Zap, Droplets,
  Heart, Apple, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  useTodayWorkout, useWorkoutLogs, useMealLogs, 
  useSupplements, useSupplementLogs, useBodyMetrics, useProfile
} from '@/hooks/use-fitness-data';
import { WORKOUT_DAY_INFO, type WorkoutDayType } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  
  const { data: todayWorkout } = useTodayWorkout();
  const { data: weeklyWorkouts } = useWorkoutLogs(weekStart, weekEnd);
  const { data: todayMeals } = useMealLogs(today);
  const { data: supplements } = useSupplements();
  const { data: supplementLogs } = useSupplementLogs(today);
  const { data: bodyMetrics } = useBodyMetrics(30);
  const { data: profile } = useProfile();

  // Water today
  const { data: waterLogs = [] } = useQuery({
    queryKey: ['water-logs', user?.id, today],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('water_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('log_date', today);
      if (error) return [];
      return data || [];
    },
    enabled: !!user,
  });
  const waterMl = waterLogs.reduce((s: number, l: any) => s + (l.amount_ml || 0), 0);

  // Recovery score today
  const { data: todayRecovery } = useQuery({
    queryKey: ['recovery-today', user?.id, today],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('recovery_checkins')
        .select('recovery_score')
        .eq('user_id', user.id)
        .eq('checkin_date', today)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const isTrainingDay = todayWorkout?.template?.day_type !== 'rest';
  const targetCalories = isTrainingDay ? (profile?.training_day_calories || 2556) : (profile?.rest_day_calories || 2200);
  const targetProtein = isTrainingDay ? (profile?.training_day_protein || 246) : (profile?.rest_day_protein || 180);
  const waterTarget = profile?.water_target_ml || 4000;

  const nutritionStats = useMemo(() => {
    if (!todayMeals) return { calories: 0, protein: 0, carbs: 0, fats: 0 };
    return todayMeals.reduce((acc, meal) => {
      meal.meal_items?.forEach(item => {
        acc.calories += Number(item.calories) || 0;
        acc.protein += Number(item.protein) || 0;
        acc.carbs += Number(item.carbs) || 0;
        acc.fats += Number(item.fats) || 0;
      });
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
  }, [todayMeals]);

  const activeSupps = supplements?.filter(s => s.is_active) || [];
  const takenCount = supplementLogs?.filter(l => l.taken).length || 0;
  const workoutDone = todayWorkout?.completed || false;

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Recovery score color
  const recoveryScore = todayRecovery?.recovery_score || 0;
  const recoveryColor = recoveryScore >= 85 ? 'text-green-500' : recoveryScore >= 65 ? 'text-yellow-500' : recoveryScore >= 40 ? 'text-orange-500' : 'text-red-500';
  const recoveryBg = recoveryScore >= 85 ? 'bg-green-500/10' : recoveryScore >= 65 ? 'bg-yellow-500/10' : recoveryScore >= 40 ? 'bg-orange-500/10' : 'bg-red-500/10';

  // Progress ring helper
  const Ring = ({ value, max, size = 80, color, label }: { value: number; max: number; size?: number; color: string; label: string }) => {
    const sw = 6;
    const r = (size - sw) / 2;
    const c = r * 2 * Math.PI;
    const pct = Math.min(value / max, 1);
    const off = c - pct * c;
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={sw} />
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" className="transition-all duration-700" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold">{Math.round(pct * 100)}%</span>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-bold">{greeting}, {profile?.display_name || 'Nas'} 💪</h1>
        <p className="text-muted-foreground">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* 5 Progress Rings */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-around flex-wrap gap-4">
            <Ring value={nutritionStats.calories} max={targetCalories} color="#f97316" label="Calories" />
            <Ring value={nutritionStats.protein} max={targetProtein} color="#ef4444" label="Protein" />
            <Ring value={waterMl} max={waterTarget} color="#3b82f6" label="Water" />
            <Ring value={takenCount} max={activeSupps.length || 1} color="#a855f7" label="Supps" />
            <Ring value={workoutDone ? 1 : 0} max={1} color="#22c55e" label="Workout" />
          </div>
        </CardContent>
      </Card>

      {/* Recovery Score + Today's Workout */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Recovery */}
        <Card className={recoveryBg}>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card">
              <Heart className={`h-8 w-8 ${recoveryColor}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Recovery Score</p>
              <p className={`text-3xl font-bold ${recoveryColor}`}>
                {todayRecovery ? recoveryScore : '—'}
              </p>
              <p className="text-xs text-muted-foreground">
                {!todayRecovery ? 'No check-in today' : 
                  recoveryScore >= 85 ? 'Push Hard 🔥' : 
                  recoveryScore >= 65 ? 'Normal Session' : 
                  recoveryScore >= 40 ? 'Reduce Volume 20%' : 'Active Recovery Only'}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigate('/recovery')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Today's Workout */}
        <Card className="border-primary/20">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Dumbbell className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Today's Workout</p>
              {todayWorkout?.template ? (
                <>
                  <p className="text-lg font-bold">
                    {WORKOUT_DAY_INFO[todayWorkout.template.day_type as WorkoutDayType]?.label || 'Workout'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {todayWorkout.completed ? '✅ Completed' : `${todayWorkout.exercise_logs?.length || 0} exercises`}
                  </p>
                </>
              ) : (
                <p className="text-lg font-semibold text-muted-foreground">No workout planned</p>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigate('/workouts')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate('/nutrition')}>
          <Apple className="h-5 w-5 text-green-500" />
          <span className="text-xs">Log Meal</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate('/workouts')}>
          <PlayCircle className="h-5 w-5 text-primary" />
          <span className="text-xs">Start Workout</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate('/supplements')}>
          <Pill className="h-5 w-5 text-purple-400" />
          <span className="text-xs">Check Supps</span>
        </Button>
      </div>

      {/* Daily Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="h-3 w-3 text-orange-500" />
              <span className="text-xs font-medium">Calories</span>
            </div>
            <div className="text-xl font-bold">{Math.round(nutritionStats.calories)}</div>
            <Progress value={Math.min((nutritionStats.calories / targetCalories) * 100, 100)} className="h-1.5 mt-2" />
            <span className="text-[10px] text-muted-foreground">/ {targetCalories}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-3 w-3 text-red-500" />
              <span className="text-xs font-medium">Protein</span>
            </div>
            <div className="text-xl font-bold">{Math.round(nutritionStats.protein)}g</div>
            <Progress value={Math.min((nutritionStats.protein / targetProtein) * 100, 100)} className="h-1.5 mt-2" />
            <span className="text-[10px] text-muted-foreground">/ {targetProtein}g</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Droplets className="h-3 w-3 text-blue-500" />
              <span className="text-xs font-medium">Water</span>
            </div>
            <div className="text-xl font-bold">{(waterMl / 1000).toFixed(1)}L</div>
            <Progress value={Math.min((waterMl / waterTarget) * 100, 100)} className="h-1.5 mt-2" />
            <span className="text-[10px] text-muted-foreground">/ {waterTarget / 1000}L</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Pill className="h-3 w-3 text-purple-500" />
              <span className="text-xs font-medium">Supplements</span>
            </div>
            <div className="text-xl font-bold">{takenCount}/{activeSupps.length}</div>
            <Progress value={activeSupps.length > 0 ? (takenCount / activeSupps.length) * 100 : 0} className="h-1.5 mt-2" />
            <span className="text-[10px] text-muted-foreground">taken today</span>
          </CardContent>
        </Card>
      </div>

      {/* Weight + Weekly Training */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Latest Weight
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bodyMetrics?.[0]?.weight_kg ? (
              <div>
                <span className="text-3xl font-bold">{bodyMetrics[0].weight_kg} kg</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {format(new Date(bodyMetrics[0].recorded_date), 'MMM d, yyyy')}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">No weight data yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Dumbbell className="h-4 w-4" />
              Weekly Training
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {weeklyWorkouts?.filter(w => w.completed).length || 0}/5
            </div>
            <Progress 
              value={((weeklyWorkouts?.filter(w => w.completed).length || 0) / 5) * 100} 
              className="h-2 mt-2" 
            />
            <p className="text-sm text-muted-foreground mt-1">workouts this week</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
