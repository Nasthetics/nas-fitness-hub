import { useMemo, useState } from 'react';
import { format, differenceInHours, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  FRONT_MUSCLES,
  BACK_MUSCLES,
  BODY_OUTLINE_FRONT,
  BODY_OUTLINE_BACK,
  MUSCLE_GROUP_MAP,
} from '@/components/anatomy/MusclePolygons';
import { Button } from '@/components/ui/button';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Activity } from 'lucide-react';

interface MuscleTrainingInfo {
  muscleId: string;
  lastTrainedDate: Date | null;
  lastExercise: string;
  hoursAgo: number;
  totalVolume: number;
  avgRIR: number | null;
}

function getRecoveryColor(hoursAgo: number | null): string {
  if (hoursAgo === null || hoursAgo > 168) return 'hsl(0, 0%, 40%)'; // grey
  if (hoursAgo >= 48) return 'hsl(142, 70%, 45%)'; // green
  if (hoursAgo >= 24) return 'hsl(48, 90%, 50%)'; // yellow
  return 'hsl(0, 70%, 55%)'; // red
}

function getRecoveryLabel(hoursAgo: number | null): string {
  if (hoursAgo === null || hoursAgo > 168) return 'Not trained this week';
  if (hoursAgo >= 48) return 'Recovered';
  if (hoursAgo >= 24) return 'Recovering';
  return 'Fresh / Fatigued';
}

function getRecoveryPercent(hoursAgo: number | null, avgRIR: number | null): number {
  if (hoursAgo === null || hoursAgo > 168) return 100;
  // Base recovery from time (48h = full recovery)
  const timeRecovery = Math.min(hoursAgo / 48, 1) * 80;
  // RIR bonus (higher RIR = less fatigue = faster recovery)
  const rirBonus = avgRIR !== null ? Math.min(avgRIR / 4, 1) * 20 : 10;
  return Math.round(timeRecovery + rirBonus);
}

