import { useState, useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { Heart, Brain, Zap, Wind, Moon, TrendingUp, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MuscleHeatmap } from '@/components/recovery/MuscleHeatmap';

interface RecoveryCheckin {
  id: string;
  user_id: string;
  checkin_date: string;
  sleep_hours: number | null;
  sleep_quality: number | null;
  energy: number | null;
  stress: number | null;
  breathwork_done: boolean;
  recovery_score: number | null;
  created_at: string;
}

function calculateRecoveryScore(
  sleepHours: number, sleepQuality: number, energy: number, stress: number, 
  breathwork: boolean, hrv?: number | null, rhr?: number | null
): number {
  // Normalize each component to 0-100
  const sleepScore = Math.min(sleepHours / 8, 1) * 100;
  const sleepQualScore = (sleepQuality / 5) * 100;
  const energyScore = (energy / 5) * 100;
  const sorenessScore = ((6 - stress) / 5) * 100; // Inverted stress as soreness
  const breathworkBonus = breathwork ? 5 : 0;

  const hasHRV = hrv != null && hrv > 0;
  const hasRHR = rhr != null && rhr > 0;

  // HRV score: <20ms = 0, >80ms = 100
  const hrvScore = hasHRV ? Math.min(Math.max((hrv! - 20) / 60, 0), 1) * 100 : 0;
  // RHR score: >80 = 0, <50 = 100
  const rhrScore = hasRHR ? Math.min(Math.max((80 - rhr!) / 30, 0), 1) * 100 : 0;

  let score: number;
  if (hasHRV && hasRHR) {
    // Full composite: HRV 30%, Sleep 30%, RHR 15%, Energy 15%, Soreness 10%
    score = hrvScore * 0.3 + sleepQualScore * 0.3 + rhrScore * 0.15 + energyScore * 0.15 + sorenessScore * 0.1;
  } else if (hasHRV) {
    // HRV 25%, Sleep 35%, Energy 25%, Soreness 15%
    score = hrvScore * 0.25 + sleepQualScore * 0.35 + energyScore * 0.25 + sorenessScore * 0.15;
  } else if (hasRHR) {
    // RHR 15%, Sleep 40%, Energy 25%, Soreness 20%
    score = rhrScore * 0.15 + sleepQualScore * 0.4 + energyScore * 0.25 + sorenessScore * 0.2;
  } else {
    // No HRV/RHR: Sleep 40%, Energy 30%, Soreness 20%, Sleep hours 10%
    score = sleepQualScore * 0.4 + energyScore * 0.3 + sorenessScore * 0.2 + (sleepScore * 0.1);
  }

  return Math.round(Math.min(score + breathworkBonus, 100));
}

function getScoreRecommendation(score: number) {
  if (score > 67) return { label: 'Train Hard 💪', color: 'bg-green-500/20 text-green-400 border-green-500/30', badge: 'bg-green-500', desc: 'You\'re fully recovered. Hit it hard today!' };
  if (score >= 34) return { label: 'Train Moderate', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', badge: 'bg-amber-500', desc: 'Moderate recovery. Standard session, watch volume.' };
  return { label: 'Rest / Deload', color: 'bg-red-500/20 text-red-400 border-red-500/30', badge: 'bg-red-500', desc: 'Low recovery. Light stretching, walking, or mobility work only.' };
}

export default function Recovery() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [sleepHours, setSleepHours] = useState(7);
  const [sleepQuality, setSleepQuality] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [stress, setStress] = useState(3);
  const [breathwork, setBreathwork] = useState(false);
  const [hrv, setHrv] = useState('');
  const [rhr, setRhr] = useState('');

  const today = format(new Date(), 'yyyy-MM-dd');
  const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');

  const { data: checkins = [] } = useQuery({
    queryKey: ['recovery-checkins', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('recovery_checkins')
        .select('*')
        .eq('user_id', user.id)
        .gte('checkin_date', format(subDays(new Date(), 30), 'yyyy-MM-dd'))
        .order('checkin_date', { ascending: false });
      if (error) throw error;
      return data as RecoveryCheckin[];
    },
    enabled: !!user,
  });

  const todayCheckin = checkins.find(c => c.checkin_date === today);

  const submitCheckin = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const hrvVal = hrv ? parseFloat(hrv) : null;
      const rhrVal = rhr ? parseFloat(rhr) : null;
      const score = calculateRecoveryScore(sleepHours, sleepQuality, energy, stress, breathwork, hrvVal, rhrVal);
      const { error } = await supabase
        .from('recovery_checkins')
        .upsert({
          user_id: user.id,
          checkin_date: today,
          sleep_hours: sleepHours,
          sleep_quality: sleepQuality,
          energy,
          stress,
          breathwork_done: breathwork,
          recovery_score: score,
        }, { onConflict: 'user_id,checkin_date' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recovery-checkins'] });
      toast({ title: 'Recovery check-in saved! ✅' });
    },
  });

  const chartData = useMemo(() => {
    return checkins
      .filter(c => c.checkin_date >= sevenDaysAgo)
      .map(c => ({
        date: format(new Date(c.checkin_date), 'EEE'),
        score: c.recovery_score || 0,
        sleep: c.sleep_hours || 0,
      }))
      .reverse();
  }, [checkins, sevenDaysAgo]);

  const avgScore = useMemo(() => {
    const recent = checkins.filter(c => c.checkin_date >= sevenDaysAgo);
    if (recent.length === 0) return 0;
    return Math.round(recent.reduce((sum, c) => sum + (c.recovery_score || 0), 0) / recent.length);
  }, [checkins, sevenDaysAgo]);

  const hrvVal = hrv ? parseFloat(hrv) : null;
  const rhrVal = rhr ? parseFloat(rhr) : null;
  const currentScore = todayCheckin?.recovery_score || calculateRecoveryScore(sleepHours, sleepQuality, energy, stress, breathwork, hrvVal, rhrVal);
  const recommendation = getScoreRecommendation(currentScore);

  // Traffic light
  const trafficLight = currentScore > 67 ? 'bg-green-500' : currentScore >= 34 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Recovery</h1>
        <p className="text-muted-foreground mt-1">Daily 10-second check-in</p>
      </div>
      
      <MuscleHeatmap />

      {/* Score Display */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-primary/30">
          <CardContent className="pt-6 text-center">
            <div className="text-6xl font-bold text-primary mb-2">{currentScore}</div>
            <div className="text-sm text-muted-foreground mb-3">Recovery Score</div>
            {/* Traffic light */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className={`w-3 h-3 rounded-full ${currentScore > 67 ? 'bg-green-500' : 'bg-muted'}`} />
              <div className={`w-3 h-3 rounded-full ${currentScore >= 34 && currentScore <= 67 ? 'bg-amber-500' : 'bg-muted'}`} />
              <div className={`w-3 h-3 rounded-full ${currentScore < 34 ? 'bg-red-500' : 'bg-muted'}`} />
            </div>
            <Badge className={recommendation.color}>{recommendation.label}</Badge>
            <p className="text-sm text-muted-foreground mt-3">{recommendation.desc}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center mb-4">
              <div className="text-4xl font-bold">{avgScore}</div>
              <div className="text-sm text-muted-foreground">7-Day Average</div>
              <div className="text-xs text-muted-foreground mt-1">
                {checkins.filter(c => c.checkin_date >= sevenDaysAgo).length}/7 days logged
              </div>
            </div>
            {/* Sparkline */}
            {chartData.length > 1 && (
              <div className="h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Check-in Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            {todayCheckin ? 'Update Today\'s Check-in' : 'Quick Check-in'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Moon className="h-4 w-4" /> Sleep Hours: {sleepHours}h
            </Label>
            <Slider
              value={[sleepHours]}
              onValueChange={([v]) => setSleepHours(v)}
              min={3}
              max={12}
              step={0.5}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Moon className="h-4 w-4" /> Sleep Quality: {sleepQuality}/5
            </Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(v => (
                <Button key={v} variant={sleepQuality === v ? 'default' : 'outline'} size="sm" onClick={() => setSleepQuality(v)} className="flex-1">{v}</Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Zap className="h-4 w-4" /> Energy: {energy}/5
            </Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(v => (
                <Button key={v} variant={energy === v ? 'default' : 'outline'} size="sm" onClick={() => setEnergy(v)} className="flex-1">{v}</Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Brain className="h-4 w-4" /> Stress / Soreness: {stress}/5
            </Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(v => (
                <Button key={v} variant={stress === v ? 'default' : 'outline'} size="sm" onClick={() => setStress(v)} className="flex-1">{v}</Button>
              ))}
            </div>
          </div>

          {/* HRV & RHR optional fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4" /> HRV (ms)
              </Label>
              <Input
                type="number"
                placeholder="e.g. 65"
                value={hrv}
                onChange={(e) => setHrv(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">Optional — from WHOOP/Garmin</p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Heart className="h-4 w-4" /> RHR (bpm)
              </Label>
              <Input
                type="number"
                placeholder="e.g. 52"
                value={rhr}
                onChange={(e) => setRhr(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">Optional — resting heart rate</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={breathwork} onCheckedChange={setBreathwork} />
            <Label className="flex items-center gap-2">
              <Wind className="h-4 w-4" /> Breathwork done
            </Label>
          </div>

          <Button
            className="w-full"
            onClick={() => submitCheckin.mutate()}
            disabled={submitCheckin.isPending}
          >
            {todayCheckin ? 'Update Check-in' : 'Submit Check-in'}
          </Button>
        </CardContent>
      </Card>

      {/* 7-Day Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> 7-Day Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} name="Score" />
                <Line type="monotone" dataKey="sleep" stroke="#3b82f6" strokeWidth={1} strokeDasharray="5 5" name="Sleep (hrs)" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground">
              No check-in data yet. Start your daily check-ins!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
