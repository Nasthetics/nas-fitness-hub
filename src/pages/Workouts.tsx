import { useState, useMemo } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dumbbell, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Check,
  PlayCircle
} from 'lucide-react';
import { 
  useWorkoutTemplates, 
  useWorkoutLogs,
  useTodayWorkout,
  useCreateWorkoutLog,
  useTemplateExercises,
  useExerciseLibrary,
  useCreateExerciseLog,
  useCreateSetLog,
  useUpdateSetLog,
  useUpdateWorkoutLog
} from '@/hooks/use-fitness-data';
import { WORKOUT_DAY_INFO, type WorkoutDayType, type SetLog } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function Workouts() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  
  const { data: templates } = useWorkoutTemplates();
  const { data: todayWorkout, refetch: refetchTodayWorkout } = useTodayWorkout();
  const { data: workoutLogs } = useWorkoutLogs(
    format(weekStart, 'yyyy-MM-dd'),
    format(addDays(weekStart, 6), 'yyyy-MM-dd')
  );
  
  const createWorkoutLog = useCreateWorkoutLog();
  const createExerciseLog = useCreateExerciseLog();
  const createSetLog = useCreateSetLog();
  const updateSetLog = useUpdateSetLog();
  const updateWorkoutLog = useUpdateWorkoutLog();

  // Get today's day number (1-7, Monday-Sunday)
  const todayDayNumber = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();
  const todayTemplate = templates?.find(t => t.day_number === todayDayNumber);
  
  // Current active workout
  const currentWorkout = todayWorkout || workoutLogs?.find(w => w.workout_date === dateStr);
  
  const { data: templateExercises } = useTemplateExercises(
    currentWorkout?.template_id || todayTemplate?.id || null
  );

  // Week navigation
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      const dayNumber = i + 1;
      const template = templates?.find(t => t.day_number === dayNumber);
      const workout = workoutLogs?.find(w => w.workout_date === format(date, 'yyyy-MM-dd'));
      
      return {
        date,
        dayNumber,
        label: format(date, 'EEE'),
        dayOfMonth: format(date, 'd'),
        template,
        workout,
        isToday: format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'),
        isSelected: format(date, 'yyyy-MM-dd') === dateStr,
      };
    });
  }, [weekStart, templates, workoutLogs, dateStr]);

  const handleStartWorkout = async () => {
    if (!todayTemplate) {
      toast({
        title: 'No template for today',
        description: 'Set up your workout split first',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      const result = await createWorkoutLog.mutateAsync({
        template_id: todayTemplate.id,
        workout_date: dateStr,
      });
      
      // Create exercise logs from template
      if (templateExercises) {
        for (const te of templateExercises) {
          await createExerciseLog.mutateAsync({
            workout_log_id: result.id,
            exercise_id: te.exercise_id,
            exercise_order: te.exercise_order,
          });
        }
      }
      
      refetchTodayWorkout();
      toast({ title: 'Workout started!' });
    } catch (error) {
      toast({
        title: 'Error starting workout',
        description: (error as Error).message,
        variant: 'destructive'
      });
    }
  };

  const handleCompleteWorkout = async () => {
    if (!currentWorkout) return;
    
    try {
      await updateWorkoutLog.mutateAsync({
        id: currentWorkout.id,
        completed: true,
      });
      toast({ title: 'Workout completed! 💪' });
    } catch (error) {
      toast({
        title: 'Error completing workout',
        description: (error as Error).message,
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workouts</h1>
          <p className="text-muted-foreground">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
      </div>

      {/* Week Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setSelectedDate(addDays(weekStart, -7))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium">
              {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </span>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setSelectedDate(addDays(weekStart, 7))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => (
              <button
                key={day.dayNumber}
                onClick={() => setSelectedDate(day.date)}
                className={cn(
                  'flex flex-col items-center p-3 rounded-lg transition-all',
                  day.isSelected 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted',
                  day.isToday && !day.isSelected && 'ring-2 ring-primary'
                )}
              >
                <span className="text-xs font-medium">{day.label}</span>
                <span className="text-lg font-bold">{day.dayOfMonth}</span>
                {day.template && (
                  <span className={cn(
                    'text-[10px] mt-1 px-1 rounded',
                    day.isSelected 
                      ? 'bg-primary-foreground/20 text-primary-foreground' 
                      : WORKOUT_DAY_INFO[day.template.day_type as WorkoutDayType].color
                  )}>
                    {day.template.day_type === 'rest' ? 'Rest' : 
                      day.template.day_type.split('_').map(w => w[0].toUpperCase()).join('+')}
                  </span>
                )}
                {day.workout?.completed && (
                  <Check className="h-3 w-3 mt-1 text-success" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workout Content */}
      {todayTemplate?.day_type === 'rest' ? (
        <Card className="border-muted">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-4xl mb-4">😴</div>
            <h2 className="text-xl font-semibold mb-2">Rest Day</h2>
            <p className="text-muted-foreground text-center max-w-md">
              Recovery is just as important as training. Focus on sleep, nutrition, and light stretching.
            </p>
          </CardContent>
        </Card>
      ) : !currentWorkout ? (
        <Card className="border-primary/30 bg-gradient-to-br from-card to-primary/5">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Dumbbell className="h-12 w-12 text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {todayTemplate ? WORKOUT_DAY_INFO[todayTemplate.day_type].label : 'No workout planned'}
            </h2>
            {todayTemplate ? (
              <>
                <p className="text-muted-foreground mb-6">
                  {templateExercises?.length || 0} exercises ready to go
                </p>
                <Button 
                  size="lg" 
                  onClick={handleStartWorkout}
                  disabled={createWorkoutLog.isPending}
                  className="gap-2"
                >
                  <PlayCircle className="h-5 w-5" />
                  Start Workout
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground">
                Set up your workout templates in settings
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Workout Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className={WORKOUT_DAY_INFO[currentWorkout.template?.day_type as WorkoutDayType || 'rest'].color}>
                {currentWorkout.template?.name || 'Custom Workout'}
              </Badge>
              {currentWorkout.completed && (
                <Badge variant="outline" className="text-success border-success">
                  <Check className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              )}
            </div>
            {!currentWorkout.completed && (
              <Button onClick={handleCompleteWorkout} className="gap-2">
                <Check className="h-4 w-4" />
                Complete Workout
              </Button>
            )}
          </div>

          {/* Exercise List */}
          <div className="space-y-4">
            {currentWorkout.exercise_logs?.map((exerciseLog, idx) => (
              <ExerciseCard 
                key={exerciseLog.id} 
                exerciseLog={exerciseLog}
                exerciseNumber={idx + 1}
                templateExercise={templateExercises?.find(te => te.exercise_id === exerciseLog.exercise_id)}
                onAddSet={async (setData) => {
                  await createSetLog.mutateAsync(setData);
                  refetchTodayWorkout();
                }}
                onUpdateSet={async (setId, updates) => {
                  await updateSetLog.mutateAsync({ id: setId, ...updates });
                  refetchTodayWorkout();
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Exercise Card Component
function ExerciseCard({ 
  exerciseLog, 
  exerciseNumber,
  templateExercise,
  onAddSet,
  onUpdateSet
}: { 
  exerciseLog: any;
  exerciseNumber: number;
  templateExercise?: any;
  onAddSet: (data: Omit<SetLog, 'id' | 'created_at'>) => Promise<void>;
  onUpdateSet: (setId: string, updates: Partial<SetLog>) => Promise<void>;
}) {
  const exercise = exerciseLog.exercise;
  const sets = exerciseLog.set_logs || [];
  
  const handleAddSet = async () => {
    const lastSet = sets[sets.length - 1];
    await onAddSet({
      exercise_log_id: exerciseLog.id,
      set_number: sets.length + 1,
      reps: lastSet?.reps || templateExercise?.default_reps || 10,
      weight_kg: lastSet?.weight_kg || 0,
      rpe: null,
      rest_seconds: templateExercise?.default_rest_seconds || 90,
      notes: null,
      is_pr: false,
    });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
              {exerciseNumber}
            </span>
            {exercise?.name || 'Exercise'}
          </CardTitle>
          {exercise?.primary_muscle_name && (
            <Badge variant="outline" className="text-xs">
              {exercise.primary_muscle_name}
            </Badge>
          )}
        </div>
        {exercise?.coaching_cues && (
          <p className="text-xs text-muted-foreground mt-1">
            💡 {exercise.coaching_cues}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {/* Sets Table */}
        <div className="space-y-2">
          <div className="grid grid-cols-5 gap-2 text-xs font-medium text-muted-foreground px-2">
            <span>Set</span>
            <span>Weight</span>
            <span>Reps</span>
            <span>RPE</span>
            <span>Vol</span>
          </div>
          
          {sets.map((set: SetLog) => (
            <div 
              key={set.id} 
              className={cn(
                'grid grid-cols-5 gap-2 p-2 rounded-lg',
                set.is_pr ? 'bg-primary/10 border border-primary/30' : 'bg-muted/50'
              )}
            >
              <span className="flex items-center justify-center font-medium">
                {set.set_number}
              </span>
              <Input
                type="number"
                value={set.weight_kg || ''}
                onChange={(e) => onUpdateSet(set.id, { weight_kg: Number(e.target.value) })}
                className="h-8 text-center"
                placeholder="kg"
              />
              <Input
                type="number"
                value={set.reps || ''}
                onChange={(e) => onUpdateSet(set.id, { reps: Number(e.target.value) })}
                className="h-8 text-center"
                placeholder="reps"
              />
              <Input
                type="number"
                value={set.rpe || ''}
                onChange={(e) => onUpdateSet(set.id, { rpe: Number(e.target.value) })}
                className="h-8 text-center"
                placeholder="1-10"
                min={1}
                max={10}
              />
              <span className="flex items-center justify-center text-sm text-muted-foreground">
                {(set.weight_kg || 0) * (set.reps || 0)}
              </span>
            </div>
          ))}
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-2"
            onClick={handleAddSet}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Set
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