export function MuscleHeatmap() {
  const { user } = useAuth();
  const [view, setView] = useState<'front' | 'back'>('front');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleTrainingInfo | null>(null);

  const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');

  const { data: recentWorkouts = [] } = useQuery({
    queryKey: ['muscle-heatmap', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('workout_logs')
        .select(`
          workout_date, created_at,
          exercise_logs(
            exercise:exercise_library(name, primary_muscle),
            set_logs(weight_kg, reps, rir)
          )
        `)
        .eq('user_id', user.id)
        .gte('workout_date', sevenDaysAgo)
        .order('workout_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: muscleGroups = [] } = useQuery({
    queryKey: ['muscle-groups-for-heatmap'],
    queryFn: async () => {
      const { data } = await supabase.from('muscle_groups').select('id, name');
      return data || [];
    },
  });

  const muscleIdToName = useMemo(() => {
    const map: Record<string, string> = {};
    muscleGroups.forEach((mg: any) => { map[mg.id] = mg.name.toLowerCase(); });
    return map;
  }, [muscleGroups]);

  // Build muscle training info
  const muscleInfo = useMemo(() => {
    const info: Record<string, MuscleTrainingInfo> = {};
    const allMuscleIds = Object.keys(MUSCLE_GROUP_MAP);
    allMuscleIds.forEach(id => {
      info[id] = { muscleId: id, lastTrainedDate: null, lastExercise: '', hoursAgo: 999, totalVolume: 0, avgRIR: null };
    });

    const now = new Date();
    const rirValues: Record<string, number[]> = {};

    recentWorkouts.forEach((w: any) => {
      const workoutDate = new Date(w.workout_date + 'T12:00:00');
      w.exercise_logs?.forEach((el: any) => {
        const dbMuscleId = el.exercise?.primary_muscle;
        if (!dbMuscleId) return;
        const muscleName = muscleIdToName[dbMuscleId];
        if (!muscleName) return;

        // Map db muscle name to our SVG muscle id
        const svgId = muscleName;
        if (!info[svgId]) return;

        const hours = differenceInHours(now, workoutDate);
        if (!info[svgId].lastTrainedDate || workoutDate > info[svgId].lastTrainedDate!) {
          info[svgId].lastTrainedDate = workoutDate;
          info[svgId].lastExercise = el.exercise?.name || '';
          info[svgId].hoursAgo = hours;
        }

        el.set_logs?.forEach((s: any) => {
          if (s.weight_kg && s.reps) info[svgId].totalVolume += s.weight_kg * s.reps;
          if (s.rir != null) {
            if (!rirValues[svgId]) rirValues[svgId] = [];
            rirValues[svgId].push(s.rir);
          }
        });
      });
    });

    Object.keys(rirValues).forEach(id => {
      const vals = rirValues[id];
      info[id].avgRIR = vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
    });

    return info;
  }, [recentWorkouts, muscleIdToName]);

  const muscles = view === 'front' ? FRONT_MUSCLES : BACK_MUSCLES;
  const outline = view === 'front' ? BODY_OUTLINE_FRONT : BODY_OUTLINE_BACK;

  const handleMuscleClick = (muscleId: string) => {
    const mi = muscleInfo[muscleId];
    if (mi) setSelectedMuscle(mi);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Muscle Recovery Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            {/* View toggle */}
            <div className="flex items-center gap-2">
              <Button variant={view === 'front' ? 'default' : 'outline'} size="sm" onClick={() => setView('front')} className="text-xs h-7">Front</Button>
              <Button variant={view === 'back' ? 'default' : 'outline'} size="sm" onClick={() => setView('back')} className="text-xs h-7">Back</Button>
            </div>

            {/* SVG */}
            <svg viewBox="0 0 200 350" className="w-48 h-72">
              <defs>
                <filter id="heatGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path d={outline} fill="hsl(var(--muted) / 0.3)" stroke="hsl(var(--border))" strokeWidth="1" />
              {Object.entries(muscles).map(([key, muscle]) => {
                const mi = muscleInfo[muscle.id];
                const color = getRecoveryColor(mi?.lastTrainedDate ? mi.hoursAgo : null);
                return (
                  <path
                    key={key}
                    d={muscle.path}
                    fill={color}
                    fillOpacity={0.8}
                    stroke="hsl(var(--background) / 0.4)"
                    strokeWidth={0.5}
                    className="cursor-pointer transition-all duration-200 hover:opacity-100"
                    onClick={() => handleMuscleClick(muscle.id)}
                  />
                );
              })}
              <ellipse cx="100" cy="35" rx="18" ry="22" fill="hsl(var(--muted) / 0.4)" stroke="hsl(var(--border))" strokeWidth="0.5" />
            </svg>

            {/* Legend */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(0, 0%, 40%)' }} /><span className="text-muted-foreground">Not trained</span></div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(142, 70%, 45%)' }} /><span className="text-muted-foreground">Recovered</span></div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(48, 90%, 50%)' }} /><span className="text-muted-foreground">Recovering</span></div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(0, 70%, 55%)' }} /><span className="text-muted-foreground">Fresh</span></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Muscle Detail Sheet */}
      <Sheet open={!!selectedMuscle} onOpenChange={() => setSelectedMuscle(null)}>
        <SheetContent side="bottom" className="h-[40vh]">
          <SheetHeader>
            <SheetTitle>{MUSCLE_GROUP_MAP[selectedMuscle?.muscleId || ''] || 'Muscle'}</SheetTitle>
          </SheetHeader>
          {selectedMuscle && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={
                    selectedMuscle.hoursAgo < 24 ? 'bg-red-500/20 text-red-400' :
                    selectedMuscle.hoursAgo < 48 ? 'bg-yellow-500/20 text-yellow-400' :
                    selectedMuscle.hoursAgo < 168 ? 'bg-green-500/20 text-green-400' :
                    'bg-muted text-muted-foreground'
                  }>
                    {getRecoveryLabel(selectedMuscle.lastTrainedDate ? selectedMuscle.hoursAgo : null)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Recovery</p>
                  <p className="text-2xl font-bold">
                    {getRecoveryPercent(selectedMuscle.lastTrainedDate ? selectedMuscle.hoursAgo : null, selectedMuscle.avgRIR)}%
                  </p>
                </div>
              </div>
              {selectedMuscle.lastTrainedDate && (
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Last Exercise</p>
                    <p className="font-medium">{selectedMuscle.lastExercise}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Trained</p>
                    <p className="text-sm">{format(selectedMuscle.lastTrainedDate, 'EEE, MMM d')} ({Math.round(selectedMuscle.hoursAgo)}h ago)</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Week Volume</p>
                    <p className="text-sm">{Math.round(selectedMuscle.totalVolume).toLocaleString()} kg</p>
                  </div>
                  {selectedMuscle.avgRIR !== null && (
                    <div>
                      <p className="text-sm text-muted-foreground">Avg RIR</p>
                      <p className="text-sm">{selectedMuscle.avgRIR}</p>
                    </div>
                  )}
                </div>
              )}
              {!selectedMuscle.lastTrainedDate && (
                <p className="text-muted-foreground">Not trained this week</p>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}