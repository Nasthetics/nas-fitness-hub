import { useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, TrendingDown, Minus, Share2, ChevronRight, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import type { WorkoutLog } from '@/lib/types';

interface WorkoutSummaryProps {
  workout: WorkoutLog;
  elapsedSeconds: number;
  previousVolume?: number;
  onContinue: () => void;
}

export function WorkoutSummary({ workout, elapsedSeconds, previousVolume, onContinue }: WorkoutSummaryProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => {
    let totalVolume = 0;
    let totalSets = 0;
    const prs: { name: string; weight: number; reps: number }[] = [];
    const muscleGroups = new Set<string>();

    workout.exercise_logs?.forEach(el => {
      if (el.exercise?.primary_muscle_name) muscleGroups.add(el.exercise.primary_muscle_name);
      el.set_logs?.forEach(s => {
        if (s.weight_kg && s.reps) {
          totalVolume += s.weight_kg * s.reps;
          totalSets++;
        }
        if (s.is_pr) {
          prs.push({ name: el.exercise?.name || 'Exercise', weight: s.weight_kg || 0, reps: s.reps || 0 });
        }
      });
    });

    const exerciseCount = workout.exercise_logs?.length || 0;
    const estCalories = Math.round(totalVolume * 0.05);
    const volumeChange = previousVolume ? ((totalVolume - previousVolume) / previousVolume) * 100 : null;

    return { totalVolume, totalSets, prs, muscleGroups: Array.from(muscleGroups), exerciseCount, estCalories, volumeChange };
  }, [workout, previousVolume]);

  // Fire confetti if PRs
  useMemo(() => {
    if (stats.prs.length > 0) {
      setTimeout(() => {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      }, 300);
    }
  }, [stats.prs.length]);

  const hrs = Math.floor(elapsedSeconds / 3600);
  const mins = Math.floor((elapsedSeconds % 3600) / 60);
  const durationStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

  const motivational = useMemo(() => {
    if (stats.prs.length > 0) return "🏆 New PRs! You're getting stronger!";
    if (stats.volumeChange !== null && stats.volumeChange > 5) return "📈 Volume up! Great progressive overload.";
    if (stats.volumeChange !== null && stats.volumeChange < -10) return "💡 Lower volume today. Recovery is progress too.";
    return "💪 Solid session. Consistency is key.";
  }, [stats]);

  const handleShare = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: '#141414', scale: 2 });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'workout-summary.png', { type: 'image/png' });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Workout Summary' });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'workout-summary.png';
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    } catch (e) {
      console.error('Share error:', e);
    }
  };

  const muscleColors: Record<string, string> = {
    Chest: 'bg-blue-500/20 text-blue-400',
    Back: 'bg-emerald-500/20 text-emerald-400',
    Shoulders: 'bg-purple-500/20 text-purple-400',
    Biceps: 'bg-pink-500/20 text-pink-400',
    Triceps: 'bg-amber-500/20 text-amber-400',
    Quadriceps: 'bg-green-500/20 text-green-400',
    Hamstrings: 'bg-orange-500/20 text-orange-400',
    Glutes: 'bg-red-500/20 text-red-400',
    Calves: 'bg-cyan-500/20 text-cyan-400',
    Core: 'bg-yellow-500/20 text-yellow-400',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: '#141414' }}>
      <div ref={cardRef} className="w-full max-w-md rounded-2xl p-6 space-y-5" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #141414 50%, #0f3460 100%)' }}>
        {/* Header */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Workout Complete</p>
          <h2 className="text-2xl font-bold text-foreground mt-1">
            {workout.template?.name || 'Quick Workout'}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-xl bg-card/50">
            <div className="text-xl font-bold text-foreground">{durationStr}</div>
            <div className="text-[10px] text-muted-foreground">Duration</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-card/50">
            <div className="text-xl font-bold text-foreground">{Math.round(stats.totalVolume).toLocaleString()}</div>
            <div className="text-[10px] text-muted-foreground">Volume (kg)</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-card/50">
            <div className="text-xl font-bold text-foreground">{stats.totalSets}</div>
            <div className="text-[10px] text-muted-foreground">Sets</div>
          </div>
        </div>

        {/* Volume comparison */}
        {stats.volumeChange !== null && (
          <div className="flex items-center justify-center gap-2 text-sm">
            {stats.volumeChange > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-400" />
            ) : stats.volumeChange < 0 ? (
              <TrendingDown className="h-4 w-4 text-red-400" />
            ) : (
              <Minus className="h-4 w-4 text-muted-foreground" />
            )}
            <span className={stats.volumeChange > 0 ? 'text-green-400' : stats.volumeChange < 0 ? 'text-red-400' : 'text-muted-foreground'}>
              {stats.volumeChange > 0 ? '+' : ''}{Math.round(stats.volumeChange)}% vs last session
            </span>
          </div>
        )}

        {/* PRs */}
        {stats.prs.length > 0 && (
          <div className="space-y-2">
            {stats.prs.map((pr, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <Trophy className="h-4 w-4 text-yellow-400 shrink-0" />
                <span className="text-sm font-medium text-yellow-400">
                  {pr.name}: {pr.weight}kg × {pr.reps}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Muscle groups */}
        {stats.muscleGroups.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {stats.muscleGroups.map(muscle => (
              <Badge key={muscle} className={muscleColors[muscle] || 'bg-muted text-muted-foreground'}>
                {muscle}
              </Badge>
            ))}
          </div>
        )}

        {/* Calories */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Flame className="h-4 w-4 text-orange-400" />
          ~{stats.estCalories} kcal burned (est.)
        </div>

        {/* Motivational */}
        <p className="text-center text-sm font-medium text-foreground">{motivational}</p>
      </div>

      {/* Buttons outside the card ref so they don't appear in screenshot */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3 px-6">
        <Button variant="outline" onClick={handleShare} className="flex-1 h-12 rounded-xl gap-2">
          <Share2 className="h-4 w-4" /> Share
        </Button>
        <Button onClick={onContinue} className="flex-1 h-12 rounded-xl gap-2 bg-primary hover:bg-primary/90">
          Continue <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
