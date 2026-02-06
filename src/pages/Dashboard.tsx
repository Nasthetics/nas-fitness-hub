import { useMemo } from 'react';
import { format, startOfWeek, endOfWeek, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dumbbell, 
  Apple, 
  Pill, 
  TrendingUp, 
  PlayCircle,
  Scale,
  Target,
  Flame,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  useTodayWorkout, 
  useWorkoutLogs, 
  useMealLogs, 
  useSupplements, 
  useSupplementLogs,
  useBodyMetrics,
  useProfile
} from '@/hooks/use-fitness-data';
import { WORKOUT_DAY_INFO } from '@/lib/types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
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

  // Calculate weekly workout stats
  const weeklyStats = useMemo(() => {
    if (!weeklyWorkouts) return { completed: 0, planned: 6, setsByMuscle: [] };
    
    const completed = weeklyWorkouts.filter(w => w.completed).length;
    
    // Count sets by muscle group
    const muscleSetCounts: Record<string, number> = {};
    weeklyWorkouts.forEach(workout => {
      workout.exercise_logs?.forEach(exerciseLog => {
        const muscleName = (exerciseLog.exercise as any)?.primary?.name || 'Other';
        const setCount = exerciseLog.set_logs?.length || 0;
        muscleSetCounts[muscleName] = (muscleSetCounts[muscleName] || 0) + setCount;
      });
    });
    
    const setsByMuscle = Object.entries(muscleSetCounts).map(([muscle, sets]) => ({
      muscle,
      sets,
    })).sort((a, b) => b.sets - a.sets);
    
    return { completed, planned: 6, setsByMuscle };
  }, [weeklyWorkouts]);

  // Calculate today's nutrition
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

  // Determine if today is training day
  const isTrainingDay = todayWorkout?.template?.day_type !== 'rest';
  const targetCalories = isTrainingDay 
    ? (profile?.training_day_calories || 2800) 
    : (profile?.rest_day_calories || 2200);
  const targetProtein = isTrainingDay 
    ? (profile?.training_day_protein || 200) 
    : (profile?.rest_day_protein || 180);

  // Supplements adherence
  const supplementStats = useMemo(() => {
    const activeSupplements = supplements?.filter(s => s.is_active) || [];
    const takenToday = supplementLogs?.filter(l => l.taken).length || 0;
    return { total: activeSupplements.length, taken: takenToday };
  }, [supplements, supplementLogs]);

  // Weight trend data
  const weightTrendData = useMemo(() => {
    if (!bodyMetrics) return [];
    return bodyMetrics
      .filter(m => m.weight_kg)
      .slice(0, 30)
      .reverse()
      .map(m => ({
        date: format(new Date(m.recorded_date), 'MMM d'),
        weight: Number(m.weight_kg),
      }));
  }, [bodyMetrics]);

  // Today's workout completion
  const workoutCompletion = useMemo(() => {
    if (!todayWorkout?.exercise_logs) return 0;
    const totalExercises = todayWorkout.exercise_logs.length;
    if (totalExercises === 0) return 0;
    const completedExercises = todayWorkout.exercise_logs.filter(
      el => el.set_logs && el.set_logs.length > 0
    ).length;
    return Math.round((completedExercises / totalExercises) * 100);
  }, [todayWorkout]);

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/workouts')} size="lg" className="gap-2">
            <PlayCircle className="h-4 w-4" />
            Start Workout
          </Button>
          <Button variant="outline" onClick={() => navigate('/nutrition')}>
            Log Meal
          </Button>
          <Button variant="outline" onClick={() => navigate('/progress')}>
            Record Weight
          </Button>
        </div>
      </div>

      {/* Today's Workout Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              Today's Workout
            </CardTitle>
            {todayWorkout?.template && (
              <Badge className={WORKOUT_DAY_INFO[todayWorkout.template.day_type].color}>
                {WORKOUT_DAY_INFO[todayWorkout.template.day_type].label}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {todayWorkout ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {todayWorkout.exercise_logs?.length || 0} exercises
                </span>
                <span className="text-lg font-semibold text-primary">
                  {workoutCompletion}% Complete
                </span>
              </div>
              <Progress value={workoutCompletion} className="h-3" />
              <Button 
                onClick={() => navigate('/workouts')} 
                variant="secondary" 
                className="w-full"
              >
                {workoutCompletion === 0 ? 'Start Workout' : 'Continue Workout'}
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">No workout planned for today</p>
              <Button onClick={() => navigate('/workouts')}>
                Create Workout
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Weekly Training */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Weekly Training
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {weeklyStats.completed}/{weeklyStats.planned}
            </div>
            <Progress 
              value={(weeklyStats.completed / weeklyStats.planned) * 100} 
              className="mt-2 h-2" 
            />
            <p className="text-xs text-muted-foreground mt-2">
              workouts completed this week
            </p>
          </CardContent>
        </Card>

        {/* Calories */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Flame className="h-4 w-4 text-warning" />
              Calories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(nutritionStats.calories)}
              <span className="text-sm font-normal text-muted-foreground">
                /{targetCalories}
              </span>
            </div>
            <Progress 
              value={Math.min((nutritionStats.calories / targetCalories) * 100, 100)} 
              className="mt-2 h-2" 
            />
            <p className="text-xs text-muted-foreground mt-2">
              {isTrainingDay ? 'Training day target' : 'Rest day target'}
            </p>
          </CardContent>
        </Card>

        {/* Protein */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-info" />
              Protein
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(nutritionStats.protein)}g
              <span className="text-sm font-normal text-muted-foreground">
                /{targetProtein}g
              </span>
            </div>
            <Progress 
              value={Math.min((nutritionStats.protein / targetProtein) * 100, 100)} 
              className="mt-2 h-2" 
            />
          </CardContent>
        </Card>

        {/* Supplements */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Pill className="h-4 w-4 text-purple-400" />
              Supplements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {supplementStats.taken}/{supplementStats.total}
            </div>
            <Progress 
              value={supplementStats.total > 0 
                ? (supplementStats.taken / supplementStats.total) * 100 
                : 0
              } 
              className="mt-2 h-2" 
            />
            <p className="text-xs text-muted-foreground mt-2">
              taken today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Sets by Muscle Group */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weekly Sets by Muscle Group</CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyStats.setsByMuscle.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyStats.setsByMuscle} layout="vertical">
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis 
                    type="category" 
                    dataKey="muscle" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    width={80}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="sets" 
                    fill="hsl(var(--primary))" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No workout data this week
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weight Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Weight Trend (30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weightTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={weightTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    domain={['dataMin - 1', 'dataMax + 1']}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
                <Scale className="h-8 w-8 mb-2" />
                <p>No weight data recorded</p>
                <Button 
                  variant="link" 
                  onClick={() => navigate('/progress')}
                  className="mt-2"
                >
                  Record your first weight
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
