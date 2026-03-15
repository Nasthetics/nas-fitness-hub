import { useState } from 'react';
import { Dumbbell, Loader2, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EQUIPMENT_INFO, type EquipmentType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

interface ExerciseImageProps {
  exerciseId?: string;
  exerciseName: string;
  equipment: EquipmentType;
  imageUrl?: string | null;
  primaryMuscle?: string | null;
  coachingCues?: string | null;
  className?: string;
  showPlaceholder?: boolean;
  size?: 'sm' | 'md' | 'lg';
  enableModal?: boolean;
}

const MUSCLE_GRADIENTS: Record<string, string> = {
  chest: 'from-red-500/20 to-red-600/10',
  back: 'from-blue-500/20 to-blue-600/10',
  shoulders: 'from-purple-500/20 to-purple-600/10',
  biceps: 'from-amber-500/20 to-amber-600/10',
  triceps: 'from-amber-500/20 to-amber-600/10',
  forearms: 'from-amber-500/20 to-amber-600/10',
  quadriceps: 'from-emerald-500/20 to-emerald-600/10',
  hamstrings: 'from-emerald-500/20 to-emerald-600/10',
  glutes: 'from-emerald-500/20 to-emerald-600/10',
  calves: 'from-emerald-500/20 to-emerald-600/10',
  core: 'from-pink-500/20 to-pink-600/10',
  traps: 'from-blue-500/20 to-blue-600/10',
};

const getGradient = (muscle?: string | null) => {
  if (!muscle) return 'from-muted/30 to-muted/10';
  return MUSCLE_GRADIENTS[muscle.toLowerCase()] || 'from-muted/30 to-muted/10';
};

export function ExerciseImage({
  exerciseName,
  equipment,
  imageUrl,
  primaryMuscle,
  coachingCues,
  className,
  showPlaceholder = true,
  size = 'md',
  enableModal = true,
}: ExerciseImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const equipmentInfo = EQUIPMENT_INFO[equipment] || EQUIPMENT_INFO.other;
  const gradientClass = getGradient(primaryMuscle);
  const displayUrl = imageUrl;

  const sizeClasses = {
    sm: 'h-[60px] w-[60px]',
    md: 'h-[150px] w-full',
    lg: 'h-[200px] w-full',
  };

  // Image loaded successfully
  if (displayUrl && !imageError) {
    return (
      <>
        <div
          className={cn('relative overflow-hidden rounded-lg bg-muted/20 cursor-pointer group', sizeClasses[size], className)}
          onClick={() => enableModal && setModalOpen(true)}
        >
          {!imageLoaded && (
            <Skeleton className="absolute inset-0 rounded-lg" />
          )}
          <img
            src={displayUrl}
            alt={exerciseName}
            loading="lazy"
            className={cn(
              'w-full h-full object-cover transition-opacity duration-300',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
          {enableModal && imageLoaded && size !== 'sm' && (
            <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-background/70 rounded-md p-1">
              <Maximize2 className="h-3.5 w-3.5 text-foreground" />
            </div>
          )}
        </div>

        {enableModal && (
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{exerciseName}</DialogTitle>
                <DialogDescription>
                  {equipmentInfo.icon} {equipmentInfo.label}
                  {primaryMuscle && ` • ${primaryMuscle}`}
                </DialogDescription>
              </DialogHeader>
              <img
                src={displayUrl}
                alt={exerciseName}
                className="w-full rounded-lg object-contain max-h-[60vh]"
              />
              {coachingCues && (
                <p className="text-sm text-muted-foreground">💡 {coachingCues}</p>
              )}
            </DialogContent>
          </Dialog>
        )}
      </>
    );
  }

  // Placeholder fallback
  if (showPlaceholder) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-lg bg-gradient-to-br gap-1',
          gradientClass,
          sizeClasses[size],
          className
        )}
      >
        {size === 'sm' ? (
          <span className="text-xl">{equipmentInfo.icon}</span>
        ) : (
          <>
            <span className="text-3xl">{equipmentInfo.icon}</span>
            <p className="text-xs text-muted-foreground font-medium">{equipmentInfo.label}</p>
          </>
        )}
      </div>
    );
  }

  return null;
}
