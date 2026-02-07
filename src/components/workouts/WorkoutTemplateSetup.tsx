import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Settings, Wand2 } from 'lucide-react';
import { WORKOUT_DAY_INFO, type WorkoutDayType } from '@/lib/types';
import { useCreateWorkoutTemplate, useWorkoutTemplates } from '@/hooks/use-fitness-data';
import { useToast } from '@/hooks/use-toast';

interface WorkoutTemplateSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_TYPES: WorkoutDayType[] = ['shoulders_arms', 'chest_back', 'legs', 'rest'];

const PRESETS = {
  '6-day-bodybuilding': {
    name: '6-Day Bodybuilding Split',
    days: [
      { name: 'Shoulders + Arms', day_type: 'shoulders_arms' as WorkoutDayType },
      { name: 'Chest + Back', day_type: 'chest_back' as WorkoutDayType },
      { name: 'Legs', day_type: 'legs' as WorkoutDayType },
      { name: 'Rest', day_type: 'rest' as WorkoutDayType },
      { name: 'Chest + Back', day_type: 'chest_back' as WorkoutDayType },
      { name: 'Shoulders + Arms', day_type: 'shoulders_arms' as WorkoutDayType },
      { name: 'Rest', day_type: 'rest' as WorkoutDayType },
    ],
  },
  'ppl': {
    name: 'Push/Pull/Legs (6 days)',
    days: [
      { name: 'Push (Chest/Shoulders/Triceps)', day_type: 'chest_back' as WorkoutDayType },
      { name: 'Pull (Back/Biceps)', day_type: 'chest_back' as WorkoutDayType },
      { name: 'Legs', day_type: 'legs' as WorkoutDayType },
      { name: 'Push (Chest/Shoulders/Triceps)', day_type: 'shoulders_arms' as WorkoutDayType },
      { name: 'Pull (Back/Biceps)', day_type: 'shoulders_arms' as WorkoutDayType },
      { name: 'Legs', day_type: 'legs' as WorkoutDayType },
      { name: 'Rest', day_type: 'rest' as WorkoutDayType },
    ],
  },
  'upper-lower': {
    name: 'Upper/Lower (4 days)',
    days: [
      { name: 'Upper Body', day_type: 'chest_back' as WorkoutDayType },
      { name: 'Lower Body', day_type: 'legs' as WorkoutDayType },
      { name: 'Rest', day_type: 'rest' as WorkoutDayType },
      { name: 'Upper Body', day_type: 'shoulders_arms' as WorkoutDayType },
      { name: 'Lower Body', day_type: 'legs' as WorkoutDayType },
      { name: 'Rest', day_type: 'rest' as WorkoutDayType },
      { name: 'Rest', day_type: 'rest' as WorkoutDayType },
    ],
  },
};

export function WorkoutTemplateSetup({ open, onOpenChange }: WorkoutTemplateSetupProps) {
  const { toast } = useToast();
  const { data: existingTemplates } = useWorkoutTemplates();
  const createTemplate = useCreateWorkoutTemplate();
  
  const [days, setDays] = useState<{ name: string; day_type: WorkoutDayType }[]>(
    DAY_NAMES.map(() => ({ name: 'Rest', day_type: 'rest' }))
  );
  const [isSaving, setIsSaving] = useState(false);

  const applyPreset = (presetKey: keyof typeof PRESETS) => {
    setDays(PRESETS[presetKey].days);
  };

  const updateDay = (index: number, field: 'name' | 'day_type', value: string) => {
    setDays(prev => {
      const updated = [...prev];
      if (field === 'day_type') {
        updated[index] = { 
          ...updated[index], 
          day_type: value as WorkoutDayType,
          name: value === 'rest' ? 'Rest' : WORKOUT_DAY_INFO[value as WorkoutDayType].label
        };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Create templates for each day
      for (let i = 0; i < days.length; i++) {
        await createTemplate.mutateAsync({
          name: days[i].name,
          day_type: days[i].day_type,
          day_number: i + 1,
        });
      }
      toast({ title: 'Workout split saved!' });
      onOpenChange(false);
    } catch (error) {
      toast({ 
        title: 'Error saving templates', 
        description: (error as Error).message,
        variant: 'destructive' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasExistingTemplates = existingTemplates && existingTemplates.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Set Up Your Workout Split
          </DialogTitle>
        </DialogHeader>

        {hasExistingTemplates && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm">
            <p className="text-amber-400">
              You already have templates configured. Saving will add new ones without removing existing templates.
            </p>
          </div>
        )}

        {/* Quick Presets */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Quick Presets
          </Label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PRESETS).map(([key, preset]) => (
              <Button
                key={key}
                variant="outline"
                size="sm"
                onClick={() => applyPreset(key as keyof typeof PRESETS)}
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Day Configuration */}
        <div className="space-y-3 mt-4">
          <Label>Weekly Schedule</Label>
          <div className="space-y-2">
            {days.map((day, index) => (
              <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                <span className="w-24 text-sm font-medium text-muted-foreground">
                  {DAY_NAMES[index]}
                </span>
                <Select
                  value={day.day_type}
                  onValueChange={(value) => updateDay(index, 'day_type', value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAY_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={WORKOUT_DAY_INFO[type].color + ' text-xs'}
                          >
                            {type === 'rest' ? '😴' : '💪'}
                          </Badge>
                          {WORKOUT_DAY_INFO[type].label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={day.name}
                  onChange={(e) => updateDay(index, 'name', e.target.value)}
                  placeholder="Custom name"
                  className="flex-1 h-9"
                />
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="mt-6">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Split'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
