import { useState } from 'react';
import { Dumbbell, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EQUIPMENT_INFO, type EquipmentType } from '@/lib/types';
import { useExerciseImage } from '@/hooks/use-exercise-image';
import { Button } from '@/components/ui/button';

interface ExerciseImageProps {
  exerciseId?: string;
  exerciseName: string;
  equipment: EquipmentType;
  imageUrl?: string | null;
  primaryMuscle?: string | null;
  className?: string;
  showPlaceholder?: boolean;
  enableGeneration?: boolean;
}

// Generate a gradient background based on muscle group
const getExerciseGradient = (name: string) => {
  const lowerName = name.toLowerCase();
  
  // Chest exercises
  if (lowerName.includes('press') || lowerName.includes('fly') || lowerName.includes('pec') || lowerName.includes('push')) {
    return 'from-red-500/20 to-red-600/10';
  }
  // Back exercises
  if (lowerName.includes('row') || lowerName.includes('pull') || lowerName.includes('lat') || lowerName.includes('deadlift')) {
    return 'from-blue-500/20 to-blue-600/10';
  }
  // Shoulder exercises
  if (lowerName.includes('raise') || lowerName.includes('delt') || lowerName.includes('shoulder') || lowerName.includes('shrug')) {
    return 'from-purple-500/20 to-purple-600/10';
  }
  // Arm exercises
  if (lowerName.includes('curl') || lowerName.includes('extension') || lowerName.includes('tricep') || lowerName.includes('bicep')) {
    return 'from-amber-500/20 to-amber-600/10';
  }
  // Leg exercises
  if (lowerName.includes('squat') || lowerName.includes('leg') || lowerName.includes('lunge') || lowerName.includes('calf')) {
    return 'from-emerald-500/20 to-emerald-600/10';
  }
  // Core exercises
  if (lowerName.includes('plank') || lowerName.includes('crunch') || lowerName.includes('ab') || lowerName.includes('core')) {
    return 'from-pink-500/20 to-pink-600/10';
  }
  
  return 'from-muted/30 to-muted/10';
};

export function ExerciseImage({
  exerciseId,
  exerciseName,
  equipment,
  imageUrl: existingImageUrl,
  primaryMuscle,
  className,
  showPlaceholder = true,
  enableGeneration = true,
}: ExerciseImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const { imageUrl, isGenerating, generate } = useExerciseImage({
    exerciseId: exerciseId || '',
    exerciseName,
    equipment,
    primaryMuscle,
    existingImageUrl,
    autoGenerate: false,
  });

  const equipmentInfo = EQUIPMENT_INFO[equipment] || EQUIPMENT_INFO.other;
  const gradientClass = getExerciseGradient(exerciseName);

  const displayUrl = imageUrl || existingImageUrl;

  // If we have a valid image URL and no error
  if (displayUrl && !imageError) {
    return (
      <div className={cn('relative overflow-hidden rounded-lg bg-muted/20', className)}>
        {!imageLoaded && showPlaceholder && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/10 animate-pulse">
            <Dumbbell className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}
        <img
          src={displayUrl}
          alt={exerciseName}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Placeholder with equipment icon and optional generate button
  if (showPlaceholder) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-lg bg-gradient-to-br gap-2',
          gradientClass,
          className
        )}
      >
        <div className="text-center">
          <span className="text-3xl">{equipmentInfo.icon}</span>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            {equipmentInfo.label}
          </p>
        </div>
        
        {enableGeneration && exerciseId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              generate();
            }}
            disabled={isGenerating}
            className="text-xs h-7 px-2 bg-background/50 hover:bg-background/80"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3 mr-1" />
                Generate AI Image
              </>
            )}
          </Button>
        )}
      </div>
    );
  }

  return null;
}
