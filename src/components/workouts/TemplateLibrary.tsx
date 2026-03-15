import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PlayCircle, Trash2, Clock, Dumbbell } from 'lucide-react';
import { useWorkoutTemplates, useTemplateExercises } from '@/hooks/use-fitness-data';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { WORKOUT_DAY_INFO, type WorkoutDayType } from '@/lib/types';

interface TemplateCardProps {
  template: any;
  onStart: (template: any) => void;
}

function TemplateCard({ template, onStart }: TemplateCardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: exercises = [] } = useTemplateExercises(template.id);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    if (!user) return;
    // Delete template exercises first, then template
    await supabase.from('template_exercises').delete().eq('template_id', template.id);
    await supabase.from('workout_templates').delete().eq('id', template.id);
    queryClient.invalidateQueries({ queryKey: ['workout-templates'] });
    toast({ title: 'Template deleted' });
    setShowDeleteConfirm(false);
  };

  const muscleGroups = [...new Set(exercises
    .map(e => e.exercise?.primary_muscle_name)
    .filter(Boolean)
  )];

  const estDuration = exercises.length * 8; // ~8 min per exercise

  return (
    <>
      <Card className="border-border/50 hover:border-primary/30 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-foreground">{template.name}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <Dumbbell className="h-3 w-3" />
                <span>{exercises.length} exercises</span>
                <Clock className="h-3 w-3 ml-1" />
                <span>~{estDuration} min</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Exercise preview */}
          <div className="space-y-1 mb-3">
            {exercises.slice(0, 4).map((e, i) => (
              <p key={e.id} className="text-xs text-muted-foreground truncate">
                {i + 1}. {e.exercise?.name || 'Exercise'}
              </p>
            ))}
            {exercises.length > 4 && (
              <p className="text-xs text-muted-foreground">+{exercises.length - 4} more</p>
            )}
          </div>

          {/* Muscle chips */}
          <div className="flex flex-wrap gap-1 mb-3">
            {muscleGroups.map(m => (
              <Badge key={m} variant="outline" className="text-[10px] h-5">{m}</Badge>
            ))}
          </div>

          <Button className="w-full gap-2" size="sm" onClick={() => onStart(template)}>
            <PlayCircle className="h-4 w-4" /> Start Workout
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{template.name}"?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this template and its exercises.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface SaveAsTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exerciseLogs: any[];
}

export function SaveAsTemplateDialog({ open, onOpenChange, exerciseLogs }: SaveAsTemplateDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);
    try {
      // Create template
      const { data: template, error } = await supabase
        .from('workout_templates')
        .insert({
          user_id: user.id,
          name: name.trim(),
          day_type: 'chest_back' as any, // default, user can change later
          day_number: 1,
        })
        .select()
        .single();
      if (error) throw error;

      // Add exercises
      for (const el of exerciseLogs) {
        await supabase.from('template_exercises').insert({
          template_id: template.id,
          exercise_id: el.exercise_id,
          exercise_order: el.exercise_order,
          default_sets: el.set_logs?.length || 4,
          default_reps: el.set_logs?.[0]?.reps || 10,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['workout-templates'] });
      toast({ title: `Template "${name}" saved! 🎯` });
      setName('');
      onOpenChange(false);
    } catch (e) {
      toast({ title: 'Error saving template', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Template Name</Label>
            <Input placeholder='e.g. "Push A", "Pull B", "Legs"' value={name} onChange={e => setName(e.target.value)} />
          </div>
          <p className="text-sm text-muted-foreground">{exerciseLogs.length} exercises will be saved</p>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? 'Saving...' : 'Save Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface TemplateLibraryProps {
  onStartFromTemplate: (template: any) => void;
}

export function TemplateLibrary({ onStartFromTemplate }: TemplateLibraryProps) {
  const { data: templates = [] } = useWorkoutTemplates();

  if (templates.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Templates</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {templates.map(t => (
          <TemplateCard key={t.id} template={t} onStart={onStartFromTemplate} />
        ))}
      </div>
    </div>
  );
}