import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Dumbbell, Plus, ChevronLeft, ChevronRight, Check, PlayCircle, Settings,
  X, Pause, Play, AlertTriangle
} from 'lucide-react';
import { PlateCalculator } from '@/components/workouts/PlateCalculator';
import { RestTimer } from '@/components/workouts/RestTimer';
import { PRCelebration } from '@/components/workouts/PRCelebration';
import { WorkoutStatsBar } from '@/components/workouts/WorkoutStatsBar';
import { ExercisePicker } from '@/components/workouts/ExercisePicker';
import { 
  useWorkoutTemplates, useWorkoutLogs, useTodayWorkout, useCreateWorkoutLog,
  useTemplateExercises, useCreateExerciseLog, useCreateSetLog,
  useUpdateSetLog, useDeleteSetLog, useDeleteExerciseLog, useUpdateWorkoutLog
} from '@/hooks/use-fitness-data';
import { WORKOUT_DAY_INFO, type WorkoutDayType, type SetLog } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { WorkoutMusclePreview } from '@/components/workouts/WorkoutMusclePreview';
import { EnhancedExerciseCard } from '@/components/workouts/EnhancedExerciseCard';
import { WorkoutTemplateSetup } from '@/components/workouts/WorkoutTemplateSetup';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkoutMode } from '@/components/layout/AppLayout';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Workouts() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isWorkoutMode, setIsWorkoutMode } = useWorkoutMode();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showTemplateSetup, setShowTemplateSetup] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [restTimerSeconds, setRestTimerSeconds] = useState(90);
  const [isPaused, setIsPaused] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null);
  const [favouriteExerciseIds, setFavouriteExerciseIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('fav-exercises') || '[]'); } catch { return []; }
  });
  const [prCelebration, setPrCelebration] = useState<{ show: boolean; exerciseName: string; oldRecord: string; newRecord: string }>({
    show: false, exerciseName: '', oldRecord: '', newRecord: ''
  });
  const inactivityRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  const todayDayNumber = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();
  const todayTemplate = templates?.find(t => t.day_number === todayDayNumber);
  const currentWorkout = todayWorkout || workoutLogs?.find(w => w.workout_date === dateStr);
  
  const { data: templateExercises } = useTemplateExercises(
    currentWorkout?.template_id || todayTemplate?.id || null
  );

  // Elapsed timer
  useEffect(() => {
    if (isWorkoutMode && workoutStartTime && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - workoutStartTime) / 1000));
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [isWorkoutMode, workoutStartTime, isPaused]);

  // Auto-pause inactivity
  useEffect(() => {
    if (!isWorkoutMode || isPaused) return;
    const resetInactivity = () => {
      if (inactivityRef.current) clearTimeout(inactivityRef.current);
      inactivityRef.current = setTimeout(() => {
        setIsPaused(true);
        toast({ title: 'Workout paused', description: '10 minutes of inactivity detected' });
      }, 10 * 60 * 1000);
    };
    resetInactivity();
    window.addEventListener('touchstart', resetInactivity);
    window.addEventListener('click', resetInactivity);
    return () => {
      if (inactivityRef.current) clearTimeout(inactivityRef.current);
      window.removeEventListener('touchstart', resetInactivity);
      window.removeEventListener('click', resetInactivity);
    };
  }, [isWorkoutMode, isPaused]);

  // Workout stats
  const workoutStats = useMemo(() => {
    if (!currentWorkout?.exercise_logs) return { totalVolume: 0, setsDone: 0, totalSets: 0 };
    let totalVolume = 0, setsDone = 0, totalSets = 0;
    currentWorkout.exercise_logs.forEach(el => {
      el.set_logs?.forEach(s => {
        totalSets++;
        if (s.weight_kg && s.reps) {
          totalVolume += s.weight_kg * s.reps;
          setsDone++;
        }
      });
    });
    return { totalVolume, setsDone, totalSets };
  }, [currentWorkout]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      const dayNumber = i + 1;
      const template = templates?.find(t => t.day_number === dayNumber);
      const workout = workoutLogs?.find(w => w.workout_date === format(date, 'yyyy-MM-dd'));
      return {
        date, dayNumber,
        label: format(date, 'EEE'),
        dayOfMonth: format(date, 'd'),
        template, workout,
        isToday: format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'),
        isSelected: format(date, 'yyyy-MM-dd') === dateStr,
      };
    });
  }, [weekStart, templates, workoutLogs, dateStr]);

  const handleStartWorkout = async () => {
    if (!todayTemplate) {
      toast({ title: 'No template for today', description: 'Set up your workout split first', variant: 'destructive' });
      return;
    }
    try {
      const result = await createWorkoutLog.mutateAsync({ template_id: todayTemplate.id, workout_date: dateStr });
      if (templateExercises) {
        for (const te of templateExercises) {
          await createExerciseLog.mutateAsync({
            workout_log_id: result.id, exercise_id: te.exercise_id, exercise_order: te.exercise_order,
          });
        }
      }
      refetchTodayWorkout();
      setIsWorkoutMode(true);
      setWorkoutStartTime(Date.now());
      setElapsedSeconds(0);
      setIsPaused(false);
      toast({ title: 'Workout started! 💪' });
    } catch (error) {
      toast({ title: 'Error starting workout', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handleEnterWorkoutMode = () => {
    setIsWorkoutMode(true);
    setWorkoutStartTime(Date.now());
    setElapsedSeconds(0);
    setIsPaused(false);
  };

  const handleExitWorkout = () => {
    setShowExitDialog(true);
  };

  const confirmExitWorkout = () => {
    setIsWorkoutMode(false);
    setWorkoutStartTime(null);
    setIsPaused(false);
    setShowExitDialog(false);
  };

  const handleCompleteWorkout = async () => {
    if (!currentWorkout) return;
    try {
      await updateWorkoutLog.mutateAsync({ id: currentWorkout.id, completed: true });
      setIsWorkoutMode(false);
      setWorkoutStartTime(null);
      toast({ title: 'Workout completed! 💪' });
    } catch (error) {
      toast({ title: 'Error completing workout', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handleAddSet = async (data: Omit<SetLog, 'id' | 'created_at'>) => {
    await createSetLog.mutateAsync(data);
    refetchTodayWorkout();
    if (!(data as any).is_dropset) {
      setRestTimerSeconds(data.rest_seconds || 90);
      setRestTimerActive(true);
    }
  };

  const handleUpdateSet = async (setId: string, updates: Partial<SetLog>) => {
    await updateSetLog.mutateAsync({ id: setId, ...updates });
    refetchTodayWorkout();
    if (updates.weight_kg || updates.reps) checkForPR(setId, updates);
  };

  const checkForPR = async (setId: string, updates: Partial<SetLog>) => {
    try {
      const currentSet = currentWorkout?.exercise_logs?.flatMap(el => el.set_logs || []).find(s => s.id === setId);
      if (!currentSet) return;
      const exerciseLog = currentWorkout?.exercise_logs?.find(el => el.set_logs?.some(s => s.id === setId));
      if (!exerciseLog || !user) return;
      const weight = updates.weight_kg ?? currentSet.weight_kg ?? 0;
      const reps = updates.reps ?? currentSet.reps ?? 0;
      if (weight <= 0 || reps <= 0) return;
      const estimated1RM = weight * (1 + reps / 30);
      const { data: prevPRs } = await supabase.from('pr_history').select('weight_kg, reps')
        .eq('user_id', user.id).eq('exercise_id', exerciseLog.exercise_id)
        .order('created_at', { ascending: false }).limit(1);
      const prevBest = prevPRs?.[0];
      const prevEstimated1RM = prevBest ? Number(prevBest.weight_kg) * (1 + Number(prevBest.reps) / 30) : 0;
      if (estimated1RM > prevEstimated1RM) {
        await supabase.from('pr_history').insert({
          user_id: user.id, exercise_id: exerciseLog.exercise_id,
          pr_type: reps <= 1 ? '1rm' : reps <= 3 ? '3rm' : reps <= 5 ? '5rm' : 'volume',
          weight_kg: weight, reps, previous_weight_kg: prevBest ? Number(prevBest.weight_kg) : null,
          previous_reps: prevBest ? Number(prevBest.reps) : null,
        });
        setPrCelebration({
          show: true, exerciseName: exerciseLog.exercise?.name || 'Exercise',
          oldRecord: prevBest ? `${prevBest.weight_kg}kg × ${prevBest.reps}` : 'None',
          newRecord: `${weight}kg × ${reps}`,
        });
      }
    } catch (e) { console.error('PR check error:', e); }
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

  const handleAddExerciseFromPicker = async (exercise: any) => {
    if (!currentWorkout) return;
    try {
      const order = (currentWorkout.exercise_logs?.length || 0) + 1;
      await createExerciseLog.mutateAsync({
        workout_log_id: currentWorkout.id, exercise_id: exercise.id, exercise_order: order,
      });
      refetchTodayWorkout();
      toast({ title: `${exercise.name} added` });
    } catch (e) {
      toast({ title: 'Error adding exercise', variant: 'destructive' });
    }
  };

  const toggleFavourite = (id: string) => {
    setFavouriteExerciseIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('fav-exercises', JSON.stringify(next));
      return next;
    });
  };

  const recentExerciseIds = useMemo(() => {
    if (!currentWorkout?.exercise_logs) return [];
    return currentWorkout.exercise_logs.map(el => el.exercise_id);
  }, [currentWorkout]);

  const hasTemplates = templates && templates.length > 0;
  const exerciseCount = currentWorkout?.exercise_logs?.length || 0;

  // ===================== FULLSCREEN WORKOUT MODE =====================
  if (isWorkoutMode && currentWorkout) {
    const exerciseLogs = currentWorkout.exercise_logs || [];
    const workoutName = currentWorkout.template?.name || 'Workout';
    const hrs = Math.floor(elapsedSeconds / 3600);
    const mins = Math.floor((elapsedSeconds % 3600) / 60);
    const secs = elapsedSeconds % 60;
    const timeStr = `${hrs.toString().padStart(2,'0')}:${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;

    return (
      <div className="flex flex-col min-h-screen bg-background">
        {/* Paused overlay */}
        {isPaused && (
          <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur flex flex-col items-center justify-center gap-6">
            <Pause className="h-16 w-16 text-muted-foreground" />
            <h2 className="text-3xl font-bold text-foreground">PAUSED</h2>
            <Button size="lg" onClick={() => setIsPaused(false)} className="gap-2 h-14 px-8 text-lg rounded-xl bg-info hover:bg-info/90 text-info-foreground">
              <Play className="h-5 w-5" /> Resume
            </Button>
          </div>
        )}

        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-background border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleExitWorkout}>
                <X className="h-5 w-5" />
              </Button>
              <div>
                <p className="text-sm font-bold text-foreground">{workoutName}</p>
                <p className="text-xs text-muted-foreground font-mono">{timeStr}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsPaused(true)}>
                <Pause className="h-4 w-4" />
              </Button>
              <Badge variant="secondary" className="font-mono text-xs">
                {workoutStats.totalVolume.toLocaleString()} kg
              </Badge>
            </div>
          </div>
          {/* Exercise progress */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Exercise {Math.min(exerciseCount, exerciseCount)} of {exerciseCount}</span>
              <span>{workoutStats.setsDone}/{workoutStats.totalSets} sets</span>
            </div>
            <Progress value={workoutStats.totalSets > 0 ? (workoutStats.setsDone / workoutStats.totalSets) * 100 : 0} className="h-1.5" />
          </div>
        </div>

        {/* Stats bar */}
        <WorkoutStatsBar 
          totalVolume={workoutStats.totalVolume}
          setsDone={workoutStats.setsDone}
          totalSets={workoutStats.totalSets}
          elapsedSeconds={elapsedSeconds}
        />

        {/* Exercise cards */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {exerciseLogs.map((exerciseLog, idx) => (
            <EnhancedExerciseCard 
              key={exerciseLog.id} 
              exerciseLog={exerciseLog}
              exerciseNumber={idx + 1}
              totalExercises={exerciseCount}
              templateExercise={templateExercises?.find(te => te.exercise_id === exerciseLog.exercise_id)}
              previousSets={[]}
              onAddSet={handleAddSet}
              onUpdateSet={handleUpdateSet}
              onDeleteSet={handleDeleteSet}
              onDeleteExercise={handleDeleteExercise}
              onSetLogged={() => {
                if (navigator.vibrate) navigator.vibrate(50);
              }}
            />
          ))}

          {/* Add exercise button */}
          <Button 
            variant="outline" 
            className="w-full h-14 rounded-xl border-dashed"
            onClick={() => setShowExercisePicker(true)}
          >
            <Plus className="h-5 w-5 mr-2" /> Add Exercise
          </Button>

          {/* Finish workout */}
          <Button 
            onClick={handleCompleteWorkout}
            className="w-full h-14 text-lg font-bold rounded-xl bg-success hover:bg-success/90 text-success-foreground"
          >
            <Check className="h-5 w-5 mr-2" /> Finish Workout
          </Button>
        </div>

        {/* Exit dialog */}
        <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" /> Exit Workout?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Your progress is saved but the workout won't be marked as complete.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Continue Workout</AlertDialogCancel>
              <AlertDialogAction onClick={confirmExitWorkout} className="bg-destructive text-destructive-foreground">
                Exit
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <ExercisePicker
          open={showExercisePicker}
          onOpenChange={setShowExercisePicker}
          onSelect={handleAddExerciseFromPicker}
          recentExerciseIds={recentExerciseIds}
          favouriteExerciseIds={favouriteExerciseIds}
          onToggleFavourite={toggleFavourite}
        />

        <RestTimer defaultSeconds={restTimerSeconds} isActive={restTimerActive} onDismiss={() => setRestTimerActive(false)} />
        <PRCelebration show={prCelebration.show} exerciseName={prCelebration.exerciseName}
          oldRecord={prCelebration.oldRecord} newRecord={prCelebration.newRecord}
          onClose={() => setPrCelebration(prev => ({ ...prev, show: false }))} />
      </div>
    );
  }

  // ===================== NORMAL VIEW =====================
  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Workouts</h1>
          <p className="text-muted-foreground">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div className="flex items-center gap-2">
          <PlateCalculator />
          <Button variant="outline" size="sm" onClick={() => setShowTemplateSetup(true)} className="gap-2">
            <Settings className="h-4 w-4" />
            {hasTemplates ? 'Edit Split' : 'Set Up Split'}
          </Button>
        </div>
      </div>

      {/* Week Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(weekStart, -7))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium">
              {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </span>
            <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(weekStart, 7))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => (
              <button
                key={day.dayNumber}
                onClick={() => setSelectedDate(day.date)}
                className={cn(
                  'flex flex-col items-center p-2 md:p-3 rounded-lg transition-all min-h-[48px]',
                  day.isSelected ? 'bg-info text-info-foreground' : 'hover:bg-muted',
                  day.isToday && !day.isSelected && 'ring-2 ring-info'
                )}
              >
                <span className="text-xs font-medium">{day.label}</span>
                <span className="text-lg font-bold">{day.dayOfMonth}</span>
                {day.template && (
                  <span className={cn(
                    'text-[10px] mt-1 px-1 rounded',
                    day.isSelected ? 'bg-info-foreground/20 text-info-foreground' : WORKOUT_DAY_INFO[day.template.day_type as WorkoutDayType].color
                  )}>
                    {day.template.day_type === 'rest' ? 'Rest' : 
                      day.template.day_type.split('_').map(w => w[0].toUpperCase()).join('+')}
                  </span>
                )}
                {day.workout?.completed && <Check className="h-3 w-3 mt-1 text-success" />}
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
        <Card className="border-info/30 bg-gradient-to-br from-card to-info/5">
          <CardContent className="py-8">
            {todayTemplate ? (
              <div className="flex flex-col md:flex-row items-center gap-6">
                <WorkoutMusclePreview dayType={todayTemplate.day_type} className="shrink-0" />
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-xl font-semibold mb-2">{WORKOUT_DAY_INFO[todayTemplate.day_type].label}</h2>
                  <p className="text-muted-foreground mb-4">{templateExercises?.length || 0} exercises ready to go</p>
                  <Button size="lg" onClick={handleStartWorkout} disabled={createWorkoutLog.isPending} 
                    className="gap-2 h-14 px-8 text-lg rounded-xl bg-info hover:bg-info/90 text-info-foreground">
                    <PlayCircle className="h-6 w-6" /> Start Workout
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6">
                <Dumbbell className="h-12 w-12 text-info mb-4" />
                <h2 className="text-xl font-semibold mb-2">No workout planned</h2>
                <p className="text-muted-foreground mb-4">Set up your workout split to get started</p>
                <Button onClick={() => setShowTemplateSetup(true)} className="gap-2 h-12 rounded-xl">
                  <Plus className="h-4 w-4" /> Set Up Split
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Badge className={WORKOUT_DAY_INFO[currentWorkout.template?.day_type as WorkoutDayType || 'rest'].color}>
                {currentWorkout.template?.name || 'Custom Workout'}
              </Badge>
              {currentWorkout.completed && (
                <Badge variant="outline" className="text-success border-success/50">
                  <Check className="h-3 w-3 mr-1" /> Completed
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!currentWorkout.completed && (
                <>
                  <Button variant="outline" onClick={handleEnterWorkoutMode} className="gap-2 h-12 rounded-xl">
                    <PlayCircle className="h-4 w-4" /> Enter Workout Mode
                  </Button>
                  <Button onClick={handleCompleteWorkout} className="gap-2 h-12 rounded-xl">
                    <Check className="h-4 w-4" /> Complete
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {currentWorkout.exercise_logs?.map((exerciseLog, idx) => (
              <EnhancedExerciseCard 
                key={exerciseLog.id} exerciseLog={exerciseLog} exerciseNumber={idx + 1}
                templateExercise={templateExercises?.find(te => te.exercise_id === exerciseLog.exercise_id)}
                previousSets={[]}
                onAddSet={handleAddSet} onUpdateSet={handleUpdateSet}
                onDeleteSet={handleDeleteSet} onDeleteExercise={handleDeleteExercise}
              />
            ))}
            
            {!currentWorkout.completed && (
              <Button variant="outline" className="w-full h-12 rounded-xl border-dashed"
                onClick={() => setShowExercisePicker(true)}>
                <Plus className="h-5 w-5 mr-2" /> Add Exercise
              </Button>
            )}
          </div>
        </div>
      )}

      <WorkoutTemplateSetup open={showTemplateSetup} onOpenChange={setShowTemplateSetup} />
      <ExercisePicker open={showExercisePicker} onOpenChange={setShowExercisePicker}
        onSelect={handleAddExerciseFromPicker} recentExerciseIds={recentExerciseIds}
        favouriteExerciseIds={favouriteExerciseIds} onToggleFavourite={toggleFavourite} />
      <RestTimer defaultSeconds={restTimerSeconds} isActive={restTimerActive} onDismiss={() => setRestTimerActive(false)} />
      <PRCelebration show={prCelebration.show} exerciseName={prCelebration.exerciseName}
        oldRecord={prCelebration.oldRecord} newRecord={prCelebration.newRecord}
        onClose={() => setPrCelebration(prev => ({ ...prev, show: false }))} />
    </div>
  );
}
