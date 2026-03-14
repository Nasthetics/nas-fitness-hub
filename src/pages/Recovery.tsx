import { useState, useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { Heart, Brain, Zap, Wind, Moon, TrendingUp } from 'lucide-react';
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

function calculateRecoveryScore(sleep_hours: number, sleep_quality: number, energy: number, stress: number, breathwork: boolean): number {
  const sleepHoursScore = Math.min(sleep_hours / 8, 1) * 25;
  const sleepQualityScore = (sleep_quality / 5) * 25;
  const energyScore = (energy / 5) * 20;
  const stressScore = ((6 - stress) / 5) * 20;
  const breathworkScore = breathwork ? 10 : 0;
  return Math.round(sleepHoursScore + sleepQualityScore + energyScore + stressScore + breathworkScore);
}

function getScoreRecommendation(score: number) {
  if (score >= 85) return { label: 'Push Hard 💪', color: 'bg-green-500/20 text-green-400 border-green-500/30', desc: 'You\'re fully recovered. Hit it hard today!' };
  if (score >= 65) return { label: 'Normal Session', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', desc: 'Good recovery. Proceed with your planned workout.' };
  if (score >= 40) return { label: 'Reduce Volume 20%', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', desc: 'Moderate recovery. Drop a set from each exercise.' };
  return { label: 'Active Recovery Only', color: 'bg-red-500/20 text-red-400 border-red-500/30', desc: 'Low recovery. Light stretching, walking, or mobility work only.' };
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
      const score = calculateRecoveryScore(sleepHours, sleepQuality, energy, stress, breathwork);
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

  const currentScore = todayCheckin?.recovery_score || calculateRecoveryScore(sleepHours, sleepQuality, energy, stress, breathwork);
  const recommendation = getScoreRecommendation(currentScore);

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Recovery</h1>
        <p className="text-muted-foreground mt-1">Daily 10-second check-in</p>
      </div>

      {/* Score Display */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-primary/30">
          <CardContent className="pt-6 text-center">
            <div className="text-6xl font-bold text-primary mb-2">{currentScore}</div>
            <div className="text-sm text-muted-foreground mb-4">Recovery Score</div>
            <Badge className={recommendation.color}>{recommendation.label}</Badge>
            <p className="text-sm text-muted-foreground mt-3">{recommendation.desc}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-4xl font-bold mb-2">{avgScore}</div>
            <div className="text-sm text-muted-foreground">7-Day Average</div>
            <div className="text-xs text-muted-foreground mt-2">
              {checkins.filter(c => c.checkin_date >= sevenDaysAgo).length}/7 days logged
            </div>
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
                <Button
                  key={v}
                  variant={sleepQuality === v ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSleepQuality(v)}
                  className="flex-1"
                >
                  {v}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Zap className="h-4 w-4" /> Energy: {energy}/5
            </Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(v => (
                <Button
                  key={v}
                  variant={energy === v ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEnergy(v)}
                  className="flex-1"
                >
                  {v}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Brain className="h-4 w-4" /> Stress: {stress}/5
            </Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(v => (
                <Button
                  key={v}
                  variant={stress === v ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStress(v)}
                  className="flex-1"
                >
                  {v}
                </Button>
              ))}
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
