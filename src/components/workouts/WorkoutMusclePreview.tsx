import { WORKOUT_DAY_INFO, type WorkoutDayType } from '@/lib/types';
import { BodyDiagram } from '@/components/anatomy/BodyDiagram';
import { Badge } from '@/components/ui/badge';

interface WorkoutMusclePreviewProps {
  dayType: WorkoutDayType;
  className?: string;
}

export function WorkoutMusclePreview({ dayType, className }: WorkoutMusclePreviewProps) {
  const info = WORKOUT_DAY_INFO[dayType];
  
  if (dayType === 'rest') return null;

  // Create volume data to highlight targeted muscles
  const volumeData = info.muscles.map(muscle => ({
    muscleId: muscle.toLowerCase(),
    volume: 100, // Full highlight for all targeted muscles
  }));

  return (
    <div className={className}>
      <div className="flex items-start gap-4">
        <BodyDiagram
          size="sm"
          interactive={false}
          volumeData={volumeData}
          showLabels={false}
        />
        <div className="flex-1">
          <h3 className="font-semibold text-sm text-muted-foreground mb-2">Today's Focus</h3>
          <div className="flex flex-wrap gap-1.5">
            {info.muscles.map(muscle => (
              <Badge 
                key={muscle} 
                variant="outline" 
                className="text-xs"
              >
                {muscle}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
