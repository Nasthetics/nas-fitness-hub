import { useState, useMemo } from 'react';
import Fuse from 'fuse.js';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Star, Clock, Dumbbell, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useExerciseLibrary } from '@/hooks/use-fitness-data';
import { cn } from '@/lib/utils';
import type { Exercise, EquipmentType } from '@/lib/types';

interface ExercisePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (exercise: Exercise) => void;
  recentExerciseIds?: string[];
  favouriteExerciseIds?: string[];
  onToggleFavourite?: (exerciseId: string) => void;
  onCreateExercise?: (name: string, muscleGroup: string, equipment: EquipmentType) => Promise<void>;
}

const MUSCLE_FILTERS = ['All', 'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core'];
const EQUIPMENT_OPTIONS: EquipmentType[] = ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell', 'resistance_band', 'other'];

const SUBGROUP_MAP: Record<string, string[]> = {
  Chest: ['Upper Chest', 'Mid Chest', 'Lower Chest'],
  Back: ['Upper Back/Traps', 'Lats', 'Mid Back/Rhomboids', 'Lower Back'],
  Shoulders: ['Front Delt', 'Side Delt', 'Rear Delt'],
  Legs: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
  Arms: ['Biceps', 'Triceps', 'Forearms'],
  Core: ['Upper Abs', 'Lower Abs', 'Obliques'],
};

