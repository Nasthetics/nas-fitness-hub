import { useMemo } from 'react';
import { format, startOfWeek, endOfWeek, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dumbbell, Pill, Scale, Flame, Zap, Droplets,
  Heart, Apple, ChevronRight, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  useTodayWorkout, useWorkoutLogs, useMealLogs, useWorkoutTemplates,
  useSupplements, useSupplementLogs, useBodyMetrics, useProfile
} from '@/hooks/use-fitness-data';
import { WORKOUT_DAY_INFO, type WorkoutDayType } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { DeloadBanner } from '@/components/workouts/DeloadBanner';

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
  const { data: templates } = useWorkoutTemplates();

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

  // Workout streak
  const { data: allWorkouts = [] } = useQuery({
    queryKey: ['workout-streak', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('workout_logs')
        .select('workout_date')
        .eq('user_id', user.id)
        .eq('completed', true)
        .order('workout_date', { ascending: false })
        .limit(60);
      return data || [];
    },
    enabled: !!user,
  });

  const streak = useMemo(() => {
    if (allWorkouts.length === 0) return 0;
    let count = 0;
    let checkDate = new Date();
    // If no workout today, start from yesterday
    const todayHasWorkout = allWorkouts.some(w => w.workout_date === format(checkDate, 'yyyy-MM-dd'));
    if (!todayHasWorkout) checkDate = subDays(checkDate, 1);
    
    const dates = new Set(allWorkouts.map(w => w.workout_date));
    while (dates.has(format(checkDate, 'yyyy-MM-dd'))) {
      count++;
      checkDate = subDays(checkDate, 1);
    }
    return count;
  }, [allWorkouts]);

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

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const recoveryScore = todayRecovery?.recovery_score || 0;
  const recoveryColor = recoveryScore >= 85 ? 'text-green-500' : recoveryScore >= 65 ? 'text-yellow-500' : recoveryScore >= 40 ? 'text-orange-500' : 'text-red-500';
  const recoveryBg = recoveryScore >= 85 ? 'bg-green-500/10' : recoveryScore >= 65 ? 'bg-yellow-500/10' : recoveryScore >= 40 ? 'bg-orange-500/10' : 'bg-red-500/10';

  // Today's template (for daily brief)
  const todayDayNumber = new Date().getDay() === 0 ? 7 : new Date().getDay();
  const todayTemplate = templates?.find(t => t.day_number === todayDayNumber);
  const todayMuscles = todayTemplate ? WORKOUT_DAY_INFO[todayTemplate.day_type as WorkoutDayType]?.muscles || [] : [];

  // Nutrition remaining
  const caloriesRemaining = Math.max(0, targetCalories - Math.round(nutritionStats.calories));
  const calColor = caloriesRemaining > 500 ? 'text-green-400' : caloriesRemaining > 200 ? 'text-yellow-400' : 'text-red-400';

  // Next supplement due
  const nextSupplement = useMemo(() => {
    const untaken = activeSupps.filter(s => {
      const log = supplementLogs?.find(l => l.supplement_id === s.id);
      return !log?.taken;
    });
    return untaken[0] || null;
  }, [activeSupps, supplementLogs]);

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

      {/* Deload Banner */}
      <DeloadBanner />

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

      {/* Quick Actions - FIXED with labels and larger icons */}
      <div className="grid grid-cols-3 gap-3">
        <Button variant="outline" className="h-auto py-5 flex flex-col gap-2 border-blue-500/20 hover:bg-blue-500/5" onClick={() => navigate('/workouts')}>
          <Dumbbell className="h-8 w-8 text-blue-500" />
          <span className="text-xs font-medium">Log Workout</span>
        </Button>
        <Button variant="outline" className="h-auto py-5 flex flex-col gap-2 border-green-500/20 hover:bg-green-500/5" onClick={() => navigate('/nutrition')}>
          <Apple className="h-8 w-8 text-green-500" />
          <span className="text-xs font-medium">Add Meal</span>
        </Button>
        <Button variant="outline" className="h-auto py-5 flex flex-col gap-2 border-orange-500/20 hover:bg-orange-500/5" onClick={() => navigate('/progress')}>
          <Scale className="h-8 w-8 text-orange-500" />
          <span className="text-xs font-medium">Log Weight</span>
        </Button>
      </div>

      {/* Daily Brief — 2x2 grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Today's Workout Plan */}
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate('/workouts')}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium">Today's Plan</span>
            </div>
            {todayTemplate && todayTemplate.day_type !== 'rest' ? (
              <>
                <p className="text-sm font-bold">{WORKOUT_DAY_INFO[todayTemplate.day_type as WorkoutDayType]?.label}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {todayMuscles.slice(0, 3).map(m => (
                    <Badge key={m} variant="outline" className="text-[9px] px-1 py-0">{m}</Badge>
                  ))}
                </div>
              </>
            ) : todayTemplate?.day_type === 'rest' ? (
              <p className="text-sm text-muted-foreground">😴 Rest Day</p>
            ) : (
              <Button variant="link" className="p-0 h-auto text-xs text-primary" onClick={(e) => { e.stopPropagation(); navigate('/workouts'); }}>
                Set Up Routine →
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Supplement Alert */}
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate('/supplements')}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <Pill className="h-4 w-4 text-purple-500" />
              <span className="text-xs font-medium">Next Supplement</span>
            </div>
            {nextSupplement ? (
              <>
                <p className="text-sm font-bold">{nextSupplement.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {nextSupplement.timing?.map(t => t === 'AM' ? 'Morning' : t === 'PM' ? 'Evening' : t.replace('_', ' ')).join(', ') || 'Anytime'}
                </p>
              </>
            ) : (
              <p className="text-sm text-green-400">✅ All taken!</p>
            )}
          </CardContent>
        </Card>

        {/* Nutrition Status */}
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate('/nutrition')}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-xs font-medium">Calories Left</span>
            </div>
            <p className={`text-xl font-bold ${calColor}`}>{caloriesRemaining}</p>
            <p className="text-[10px] text-muted-foreground">kcal remaining</p>
          </CardContent>
        </Card>

        {/* Streak */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">🔥</span>
              <span className="text-xs font-medium">Streak</span>
            </div>
            {streak > 0 ? (
              <>
                <p className="text-xl font-bold">{streak}</p>
                <p className="text-[10px] text-muted-foreground">consecutive days</p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Start your streak today!</p>
            )}
          </CardContent>
        </Card>
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
              <Dumbbell className="h-3 w-3 text-primary" />
              <span className="text-xs font-medium">Weekly</span>
            </div>
            <div className="text-xl font-bold">
              {weeklyWorkouts?.filter(w => w.completed).length || 0}/5
            </div>
            <Progress 
              value={((weeklyWorkouts?.filter(w => w.completed).length || 0) / 5) * 100} 
              className="h-1.5 mt-2" 
            />
            <span className="text-[10px] text-muted-foreground">workouts</span>
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
