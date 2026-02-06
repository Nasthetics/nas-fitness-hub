import { useState, useMemo } from 'react';
import { Search, Filter, Dumbbell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useExerciseLibrary, useMuscleGroups } from '@/hooks/use-fitness-data';
import { EQUIPMENT_INFO, type EquipmentType } from '@/lib/types';

export default function Exercises() {
  const { data: exercises = [], isLoading: exercisesLoading } = useExerciseLibrary();
  const { data: muscleGroups = [], isLoading: musclesLoading } = useMuscleGroups();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<string>('all');
  const [equipmentFilter, setEquipmentFilter] = useState<string>('all');

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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Exercise Library</h1>
        <p className="text-muted-foreground mt-1">
          {exercises.length} exercises • Search, filter, and learn proper form
        </p>
      </div>

      {/* Filters */}
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
        
        <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Equipment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All equipment</SelectItem>
            {equipmentTypes.map(type => (
              <SelectItem key={type} value={type}>
                {EQUIPMENT_INFO[type].icon} {EQUIPMENT_INFO[type].label}
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredExercises.map(exercise => (
          <Card key={exercise.id} className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg leading-tight">{exercise.name}</CardTitle>
                <span className="text-xl shrink-0">
                  {EQUIPMENT_INFO[exercise.equipment]?.icon || '📦'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Muscle badges */}
              <div className="flex flex-wrap gap-1.5">
                {exercise.primary_muscle_name && (
                  <Badge variant="default" className="text-xs">
                    {exercise.primary_muscle_name}
                  </Badge>
                )}
                {exercise.secondary_muscle_name && (
                  <Badge variant="outline" className="text-xs">
                    {exercise.secondary_muscle_name}
                  </Badge>
                )}
              </div>
              
              {/* Equipment */}
              <div className="text-sm text-muted-foreground">
                {EQUIPMENT_INFO[exercise.equipment]?.label || 'Other'}
              </div>
              
              {/* Coaching cues */}
              {exercise.coaching_cues && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  💡 {exercise.coaching_cues}
                </p>
              )}
              
              {/* Substitutions */}
              {exercise.substitutions && exercise.substitutions.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Alternatives:</span>{' '}
                  {exercise.substitutions.join(', ')}
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
