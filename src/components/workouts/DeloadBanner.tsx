import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, subWeeks, startOfWeek, endOfWeek } from 'date-fns';

interface DeloadBannerProps {
  onStartDeload?: () => void;
}

export function DeloadBanner({ onStartDeload }: DeloadBannerProps) {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  // Check if dismissed within last 7 days
  useEffect(() => {
    const dismissedAt = localStorage.getItem('deload-dismissed-at');
    if (dismissedAt) {
      const diff = Date.now() - parseInt(dismissedAt);
      if (diff < 7 * 24 * 60 * 60 * 1000) setDismissed(true);
    }
  }, []);

  // Check for active deload
  const deloadEndStr = localStorage.getItem('deload-end-date');
  const isInDeload = deloadEndStr && new Date(deloadEndStr) > new Date();
  const deloadEnded = deloadEndStr && new Date(deloadEndStr) <= new Date() && 
    (Date.now() - new Date(deloadEndStr).getTime()) < 3 * 24 * 60 * 60 * 1000;

  // Fetch recovery checkins (7 days)
  const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
  const { data: recoveryCheckins = [] } = useQuery({
    queryKey: ['recovery-deload-check', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from('recovery_checkins')
        .select('recovery_score, checkin_date')
        .eq('user_id', user.id)
        .gte('checkin_date', format(subDays(new Date(), 7), 'yyyy-MM-dd'));
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch workout logs (4 weeks)
  const fourWeeksAgo = format(subWeeks(new Date(), 4), 'yyyy-MM-dd');
  const { data: recentWorkouts = [] } = useQuery({
    queryKey: ['workout-deload-check', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from('workout_logs')
        .select(`*, exercise_logs(*, set_logs(*))`)
        .eq('user_id', user.id)
        .gte('workout_date', fourWeeksAgo)
        .eq('completed', true);
      return data || [];
    },
    enabled: !!user,
  });

  const signals = useMemo(() => {
    const flags: string[] = [];

    // Signal A: RIR trend drop
    const thisWeekSets = recentWorkouts
      .filter(w => new Date(w.workout_date) >= subDays(new Date(), 7))
      .flatMap(w => w.exercise_logs?.flatMap((el: any) => el.set_logs || []) || []);
    const threeWeeksAgoSets = recentWorkouts
      .filter(w => {
        const d = new Date(w.workout_date);
        return d >= subWeeks(new Date(), 4) && d < subWeeks(new Date(), 3);
      })
      .flatMap(w => w.exercise_logs?.flatMap((el: any) => el.set_logs || []) || []);

    const avgRirNow = thisWeekSets.filter((s: any) => s.rir != null).length > 0
      ? thisWeekSets.filter((s: any) => s.rir != null).reduce((sum: number, s: any) => sum + s.rir, 0) / thisWeekSets.filter((s: any) => s.rir != null).length
      : null;
    const avgRirThen = threeWeeksAgoSets.filter((s: any) => s.rir != null).length > 0
      ? threeWeeksAgoSets.filter((s: any) => s.rir != null).reduce((sum: number, s: any) => sum + s.rir, 0) / threeWeeksAgoSets.filter((s: any) => s.rir != null).length
      : null;

    if (avgRirNow !== null && avgRirThen !== null && avgRirThen - avgRirNow > 1.5) {
      flags.push('RIR dropped significantly');
    }

    // Signal B: Recovery score avg < 45
    if (recoveryCheckins.length >= 3) {
      const avgRecovery = recoveryCheckins.reduce((s, c) => s + (c.recovery_score || 0), 0) / recoveryCheckins.length;
      if (avgRecovery < 45) flags.push('Low recovery scores');
    }

    // Signal C: Volume drop >20% from peak
    const weeklyVolumes: number[] = [];
    for (let i = 0; i < 4; i++) {
      const weekWorkouts = recentWorkouts.filter(w => {
        const d = new Date(w.workout_date);
        return d >= subWeeks(new Date(), i + 1) && d < subWeeks(new Date(), i);
      });
      const vol = weekWorkouts.reduce((total, w) => {
        return total + (w.exercise_logs?.reduce((eTotal: number, el: any) => {
          return eTotal + (el.set_logs?.reduce((sTotal: number, s: any) => {
            return sTotal + ((s.weight_kg || 0) * (s.reps || 0));
          }, 0) || 0);
        }, 0) || 0);
      }, 0);
      weeklyVolumes.push(vol);
    }

    const peakVolume = Math.max(...weeklyVolumes.slice(1)); // exclude current week
    const currentVolume = weeklyVolumes[0];
    if (peakVolume > 0 && currentVolume > 0 && currentVolume < peakVolume * 0.8) {
      flags.push('Volume dropped >20%');
    }

    // Signal D: Frequency drop
    const thisWeekCount = recentWorkouts.filter(w => new Date(w.workout_date) >= subDays(new Date(), 7)).length;
    if (thisWeekCount < 3) {
      flags.push('Fewer than 3 workouts this week');
    }

    return flags;
  }, [recentWorkouts, recoveryCheckins]);

  const handleDismiss = () => {
    localStorage.setItem('deload-dismissed-at', String(Date.now()));
    setDismissed(true);
  };

  const handleStartDeload = () => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    localStorage.setItem('deload-end-date', endDate.toISOString());
    onStartDeload?.();
    setDismissed(true);
  };

  // Show supercompensation banner
  if (deloadEnded) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="py-4 flex items-center gap-3">
          <Check className="h-5 w-5 text-green-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-400">Supercompensation Window Active 🚀</p>
            <p className="text-xs text-muted-foreground">Deload complete. Great time for PRs!</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => localStorage.removeItem('deload-end-date')}>
            <X className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show active deload
  if (isInDeload) {
    const daysLeft = Math.ceil((new Date(deloadEndStr!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return (
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="py-4 flex items-center gap-3">
          <Badge className="bg-blue-500/20 text-blue-400">DELOAD</Badge>
          <div className="flex-1">
            <p className="text-sm font-medium">Deload Week Active</p>
            <p className="text-xs text-muted-foreground">{daysLeft} days remaining — weights at 50%, sets at 60%</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show warning if 2+ signals and not dismissed
  if (signals.length >= 2 && !dismissed) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="py-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-400">Deload Recommended</p>
              <p className="text-xs text-muted-foreground">{signals.length} fatigue signals detected</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {signals.map(s => (
              <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleStartDeload} className="flex-1">Start Deload Week</Button>
            <Button size="sm" variant="outline" onClick={handleDismiss}>Dismiss 7d</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
