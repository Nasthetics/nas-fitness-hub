import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  FRONT_MUSCLES,
  BACK_MUSCLES,
  BODY_OUTLINE_FRONT,
  BODY_OUTLINE_BACK,
  MUSCLE_COLORS,
  MUSCLE_GROUP_MAP,
} from './MusclePolygons';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

interface BodyDiagramProps {
  selectedMuscle?: string | null;
  onMuscleClick?: (muscleId: string, muscleName: string) => void;
  volumeData?: { muscleId: string; volume: number }[];
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  showLabels?: boolean;
  className?: string;
}

type MuscleData = {
  id: string;
  name: string;
  path: string;
  center: { x: number; y: number };
};

export function BodyDiagram({
  selectedMuscle,
  onMuscleClick,
  volumeData = [],
  size = 'md',
  interactive = true,
  showLabels = false,
  className,
}: BodyDiagramProps) {
  const [view, setView] = useState<'front' | 'back'>('front');
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null);

  const sizeClasses = {
    sm: 'w-32 h-48',
    md: 'w-48 h-72',
    lg: 'w-64 h-96',
  };

  const muscles = view === 'front' ? FRONT_MUSCLES : BACK_MUSCLES;
  const outline = view === 'front' ? BODY_OUTLINE_FRONT : BODY_OUTLINE_BACK;

  // Calculate opacity based on volume data
  const getVolumeOpacity = (muscleId: string) => {
    if (volumeData.length === 0) return 0.7;
    const data = volumeData.find((v) => v.muscleId.toLowerCase() === muscleId.toLowerCase());
    if (!data) return 0.3;
    const maxVolume = Math.max(...volumeData.map((v) => v.volume));
    return 0.3 + (data.volume / maxVolume) * 0.7;
  };

  const getMuscleStyle = (muscle: MuscleData) => {
    const isSelected = selectedMuscle?.toLowerCase() === muscle.id.toLowerCase();
    const isHovered = hoveredMuscle === muscle.id;
    const colors = MUSCLE_COLORS[muscle.id] || MUSCLE_COLORS.chest;
    const opacity = getVolumeOpacity(muscle.id);

    if (isSelected) {
      return {
        fill: colors.active,
        opacity: 1,
        stroke: 'hsl(var(--primary))',
        strokeWidth: 2,
        filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.5))',
      };
    }

    if (isHovered && interactive) {
      return {
        fill: colors.hover,
        opacity: 0.9,
        stroke: 'hsl(var(--foreground) / 0.3)',
        strokeWidth: 1,
      };
    }

    return {
      fill: colors.fill,
      opacity,
      stroke: 'hsl(var(--background) / 0.3)',
      strokeWidth: 0.5,
    };
  };

  const handleMuscleClick = (muscle: MuscleData) => {
    if (!interactive || !onMuscleClick) return;
    onMuscleClick(muscle.id, MUSCLE_GROUP_MAP[muscle.id] || muscle.name);
  };

  // Group muscles by their ID for unique selection
  const uniqueMuscleIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(muscles).forEach((m) => ids.add(m.id));
    return Array.from(ids);
  }, [muscles]);

  return (
    <TooltipProvider>
      <div className={cn('flex flex-col items-center gap-3', className)}>
        {/* View toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={view === 'front' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('front')}
            className="text-xs h-7"
          >
            Front
          </Button>
          <Button
            variant={view === 'back' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('back')}
            className="text-xs h-7"
          >
            Back
          </Button>
          {selectedMuscle && onMuscleClick && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMuscleClick('', '')}
              className="text-xs h-7"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* SVG Diagram */}
        <svg
          viewBox="0 0 200 350"
          className={cn(sizeClasses[size], 'transition-all duration-300')}
        >
          {/* Background glow */}
          <defs>
            <radialGradient id="bodyGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(var(--primary) / 0.1)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <filter id="muscleGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Body outline silhouette */}
          <path
            d={outline}
            fill="hsl(var(--muted) / 0.3)"
            stroke="hsl(var(--border))"
            strokeWidth="1"
          />

          {/* Muscle groups */}
          {Object.entries(muscles).map(([key, muscle]) => {
            const style = getMuscleStyle(muscle);
            return (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <path
                    d={muscle.path}
                    fill={style.fill}
                    fillOpacity={style.opacity}
                    stroke={style.stroke}
                    strokeWidth={style.strokeWidth}
                    style={{ filter: style.filter }}
                    className={cn(
                      'transition-all duration-200',
                      interactive && 'cursor-pointer'
                    )}
                    onMouseEnter={() => interactive && setHoveredMuscle(muscle.id)}
                    onMouseLeave={() => setHoveredMuscle(null)}
                    onClick={() => handleMuscleClick(muscle)}
                  />
                </TooltipTrigger>
                {interactive && (
                  <TooltipContent side="right" className="bg-card border-border">
                    <p className="font-medium">{muscle.name}</p>
                    <p className="text-xs text-muted-foreground">Click to filter</p>
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}

          {/* Head placeholder */}
          <ellipse
            cx="100"
            cy="35"
            rx="18"
            ry="22"
            fill="hsl(var(--muted) / 0.4)"
            stroke="hsl(var(--border))"
            strokeWidth="0.5"
          />
        </svg>

        {/* Legend */}
        {showLabels && (
          <div className="flex flex-wrap justify-center gap-2 max-w-xs">
            {uniqueMuscleIds.map((id) => {
              const colors = MUSCLE_COLORS[id];
              const name = MUSCLE_GROUP_MAP[id];
              const isSelected = selectedMuscle?.toLowerCase() === id;
              return (
                <button
                  key={id}
                  onClick={() => interactive && onMuscleClick?.(id, name)}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-all',
                    interactive && 'hover:bg-muted cursor-pointer',
                    isSelected && 'ring-1 ring-primary bg-primary/10'
                  )}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: colors?.fill }}
                  />
                  <span className="text-foreground">{name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
