import { useState, useMemo } from 'react';
import { Search, Filter, Dumbbell, LayoutGrid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useExerciseLibrary, useMuscleGroups } from '@/hooks/use-fitness-data';
import { EQUIPMENT_INFO, type EquipmentType } from '@/lib/types';
import { BodyDiagram } from '@/components/anatomy/BodyDiagram';
import { ExerciseImage } from '@/components/exercises/ExerciseImage';
import { cn } from '@/lib/utils';

export default function Exercises() {
  const { data: exercises = [], isLoading: exercisesLoading } = useExerciseLibrary();
  const { data: muscleGroups = [], isLoading: musclesLoading } = useMuscleGroups();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<string>('all');
  const [equipmentFilter, setEquipmentFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [showAnatomy, setShowAnatomy] = useState(true);

  const filteredExercises = useMemo(() => {
    return exercises.filter(exercise => {
      const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.coaching_cues?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesMuscle = muscleFilter === 'all' || 
        exercise.primary_muscle_name?.toLowerCase() === muscleFilter.toLowerCase() ||
        exercise.secondary_muscle_name?.toLowerCase() === muscleFilter.toLowerCase();
      
      const matchesEquipment = equipmentFilter === 'all' || exercise.equipment === equipmentFilter;
      
      return matchesSearch && matchesMuscle && matchesEquipment;
    });
  }, [exercises, searchQuery, muscleFilter, equipmentFilter]);

  // Volume per muscle group for heat map + counts
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

  // Muscle group exercise counts
  const muscleCountMap = useMemo(() => {
    const counts: Record<string, number> = {};
    exercises.forEach(ex => {
      if (ex.primary_muscle_name) {
        const key = ex.primary_muscle_name;
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    return counts;
  }, [exercises]);

  const handleAnatomyClick = (muscleId: string, muscleName: string) => {
    if (muscleId) {
      setMuscleFilter(muscleName.toLowerCase());
    } else {
      setMuscleFilter('all');
    }
  };

  const equipmentTypes = Object.keys(EQUIPMENT_INFO) as EquipmentType[];

  if (exercisesLoading || musclesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Exercise Library</h1>
          <p className="text-muted-foreground mt-1">
            {exercises.length} exercises • Click muscles to filter
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showAnatomy ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowAnatomy(!showAnatomy)}
          >
            🦴 Anatomy
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === 'grid' ? 'compact' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Anatomy Diagram */}
      {showAnatomy && (
        <Card className="border-border/50 bg-card/50 backdrop-blur overflow-visible">
          <CardContent className="pt-6 overflow-visible">
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 overflow-visible">
              <BodyDiagram
                selectedMuscle={muscleFilter !== 'all' ? muscleFilter : null}
                onMuscleClick={handleAnatomyClick}
                volumeData={muscleVolume}
                size="md"
                interactive
                showLabels
              />
              <div className="text-center md:text-left max-w-xs">
                <h3 className="font-semibold text-foreground mb-2">
                  {muscleFilter !== 'all' 
                    ? `${muscleFilter.charAt(0).toUpperCase() + muscleFilter.slice(1)} Exercises`
                    : 'Select a Muscle Group'}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {muscleFilter !== 'all' 
                    ? `Showing ${filteredExercises.length} exercises targeting ${muscleFilter}`
                    : 'Click on any muscle to filter exercises. Color intensity shows exercise variety.'}
                </p>
                {/* Muscle group counts */}
                {muscleFilter === 'all' && (
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(muscleCountMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => (
                      <Badge key={name} variant="secondary" className="text-[10px] cursor-pointer" onClick={() => setMuscleFilter(name.toLowerCase())}>
                        {name} ({count})
                      </Badge>
                    ))}
                  </div>
                )}
                {/* Subgroup breakdown */}
                {muscleFilter !== 'all' && (() => {
                  const subgroupCounts: Record<string, number> = {};
                  filteredExercises.forEach(ex => {
                    const sg = ex.muscle_subgroup || 'Unclassified';
                    subgroupCounts[sg] = (subgroupCounts[sg] || 0) + 1;
                  });
                  return Object.keys(subgroupCounts).length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(subgroupCounts).map(([sg, count]) => (
                        <Badge key={sg} variant="secondary" className="text-[10px]">
                          {sg} ({count})
                        </Badge>
                      ))}
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Equipment Filter Row */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <Button
          variant={equipmentFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          className="shrink-0"
          onClick={() => setEquipmentFilter('all')}
        >
          All
        </Button>
        {equipmentTypes.map(type => (
          <Button
            key={type}
            variant={equipmentFilter === type ? 'default' : 'outline'}
            size="sm"
            className="shrink-0"
            onClick={() => setEquipmentFilter(type)}
          >
            {EQUIPMENT_INFO[type].icon} {EQUIPMENT_INFO[type].label}
          </Button>
        ))}
      </div>

      {/* Search + Muscle Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={muscleFilter} onValueChange={setMuscleFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Muscle group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All muscles</SelectItem>
            {muscleGroups.map(muscle => (
              <SelectItem key={muscle.id} value={muscle.name.toLowerCase()}>
                {muscle.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span>Showing {filteredExercises.length} of {exercises.length} exercises</span>
        {(searchQuery || muscleFilter !== 'all' || equipmentFilter !== 'all') && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setSearchQuery('');
              setMuscleFilter('all');
              setEquipmentFilter('all');
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Exercise Grid */}
      <div className={cn(
        'grid gap-4',
        viewMode === 'grid' 
          ? 'sm:grid-cols-2 lg:grid-cols-3' 
          : 'sm:grid-cols-2 lg:grid-cols-4'
      )}>
        {filteredExercises.map(exercise => (
          <Card 
            key={exercise.id} 
            className={cn(
              'hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 group',
              viewMode === 'compact' && 'p-2'
            )}
          >
            {viewMode === 'grid' && (
              <ExerciseImage
                exerciseId={exercise.id}
                exerciseName={exercise.name}
                equipment={exercise.equipment}
                imageUrl={exercise.image_url}
                primaryMuscle={exercise.primary_muscle_name}
                coachingCues={exercise.coaching_cues}
                className="rounded-t-lg rounded-b-none"
                size="lg"
                enableModal
              />
            )}
            <CardHeader className={cn('pb-3', viewMode === 'compact' && 'p-2 pb-1')}>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className={cn(
                  'leading-tight group-hover:text-primary transition-colors',
                  viewMode === 'grid' ? 'text-lg' : 'text-sm'
                )}>
                  {exercise.name}
                </CardTitle>
                {viewMode === 'compact' && (
                  <span className="text-lg shrink-0">
                    {EQUIPMENT_INFO[exercise.equipment]?.icon || '📦'}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className={cn('space-y-3', viewMode === 'compact' && 'p-2 pt-0 space-y-1')}>
              {/* Muscle + equipment badges */}
              <div className="flex flex-wrap gap-1.5">
                {exercise.primary_muscle_name && (
                  <Badge variant="default" className="text-xs">
                    {exercise.primary_muscle_name}
                  </Badge>
                )}
                {exercise.muscle_subgroup && (
                  <Badge variant="secondary" className="text-[10px] opacity-80">
                    {exercise.muscle_subgroup}
                  </Badge>
                )}
                {exercise.secondary_muscle_name && (
                  <Badge variant="outline" className="text-xs">
                    {exercise.secondary_muscle_name}
                  </Badge>
                )}
                <Badge variant="outline" className="text-[10px]">
                  {EQUIPMENT_INFO[exercise.equipment]?.icon} {EQUIPMENT_INFO[exercise.equipment]?.label}
                </Badge>
              </div>
              
              {/* Coaching cues - only in grid view */}
              {viewMode === 'grid' && exercise.coaching_cues && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  💡 {exercise.coaching_cues}
                </p>
              )}
              
              {/* Substitutions - only in grid view */}
              {viewMode === 'grid' && exercise.substitutions && exercise.substitutions.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Alternatives:</span>{' '}
                  {exercise.substitutions.slice(0, 2).join(', ')}
                  {exercise.substitutions.length > 2 && '...'}
                </div>
              )}
            </CardContent>
          </Card>
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
