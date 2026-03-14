import { useState, useMemo } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dumbbell, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Check,
  PlayCircle,
  Settings
} from 'lucide-react';
import { PlateCalculator } from '@/components/workouts/PlateCalculator';
import { 
  useWorkoutTemplates, 
  useWorkoutLogs,
  useTodayWorkout,
  useCreateWorkoutLog,
  useTemplateExercises,
  useCreateExerciseLog,
  useCreateSetLog,
  useUpdateSetLog,
  useDeleteSetLog,
  useDeleteExerciseLog,
  useUpdateWorkoutLog
} from '@/hooks/use-fitness-data';
import { WORKOUT_DAY_INFO, type WorkoutDayType, type SetLog } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { WorkoutMusclePreview } from '@/components/workouts/WorkoutMusclePreview';
import { EnhancedExerciseCard } from '@/components/workouts/EnhancedExerciseCard';
import { WorkoutTemplateSetup } from '@/components/workouts/WorkoutTemplateSetup';

export default function Workouts() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showTemplateSetup, setShowTemplateSetup] = useState(false);
  
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
  const deleteSetLog = useDeleteSetLog();
  const deleteExerciseLog = useDeleteExerciseLog();
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

  const handleAddSet = async (data: Omit<SetLog, 'id' | 'created_at'>) => {
    await createSetLog.mutateAsync(data);
    refetchTodayWorkout();
  };

  const handleUpdateSet = async (setId: string, updates: Partial<SetLog>) => {
    await updateSetLog.mutateAsync({ id: setId, ...updates });
    refetchTodayWorkout();
  };

  const handleDeleteSet = async (setId: string) => {
    await deleteSetLog.mutateAsync(setId);
    refetchTodayWorkout();
  };

  const handleDeleteExercise = async (exerciseLogId: string) => {
    await deleteExerciseLog.mutateAsync(exerciseLogId);
    refetchTodayWorkout();
    toast({ title: 'Exercise removed' });
  };

  const hasTemplates = templates && templates.length > 0;

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
        <div className="flex items-center gap-2">
          <PlateCalculator />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowTemplateSetup(true)}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            {hasTemplates ? 'Edit Split' : 'Set Up Split'}
          </Button>
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
                  <Check className="h-3 w-3 mt-1 text-green-500" />
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
          <CardContent className="py-8">
            {todayTemplate ? (
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Muscle Preview */}
                <WorkoutMusclePreview 
                  dayType={todayTemplate.day_type}
                  className="shrink-0"
                />
                
                {/* Start Workout CTA */}
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-xl font-semibold mb-2">
                    {WORKOUT_DAY_INFO[todayTemplate.day_type].label}
                  </h2>
                  <p className="text-muted-foreground mb-4">
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
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6">
                <Dumbbell className="h-12 w-12 text-primary mb-4" />
                <h2 className="text-xl font-semibold mb-2">No workout planned</h2>
                <p className="text-muted-foreground mb-4">
                  Set up your workout split to get started
                </p>
                <Button onClick={() => setShowTemplateSetup(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Set Up Split
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Workout Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Badge className={WORKOUT_DAY_INFO[currentWorkout.template?.day_type as WorkoutDayType || 'rest'].color}>
                {currentWorkout.template?.name || 'Custom Workout'}
              </Badge>
              {currentWorkout.completed && (
                <Badge variant="outline" className="text-green-500 border-green-500/50">
                  <Check className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Muscle preview for active workout */}
              {currentWorkout.template?.day_type && currentWorkout.template.day_type !== 'rest' && (
                <WorkoutMusclePreview 
                  dayType={currentWorkout.template.day_type}
                  className="hidden lg:block"
                />
              )}
              
              {!currentWorkout.completed && (
                <Button onClick={handleCompleteWorkout} className="gap-2">
                  <Check className="h-4 w-4" />
                  Complete Workout
                </Button>
              )}
            </div>
          </div>

          {/* Exercise List */}
          <div className="space-y-4">
            {currentWorkout.exercise_logs?.map((exerciseLog, idx) => (
              <EnhancedExerciseCard 
                key={exerciseLog.id} 
                exerciseLog={exerciseLog}
                exerciseNumber={idx + 1}
                templateExercise={templateExercises?.find(te => te.exercise_id === exerciseLog.exercise_id)}
                previousSets={[]} // Will be enhanced with usePreviousExerciseSets per exercise
                onAddSet={handleAddSet}
                onUpdateSet={handleUpdateSet}
                onDeleteSet={handleDeleteSet}
                onDeleteExercise={handleDeleteExercise}
              />
            ))}
          </div>
        </div>
      )}

      {/* Template Setup Dialog */}
      <WorkoutTemplateSetup 
        open={showTemplateSetup} 
        onOpenChange={setShowTemplateSetup} 
      />
    </div>
  );
}
