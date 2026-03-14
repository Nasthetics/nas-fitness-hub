import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { QuickSetInput } from './QuickSetInput';
import { cn } from '@/lib/utils';
import type { SetLog, ExerciseLog, TemplateExercise } from '@/lib/types';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface PreviousSetData {
  weight_kg: number | null;
  reps: number | null;
}

interface EnhancedExerciseCardProps {
  exerciseLog: ExerciseLog;
  exerciseNumber: number;
  templateExercise?: TemplateExercise;
  previousSets?: PreviousSetData[];
  onAddSet: (data: Omit<SetLog, 'id' | 'created_at'>) => Promise<void>;
  onUpdateSet: (setId: string, updates: Partial<SetLog>) => Promise<void>;
  onDeleteSet: (setId: string) => Promise<void>;
  onDeleteExercise: (exerciseLogId: string) => Promise<void>;
}

export function EnhancedExerciseCard({
  exerciseLog,
  exerciseNumber,
  templateExercise,
  previousSets = [],
  onAddSet,
  onUpdateSet,
  onDeleteSet,
  onDeleteExercise,
}: EnhancedExerciseCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const exercise = exerciseLog.exercise;
  const sets = exerciseLog.set_logs || [];
  
  // Calculate total volume for this exercise
  const totalVolume = sets.reduce((sum, set) => 
    sum + ((set.weight_kg || 0) * (set.reps || 0)), 0
  );

  const handleAddSet = async () => {
    const lastSet = sets[sets.length - 1];
    const prevSet = previousSets[sets.length]; // Get corresponding previous set
    
    await onAddSet({
      exercise_log_id: exerciseLog.id,
      set_number: sets.length + 1,
      reps: lastSet?.reps || prevSet?.reps || templateExercise?.default_reps || 10,
      weight_kg: lastSet?.weight_kg || prevSet?.weight_kg || 0,
      rpe: null,
      rir: null,
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
            <span 
              className="cursor-pointer hover:text-primary transition-colors"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {exercise?.name || 'Exercise'}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {exercise?.primary_muscle_name && (
              <Badge variant="outline" className="text-xs">
                {exercise.primary_muscle_name}
              </Badge>
            )}
            {totalVolume > 0 && (
              <Badge variant="secondary" className="text-xs">
                {totalVolume.toLocaleString()} kg
              </Badge>
            )}
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
                    Remove "{exercise?.name}" from this workout? This will delete all sets logged for this exercise.
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
        
        {/* Previous session reference */}
        {previousSets.length > 0 && !isCollapsed && (
          <p className="text-xs text-muted-foreground mt-1">
            Last session: {previousSets.map((s, i) => 
              `${s.weight_kg || 0}×${s.reps || 0}`
            ).join(', ')}
          </p>
        )}
        
        {exercise?.coaching_cues && !isCollapsed && (
          <p className="text-xs text-muted-foreground mt-1">
            💡 {exercise.coaching_cues}
          </p>
        )}
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent>
          {/* Sets Header */}
          <div className="grid grid-cols-[40px_1fr_1fr_60px_60px_32px] gap-2 text-xs font-medium text-muted-foreground px-2 mb-2">
            <span>Set</span>
            <span>Weight (kg)</span>
            <span>Reps</span>
            <span className="text-center">Prev</span>
            <span className="text-center">Vol</span>
            <span></span>
          </div>
          
          {/* Sets */}
          <div className="space-y-2">
            {sets.map((set: SetLog, index: number) => (
              <QuickSetInput
                key={set.id}
                set={set}
                previousSet={previousSets[index]}
                onUpdate={(updates) => onUpdateSet(set.id, updates)}
                onDelete={() => onDeleteSet(set.id)}
              />
            ))}
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-3"
            onClick={handleAddSet}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Set
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
