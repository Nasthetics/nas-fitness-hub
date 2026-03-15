import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ChevronDown, ChevronUp, Trophy, Lightbulb, BarChart3 } from 'lucide-react';
import { QuickSetInput } from './QuickSetInput';
import { ExerciseHistorySheet } from './ExerciseHistorySheet';
import { ExerciseImage } from '@/components/exercises/ExerciseImage';
import { cn } from '@/lib/utils';
import type { SetLog, ExerciseLog, TemplateExercise } from '@/lib/types';
import { useState } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface PreviousSetData {
  weight_kg: number | null;
  reps: number | null;
}

interface EnhancedExerciseCardProps {
  exerciseLog: ExerciseLog;
  exerciseNumber: number;
  totalExercises?: number;
  templateExercise?: TemplateExercise;
  previousSets?: PreviousSetData[];
  recentSessions?: { weight: number; reps: number; rpe?: number }[][];
  onAddSet: (data: Omit<SetLog, 'id' | 'created_at'>) => Promise<void>;
  onUpdateSet: (setId: string, updates: Partial<SetLog>) => Promise<void>;
  onDeleteSet: (setId: string) => Promise<void>;
  onDeleteExercise: (exerciseLogId: string) => Promise<void>;
  onSetLogged?: () => void;
  hasPR?: boolean;
  loading?: boolean;
}

export function EnhancedExerciseCard({
  exerciseLog, exerciseNumber, totalExercises, templateExercise,
  previousSets = [], recentSessions = [],
  onAddSet, onUpdateSet, onDeleteSet, onDeleteExercise, onSetLogged,
  hasPR, loading,
}: EnhancedExerciseCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const exercise = exerciseLog.exercise;
  const sets = exerciseLog.set_logs || [];
  
  const totalVolume = sets.reduce((sum, set) => 
    sum + ((set.weight_kg || 0) * (set.reps || 0)), 0
  );

  const lastSessionTop = previousSets[0];
  const suggestedWeight = lastSessionTop?.weight_kg && previousSets[0] 
    ? lastSessionTop.weight_kg + 2.5 
    : null;

  const handleAddSet = async () => {
    const lastSet = sets[sets.length - 1];
    const prevSet = previousSets[sets.length];
    
    await onAddSet({
      exercise_log_id: exerciseLog.id,
      set_number: sets.length + 1,
      reps: lastSet?.reps || prevSet?.reps || templateExercise?.default_reps || 10,
      weight_kg: lastSet?.weight_kg || prevSet?.weight_kg || 0,
      rpe: null, rir: null,
      rest_seconds: templateExercise?.default_rest_seconds || 90,
      notes: null, is_pr: false,
    });
  };

  const muscleName = exercise?.primary_muscle_name?.toLowerCase() || '';
  const muscleColorClass = muscleName.includes('chest') ? 'badge-chest' :
    muscleName.includes('back') ? 'badge-back' :
    muscleName.includes('shoulder') || muscleName.includes('delt') ? 'badge-shoulders' :
    muscleName.includes('arm') || muscleName.includes('bicep') || muscleName.includes('tricep') ? 'badge-arms' :
    muscleName.includes('leg') || muscleName.includes('quad') || muscleName.includes('ham') || muscleName.includes('glute') || muscleName.includes('calf') ? 'badge-legs' :
    muscleName.includes('core') || muscleName.includes('ab') ? 'badge-core' : '';

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2"><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-32 mt-2" /></CardHeader>
        <CardContent><div className="space-y-3"><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></div></CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border/50">
      {/* Sticky exercise header */}
      <CardHeader className="pb-2 sticky top-0 z-10 bg-card border-b border-border/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-info/20 text-xs font-bold text-info">
              {exerciseNumber}
            </span>
            <span 
              className="cursor-pointer hover:text-info transition-colors"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {exercise?.name || 'Exercise'}
              {sets.length > 0 && (
                <span className="text-xs text-muted-foreground ml-1">· Set {sets.length}{totalExercises ? `/${templateExercise?.default_sets || '?'}` : ''}</span>
              )}
            </span>
            {hasPR && <Trophy className="h-4 w-4 text-warning" />}
          </CardTitle>
          
          <div className="flex items-center gap-1">
            {exercise?.primary_muscle_name && (
              <Badge variant="outline" className={cn('text-xs', muscleColorClass)}>
                {exercise.primary_muscle_name}
              </Badge>
            )}
            {totalVolume > 0 && (
              <Badge variant="secondary" className="text-xs font-mono">
                {totalVolume.toLocaleString()} kg
              </Badge>
            )}
            {/* History button */}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setHistoryOpen(true)}>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsCollapsed(!isCollapsed)}>
              {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove Exercise</AlertDialogTitle>
                  <AlertDialogDescription>
                    Remove "{exercise?.name}" from this workout? This will delete all sets.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => onDeleteExercise(exerciseLog.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        
        {/* Recent sessions inline */}
        {!isCollapsed && recentSessions.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Recent: {recentSessions.slice(0, 3).map((session, i) => 
              session.map(s => `${s.weight}×${s.reps}${s.rpe ? ` RPE${s.rpe}` : ''}`).join(', ')
            ).join(' | ')}
          </p>
        )}

        {/* Smart weight suggestion */}
        {!isCollapsed && suggestedWeight && suggestedWeight > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <Lightbulb className="h-3 w-3 text-warning" />
            <span className="text-xs text-warning">Try {suggestedWeight}kg</span>
          </div>
        )}
        
        {exercise?.coaching_cues && !isCollapsed && (
          <p className="text-xs text-muted-foreground mt-1">💡 {exercise.coaching_cues}</p>
        )}
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent className="space-y-3 pt-3">
          {sets.map((set: SetLog, index: number) => (
            <QuickSetInput
              key={set.id}
              set={set}
              previousSet={previousSets[index]}
              onUpdate={(updates) => onUpdateSet(set.id, updates)}
              onDelete={() => onDeleteSet(set.id)}
              onLogSet={onSetLogged}
            />
          ))}
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-3 h-12 rounded-xl"
            onClick={handleAddSet}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Set
          </Button>
        </CardContent>
      )}

      {/* History sheet */}
      <ExerciseHistorySheet
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        exerciseId={exerciseLog.exercise_id}
        exerciseName={exercise?.name || 'Exercise'}
      />
    </Card>
  );
}
