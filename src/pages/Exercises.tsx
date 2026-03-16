import { useState, useMemo } from 'react';
import { Search, Dumbbell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useExerciseLibrary, useMuscleGroups } from '@/hooks/use-fitness-data';
import { EQUIPMENT_INFO, type EquipmentType } from '@/lib/types';
import { ExerciseImage } from '@/components/exercises/ExerciseImage';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BodyDiagram } from '@/components/anatomy/BodyDiagram';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

export default function Exercises() {
  const { data: exercises = [], isLoading: exercisesLoading } = useExerciseLibrary();
  const { data: muscleGroups = [], isLoading: musclesLoading } = useMuscleGroups();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<string>('all');
  const [showAnatomy, setShowAnatomy] = useState(false);

  const filteredExercises = useMemo(() => {
    return exercises.filter(exercise => {
      const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.coaching_cues?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMuscle = muscleFilter === 'all' || 
        exercise.primary_muscle_name?.toLowerCase() === muscleFilter.toLowerCase() ||
        exercise.secondary_muscle_name?.toLowerCase() === muscleFilter.toLowerCase();
      return matchesSearch && matchesMuscle;
    });
  }, [exercises, searchQuery, muscleFilter]);

  const muscleVolume = useMemo(() => {
    const counts: Record<string, number> = {};
    exercises.forEach(ex => {
      if (ex.primary_muscle_name) {
        const key = ex.primary_muscle_name.toLowerCase();
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([muscleId, volume]) => ({ muscleId, volume }));
  }, [exercises]);

  if (exercisesLoading || musclesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Exercises</h1>
        <span className="text-sm text-muted-foreground">{exercises.length} total</span>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search exercises..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-11 rounded-full bg-card border-border h-12"
        />
      </div>

      {/* Muscle filter pills - horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setMuscleFilter('all')}
          className={cn(
            'shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors',
            muscleFilter === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-muted-foreground'
          )}
        >
          All
        </button>
        {muscleGroups.map(muscle => (
          <button
            key={muscle.id}
            onClick={() => setMuscleFilter(muscle.name.toLowerCase())}
            className={cn(
              'shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
              muscleFilter === muscle.name.toLowerCase()
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground'
            )}
          >
            {muscle.name}
          </button>
        ))}
      </div>

      {/* Collapsible anatomy diagram */}
      <Collapsible open={showAnatomy} onOpenChange={setShowAnatomy}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground">
            <span>🦴 Body Diagram</span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", showAnatomy && "rotate-180")} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="flex justify-center py-4">
            <BodyDiagram
              selectedMuscle={muscleFilter !== 'all' ? muscleFilter : null}
              onMuscleClick={(muscleId, muscleName) => {
                setMuscleFilter(muscleId ? muscleName.toLowerCase() : 'all');
              }}
              volumeData={muscleVolume}
              size="md"
              interactive
              showLabels
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        Showing {filteredExercises.length} of {exercises.length}
        {(searchQuery || muscleFilter !== 'all') && (
          <button 
            onClick={() => { setSearchQuery(''); setMuscleFilter('all'); }}
            className="ml-2 text-primary font-medium"
          >
            Clear
          </button>
        )}
      </p>

      {/* Exercise rows */}
      <div className="space-y-2">
        {filteredExercises.map(exercise => (
          <div
            key={exercise.id}
            className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
          >
            {/* Square image */}
            <div className="h-12 w-12 rounded-lg overflow-hidden shrink-0 bg-secondary">
              <ExerciseImage
                exerciseId={exercise.id}
                exerciseName={exercise.name}
                equipment={exercise.equipment}
                imageUrl={exercise.image_url}
                primaryMuscle={exercise.primary_muscle_name}
                coachingCues={exercise.coaching_cues}
                className="h-12 w-12 object-cover"
                size="sm"
                enableModal
              />
            </div>
            {/* Name + muscle pill */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{exercise.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {exercise.primary_muscle_name && (
                  <span className="text-[10px] font-medium text-primary border border-primary/20 rounded-full px-2 py-0.5">
                    {exercise.primary_muscle_name}
                  </span>
                )}
                {exercise.muscle_subgroup && (
                  <span className="text-[10px] text-muted-foreground">{exercise.muscle_subgroup}</span>
                )}
              </div>
            </div>
            {/* Equipment icon */}
            <span className="text-lg shrink-0">{EQUIPMENT_INFO[exercise.equipment]?.icon || '📦'}</span>
          </div>
        ))}
      </div>

      {filteredExercises.length === 0 && (
        <div className="text-center py-12">
          <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground">No exercises found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