export function ExercisePicker({ 
  open, onOpenChange, onSelect, 
  recentExerciseIds = [], 
  favouriteExerciseIds = [],
  onToggleFavourite,
  onCreateExercise,
}: ExercisePickerProps) {
  const { data: exercises = [] } = useExerciseLibrary();
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('All');
  const [subgroupFilter, setSubgroupFilter] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newMuscle, setNewMuscle] = useState('Chest');
  const [newEquipment, setNewEquipment] = useState<EquipmentType>('barbell');

  // Fuse.js instance
  const fuse = useMemo(() => new Fuse(exercises, {
    keys: ['name', 'primary_muscle_name', 'equipment'],
    threshold: 0.4,
    includeMatches: true,
    includeScore: true,
  }), [exercises]);

  const filteredExercises = useMemo(() => {
    let result: Exercise[];
    
    if (search) {
      const fuseResults = fuse.search(search);
      result = fuseResults.map(r => r.item);
    } else {
      result = exercises;
    }

    if (muscleFilter !== 'All') {
      const f = muscleFilter.toLowerCase();
      result = result.filter(e => 
        e.primary_muscle_name?.toLowerCase().includes(f) ||
        e.secondary_muscle_name?.toLowerCase().includes(f)
      );
    }
    if (subgroupFilter) {
      result = result.filter(e => e.muscle_subgroup === subgroupFilter);
    }
    return result;
  }, [exercises, search, muscleFilter, subgroupFilter, fuse]);

  const recentExercises = useMemo(() => 
    recentExerciseIds
      .map(id => exercises.find(e => e.id === id))
      .filter(Boolean)
      .slice(0, 10) as Exercise[],
    [recentExerciseIds, exercises]
  );

  const favouriteExercises = useMemo(() =>
    exercises.filter(e => favouriteExerciseIds.includes(e.id)),
    [favouriteExerciseIds, exercises]
  );

  const handleCreate = async () => {
    if (!onCreateExercise || !search.trim()) return;
    await onCreateExercise(search.trim(), newMuscle, newEquipment);
    setShowCreateForm(false);
    setSearch('');
    onOpenChange(false);
  };

  const renderExerciseCard = (exercise: Exercise) => {
    const isFav = favouriteExerciseIds.includes(exercise.id);
    return (
      <button
        key={exercise.id}
        onClick={() => { onSelect(exercise); onOpenChange(false); }}
        className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left w-full min-h-[56px]"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
          <Dumbbell className="h-4 w-4 text-info" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {search ? highlightMatch(exercise.name, search) : exercise.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {exercise.primary_muscle_name && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{exercise.primary_muscle_name}</Badge>
            )}
            {exercise.muscle_subgroup && (
              <Badge variant="secondary" className="text-[9px] px-1 py-0 opacity-75">{exercise.muscle_subgroup}</Badge>
            )}
            <span className="text-[10px] text-muted-foreground">{exercise.equipment}</span>
          </div>
        </div>
        {onToggleFavourite && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavourite(exercise.id); }}
            className="p-1"
          >
            <Star className={cn('h-4 w-4', isFav ? 'fill-warning text-warning' : 'text-muted-foreground')} />
          </button>
        )}
      </button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Exercise</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={recentExercises.length > 0 ? 'recent' : 'all'} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full">
            <TabsTrigger value="recent" className="flex-1 gap-1">
              <Clock className="h-3.5 w-3.5" />Recent
            </TabsTrigger>
            <TabsTrigger value="favourites" className="flex-1 gap-1">
              <Star className="h-3.5 w-3.5" />Favourites
            </TabsTrigger>
            <TabsTrigger value="all" className="flex-1 gap-1">
              <Dumbbell className="h-3.5 w-3.5" />All
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="flex-1 overflow-y-auto mt-3 space-y-2">
            {recentExercises.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">No recent exercises yet</p>
            ) : (
              recentExercises.map(renderExerciseCard)
            )}
          </TabsContent>

          <TabsContent value="favourites" className="flex-1 overflow-y-auto mt-3 space-y-2">
            {favouriteExercises.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">Star exercises to add them here</p>
            ) : (
              favouriteExercises.map(renderExerciseCard)
            )}
          </TabsContent>

          <TabsContent value="all" className="flex-1 overflow-y-auto mt-3 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search exercises... (fuzzy: 'bch prs' → Bench Press)"
                className="pl-9"
              />
            </div>

            {/* Muscle filter chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {MUSCLE_FILTERS.map(m => (
                <button
                  key={m}
                  onClick={() => { setMuscleFilter(m); setSubgroupFilter(null); }}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                    muscleFilter === m 
                      ? 'bg-info text-info-foreground' 
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Subgroup filter chips */}
            {muscleFilter !== 'All' && SUBGROUP_MAP[muscleFilter] && (
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <button
                  onClick={() => setSubgroupFilter(null)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-colors',
                    !subgroupFilter ? 'bg-primary text-primary-foreground' : 'bg-muted/70 text-muted-foreground hover:text-foreground'
                  )}
                >
                  All
                </button>
                {SUBGROUP_MAP[muscleFilter].map(sg => (
                  <button
                    key={sg}
                    onClick={() => setSubgroupFilter(sg)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-colors',
                      subgroupFilter === sg ? 'bg-primary text-primary-foreground' : 'bg-muted/70 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {sg}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-2">
              {filteredExercises.map(renderExerciseCard)}
              
              {/* Inline create when no results */}
              {filteredExercises.length === 0 && search.trim() && (
                <div className="space-y-3 py-4">
                  <p className="text-center text-muted-foreground text-sm">No exercises found</p>
                  {!showCreateForm ? (
                    <Button
                      variant="outline"
                      className="w-full h-12 rounded-xl border-dashed gap-2"
                      onClick={() => setShowCreateForm(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Create &quot;{search.trim()}&quot; as new exercise
                    </Button>
                  ) : (
                    <div className="space-y-3 p-4 rounded-xl border border-border bg-card">
                      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Exercise name" />
                      <Select value={newMuscle} onValueChange={setNewMuscle}>
                        <SelectTrigger><SelectValue placeholder="Muscle Group" /></SelectTrigger>
                        <SelectContent>
                          {MUSCLE_FILTERS.filter(m => m !== 'All').map(m => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={newEquipment} onValueChange={(v) => setNewEquipment(v as EquipmentType)}>
                        <SelectTrigger><SelectValue placeholder="Equipment" /></SelectTrigger>
                        <SelectContent>
                          {EQUIPMENT_OPTIONS.map(e => (
                            <SelectItem key={e} value={e}>{e.replace('_', ' ')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                        <Button className="flex-1 bg-info hover:bg-info/90 text-info-foreground" onClick={handleCreate}>
                          Create & Add
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {filteredExercises.length === 0 && !search.trim() && (
                <p className="text-center text-muted-foreground py-8 text-sm">No exercises found</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function highlightMatch(text: string, query: string) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="bg-warning/30 text-warning font-semibold">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}
