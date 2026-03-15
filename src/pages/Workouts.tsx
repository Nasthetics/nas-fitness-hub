import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dumbbell, Plus, ChevronLeft, ChevronRight, Check, PlayCircle, Settings,
  X, Pause, Play, AlertTriangle, Sun, Moon, Zap
} from 'lucide-react';
import { useWakeLock } from '@/hooks/use-wake-lock';
import { PlateCalculator } from '@/components/workouts/PlateCalculator';
import { RestTimer } from '@/components/workouts/RestTimer';
import { PRCelebration } from '@/components/workouts/PRCelebration';
import { WorkoutStatsBar } from '@/components/workouts/WorkoutStatsBar';
import { ExercisePicker } from '@/components/workouts/ExercisePicker';
import { ExerciseJumpNav } from '@/components/workouts/ExerciseJumpNav';
import { POSuggestionsBanner } from '@/components/workouts/POSuggestionsBanner';
import { WorkoutSummary } from '@/components/workouts/WorkoutSummary';
import { DeloadBanner } from '@/components/workouts/DeloadBanner';
import { getSmartRestSeconds } from '@/lib/smart-rest';
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
import { TemplateLibrary, SaveAsTemplateDialog } from '@/components/workouts/TemplateLibrary';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkoutMode } from '@/components/layout/AppLayout';
import { useTheme } from '@/hooks/use-theme';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Workouts() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isWorkoutMode, setIsWorkoutMode } = useWorkoutMode();
  const { theme, setTheme } = useTheme();
  const [preWorkoutTheme, setPreWorkoutTheme] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showTemplateSetup, setShowTemplateSetup] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [restTimerSeconds, setRestTimerSeconds] = useState(90);
  const [isPaused, setIsPaused] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showInactivityDialog, setShowInactivityDialog] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null);
  const [pausedElapsed, setPausedElapsed] = useState(0);
  const [brightMode, setBrightMode] = useState(() => localStorage.getItem('bright-mode') === 'true');
  const [favouriteExerciseIds, setFavouriteExerciseIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('fav-exercises') || '[]'); } catch { return []; }
  });
  const [prCelebration, setPrCelebration] = useState<{ show: boolean; exerciseName: string; oldRecord: string; newRecord: string }>({
    show: false, exerciseName: '', oldRecord: '', newRecord: ''
  });
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [showSwipeHint, setShowSwipeHint] = useState(() => !localStorage.getItem('swipe-hint-shown'));
  const inactivityRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useWakeLock(isWorkoutMode && !isPaused);

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

  // Bright mode toggle
  const toggleBrightMode = () => {
    const next = !brightMode;
    setBrightMode(next);
    localStorage.setItem('bright-mode', String(next));
  };

  // Elapsed timer
  useEffect(() => {
    if (isWorkoutMode && workoutStartTime && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(pausedElapsed + Math.floor((Date.now() - workoutStartTime) / 1000));
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [isWorkoutMode, workoutStartTime, isPaused, pausedElapsed]);

  // Auto-pause inactivity — 10 min modal
  useEffect(() => {
    if (!isWorkoutMode || isPaused) return;
    const resetInactivity = () => {
      if (inactivityRef.current) clearTimeout(inactivityRef.current);
      inactivityRef.current = setTimeout(() => {
        setIsPaused(true);
        setShowInactivityDialog(true);
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

  // PO suggestion count
  const poExerciseCount = useMemo(() => {
    if (!currentWorkout?.exercise_logs) return 0;
    return currentWorkout.exercise_logs.filter(el => {
      const firstSet = el.set_logs?.[0];
      return firstSet && !firstSet.weight_kg; // exercises with unfilled sets
    }).length;
  }, [currentWorkout]);

  const handleApplyAllPO = useCallback(async () => {
    if (!currentWorkout?.exercise_logs) return;
    for (const el of currentWorkout.exercise_logs) {
      for (const set of el.set_logs || []) {
        if (!set.weight_kg && set.weight_kg !== 0) {
          // Apply +2.5kg from template or previous
          await updateSetLog.mutateAsync({ id: set.id, weight_kg: 2.5 });
        }
      }
    }
    refetchTodayWorkout();
    toast({ title: 'Applied +2.5kg to all exercises' });
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
      setPreWorkoutTheme(theme);
      setTheme('gym');
      setIsWorkoutMode(true);
      setWorkoutStartTime(Date.now());
      setElapsedSeconds(0);
      setPausedElapsed(0);
      setIsPaused(false);
      toast({ title: 'Workout started! 💪 Gym Mode activated' });
    } catch (error) {
      toast({ title: 'Error starting workout', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handleQuickWorkout = async () => {
    try {
      const result = await createWorkoutLog.mutateAsync({ template_id: null, workout_date: dateStr });
      refetchTodayWorkout();
      setPreWorkoutTheme(theme);
      setTheme('gym');
      setIsWorkoutMode(true);
      setWorkoutStartTime(Date.now());
      setElapsedSeconds(0);
      setPausedElapsed(0);
      setIsPaused(false);
      setShowExercisePicker(true);
      toast({ title: 'Quick Workout started! ⚡ Gym Mode activated' });
    } catch (error) {
      toast({ title: 'Error starting workout', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handleEnterWorkoutMode = () => {
    setWorkoutStartTime(Date.now());
    setElapsedSeconds(0);
    setPausedElapsed(0);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(true);
    setPausedElapsed(elapsedSeconds);
    setWorkoutStartTime(null);
  };

  const handleResume = () => {
    setIsPaused(false);
    setShowInactivityDialog(false);
    setWorkoutStartTime(Date.now());
  };

  const handleExitWorkout = () => setShowExitDialog(true);

  const confirmExitWorkout = () => {
    setIsWorkoutMode(false);
    if (preWorkoutTheme) setTheme(preWorkoutTheme as any);
    setWorkoutStartTime(null);
    setIsPaused(false);
    setShowExitDialog(false);
  };

  const handleCompleteWorkout = async () => {
    if (!currentWorkout) return;
    try {
      await updateWorkoutLog.mutateAsync({ id: currentWorkout.id, completed: true });
      setIsWorkoutMode(false);
      if (preWorkoutTheme) setTheme(preWorkoutTheme as any);
      setWorkoutStartTime(null);
      setShowSummary(true);
    } catch (error) {
      toast({ title: 'Error completing workout', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handleSummaryDone = () => {
    setShowSummary(false);
    toast({ title: 'Workout completed! 💪' });
    // Offer to save as template if it was a quick workout
    if (!currentWorkout?.template_id && currentWorkout?.exercise_logs?.length) {
      setShowSaveTemplate(true);
    }
  };

  const handleStartFromTemplate = async (template: any) => {
    try {
      const result = await createWorkoutLog.mutateAsync({ template_id: template.id, workout_date: dateStr });
      // Fetch template exercises and create exercise logs
      const { data: texs } = await supabase.from('template_exercises')
        .select('exercise_id, exercise_order')
        .eq('template_id', template.id)
        .order('exercise_order');
      if (texs) {
        for (const te of texs) {
          await createExerciseLog.mutateAsync({
            workout_log_id: result.id, exercise_id: te.exercise_id, exercise_order: te.exercise_order,
          });
        }
      }
      refetchTodayWorkout();
      setPreWorkoutTheme(theme);
      setTheme('gym');
      setIsWorkoutMode(true);
      setWorkoutStartTime(Date.now());
      setElapsedSeconds(0);
      setPausedElapsed(0);
      setIsPaused(false);
      toast({ title: `${template.name} started! 💪 Gym Mode activated` });
    } catch (error) {
      toast({ title: 'Error starting workout', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handleAddSet = async (data: Omit<SetLog, 'id' | 'created_at'>) => {
    await createSetLog.mutateAsync(data);
    refetchTodayWorkout();
    if (!(data as any).is_dropset) {
      // Smart rest timer based on exercise type
      const exerciseLog = currentWorkout?.exercise_logs?.find(el => el.id === data.exercise_log_id);
      const exerciseName = exerciseLog?.exercise?.name || '';
      const smartRest = getSmartRestSeconds(exerciseName, data.rpe);
      setRestTimerSeconds(smartRest);
      setRestTimerActive(true);
    }
  };

  const handleRestDismiss = (restedSeconds?: number) => {
    setRestTimerActive(false);
    // restedSeconds could be displayed on the set row in future
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
    try {
      const stored = JSON.parse(localStorage.getItem('recent-exercises') || '[]');
      if (stored.length > 0) return stored.slice(0, 10);
    } catch {}
    if (!currentWorkout?.exercise_logs) return [];
    return currentWorkout.exercise_logs.map(el => el.exercise_id);
  }, [currentWorkout]);

  useEffect(() => {
    if (!currentWorkout?.exercise_logs?.length) return;
    const ids = currentWorkout.exercise_logs.map(el => el.exercise_id);
    try {
      const existing: string[] = JSON.parse(localStorage.getItem('recent-exercises') || '[]');
      const merged = [...new Set([...ids, ...existing])].slice(0, 20);
      localStorage.setItem('recent-exercises', JSON.stringify(merged));
    } catch {}
  }, [currentWorkout?.exercise_logs]);

  const hasTemplates = templates && templates.length > 0;

  // ===================== WORKOUT SUMMARY SCREEN =====================
  if (showSummary && currentWorkout) {
    return (
      <WorkoutSummary
        workout={currentWorkout}
        elapsedSeconds={elapsedSeconds}
        onContinue={handleSummaryDone}
      />
    );
  }

  // ===================== FULLSCREEN WORKOUT MODE =====================
  if (isWorkoutMode && currentWorkout) {
    const exerciseLogs = currentWorkout.exercise_logs || [];
    const workoutName = currentWorkout.template?.name || 'Workout';
    const hrs = Math.floor(elapsedSeconds / 3600);
    const mins = Math.floor((elapsedSeconds % 3600) / 60);
    const secs = elapsedSeconds % 60;
    const timeStr = `${hrs.toString().padStart(2,'0')}:${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;

    const clampedIndex = Math.min(currentExerciseIndex, Math.max(0, exerciseLogs.length - 1));
    const currentEx = exerciseLogs[clampedIndex];

    const goNext = () => {
      if (clampedIndex < exerciseLogs.length - 1) {
        setCurrentExerciseIndex(clampedIndex + 1);
        if (showSwipeHint) { setShowSwipeHint(false); localStorage.setItem('swipe-hint-shown', 'true'); }
      }
    };
    const goPrev = () => {
      if (clampedIndex > 0) {
        setCurrentExerciseIndex(clampedIndex - 1);
        if (showSwipeHint) { setShowSwipeHint(false); localStorage.setItem('swipe-hint-shown', 'true'); }
      }
    };

    const swipeHandlers = {
      onTouchStart: (e: React.TouchEvent) => { (window as any).__swipeStartX = e.touches[0].clientX; (window as any).__swipeStartY = e.touches[0].clientY; },
      onTouchMove: () => {},
      onTouchEnd: (e: React.TouchEvent) => {
        const dx = e.changedTouches[0].clientX - ((window as any).__swipeStartX || 0);
        const dy = e.changedTouches[0].clientY - ((window as any).__swipeStartY || 0);
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
          if (dx < 0) goNext(); else goPrev();
        }
      },
    };

    // Bright mode class
    const brightModeClass = brightMode ? 'bg-white text-black' : 'bg-background';

    return (
      <div className={cn('flex flex-col min-h-screen', brightModeClass)}>
        {/* Paused overlay */}
        {isPaused && !showInactivityDialog && (
          <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur flex flex-col items-center justify-center gap-6">
            <Pause className="h-16 w-16 text-muted-foreground" />
            <h2 className="text-3xl font-bold text-foreground">PAUSED</h2>
            <p className="text-sm text-muted-foreground">Screen wake lock paused</p>
            <Button size="lg" onClick={handleResume} className="gap-2 h-14 px-8 text-lg rounded-xl bg-info hover:bg-info/90 text-info-foreground">
              <Play className="h-5 w-5" /> Resume
            </Button>
          </div>
        )}

        {/* Inactivity dialog */}
        <AlertDialog open={showInactivityDialog} onOpenChange={setShowInactivityDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Still there?</AlertDialogTitle>
              <AlertDialogDescription>Your workout has been paused due to 10 minutes of inactivity.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleResume}>Resume Workout</AlertDialogCancel>
              <AlertDialogAction onClick={() => { setShowInactivityDialog(false); handleCompleteWorkout(); }}>
                Finish Workout
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Top bar */}
        <div className={cn('sticky top-0 z-30 border-b border-border px-4 py-3', brightMode ? 'bg-white' : 'bg-background')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleExitWorkout}>
                <X className="h-5 w-5" />
              </Button>
              <div>
                <p className={cn('text-sm font-bold', brightMode ? 'text-black' : 'text-foreground')}>{workoutName}</p>
                <p className="text-xs text-muted-foreground font-mono">{timeStr}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Bright mode toggle */}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleBrightMode}>
                {brightMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePause}>
                <Pause className="h-4 w-4" />
              </Button>
              <Badge variant="secondary" className="font-mono text-xs">
                {workoutStats.totalVolume.toLocaleString()} kg
              </Badge>
            </div>
          </div>
          {/* Exercise progress dots */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Exercise {clampedIndex + 1} of {exerciseLogs.length}</span>
              <span>{workoutStats.setsDone}/{workoutStats.totalSets} sets</span>
            </div>
            <div className="flex gap-1">
              {exerciseLogs.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentExerciseIndex(i)}
                  className={cn(
                    'h-1.5 flex-1 rounded-full transition-colors',
                    i === clampedIndex ? 'bg-info' : i < clampedIndex ? 'bg-info/40' : 'bg-muted'
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <WorkoutStatsBar 
          totalVolume={workoutStats.totalVolume}
          setsDone={workoutStats.setsDone}
          totalSets={workoutStats.totalSets}
          elapsedSeconds={elapsedSeconds}
        />

        {/* PO Suggestions Banner */}
        <POSuggestionsBanner exerciseCount={poExerciseCount} onApplyAll={handleApplyAllPO} />

        {/* Swipe hint */}
        {showSwipeHint && exerciseLogs.length > 1 && (
          <div className="text-center py-2 text-xs text-muted-foreground animate-pulse">
            ← Swipe to navigate exercises →
          </div>
        )}

        {/* Right-edge jump navigation */}
        <ExerciseJumpNav
          exerciseLogs={exerciseLogs}
          currentIndex={clampedIndex}
          onJump={setCurrentExerciseIndex}
        />

        {/* Current exercise card with swipe */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto" {...swipeHandlers}>
          {/* Navigation arrows */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" className="h-10 w-10" onClick={goPrev} disabled={clampedIndex === 0}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className={cn('text-sm font-medium', brightMode ? 'text-black' : 'text-foreground')}>
              {currentEx?.exercise?.name || 'Exercise'}
            </span>
            <Button variant="ghost" size="icon" className="h-10 w-10" onClick={goNext} disabled={clampedIndex >= exerciseLogs.length - 1}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {currentEx && (
            <EnhancedExerciseCard 
              key={currentEx.id} 
              exerciseLog={currentEx}
              exerciseNumber={clampedIndex + 1}
              totalExercises={exerciseLogs.length}
              templateExercise={templateExercises?.find(te => te.exercise_id === currentEx.exercise_id)}
              previousSets={[]}
              onAddSet={handleAddSet}
              onUpdateSet={handleUpdateSet}
              onDeleteSet={handleDeleteSet}
              onDeleteExercise={handleDeleteExercise}
              onSetLogged={() => {
                if (navigator.vibrate) navigator.vibrate(50);
              }}
            />
          )}

          <Button 
            variant="outline" 
            className="w-full h-14 rounded-xl border-dashed"
            onClick={() => setShowExercisePicker(true)}
          >
            <Plus className="h-5 w-5 mr-2" /> Add Exercise
          </Button>

          {clampedIndex >= exerciseLogs.length - 1 && (
            <Button 
              onClick={handleCompleteWorkout}
              className="w-full h-14 text-lg font-bold rounded-xl bg-success hover:bg-success/90 text-success-foreground"
            >
              <Check className="h-5 w-5 mr-2" /> Finish Workout
            </Button>
          )}
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

        <RestTimer defaultSeconds={restTimerSeconds} isActive={restTimerActive} onDismiss={handleRestDismiss} />
        <PRCelebration show={prCelebration.show} exerciseName={prCelebration.exerciseName}
          oldRecord={prCelebration.oldRecord} newRecord={prCelebration.newRecord}
          onClose={() => setPrCelebration(prev => ({ ...prev, show: false }))} />
      </div>
    );
  }

  // ===================== NORMAL VIEW =====================
  return (
    <div className="space-y-6 animate-in">
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

      {/* Deload Banner */}
      <DeloadBanner />

      {/* Quick Workout Button */}
      <Button 
        onClick={handleQuickWorkout}
        disabled={createWorkoutLog.isPending}
        className="w-full h-16 text-lg font-bold rounded-xl gap-3 bg-info hover:bg-info/90 text-info-foreground"
      >
        <Zap className="h-6 w-6" />
        <div className="flex flex-col items-start">
          <span>Quick Workout</span>
          <span className="text-xs font-normal opacity-80">Log any exercises freely</span>
        </div>
      </Button>

      {/* Template Library */}
      <TemplateLibrary onStartFromTemplate={handleStartFromTemplate} />

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
      <RestTimer defaultSeconds={restTimerSeconds} isActive={restTimerActive} onDismiss={handleRestDismiss} />
      <PRCelebration show={prCelebration.show} exerciseName={prCelebration.exerciseName}
        oldRecord={prCelebration.oldRecord} newRecord={prCelebration.newRecord}
        onClose={() => setPrCelebration(prev => ({ ...prev, show: false }))} />
      <SaveAsTemplateDialog
        open={showSaveTemplate}
        onOpenChange={setShowSaveTemplate}
        exerciseLogs={currentWorkout?.exercise_logs || []}
      />
    </div>
  );
}
