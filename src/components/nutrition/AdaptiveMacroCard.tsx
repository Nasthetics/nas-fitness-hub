import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBodyMetrics, useProfile, useUpdateProfile, useCreateBodyMetric } from '@/hooks/use-fitness-data';
import { format, subDays, isMonday, startOfDay } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';

export function AdaptiveMacroCard() {
  const { data: metrics = [] } = useBodyMetrics(60);
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const createBodyMetric = useCreateBodyMetric();
  
  const [showChart, setShowChart] = useState(false);
  const [weighInValue, setWeighInValue] = useState('');
  const [showWeighIn, setShowWeighIn] = useState(false);

  const today = new Date();
  const isMondayToday = isMonday(today);
  const todayStr = format(today, 'yyyy-MM-dd');
  const hasLoggedToday = metrics.some(m => m.recorded_date === todayStr && m.weight_kg);

  // Show Monday prompt
  const shouldPromptWeighIn = isMondayToday && !hasLoggedToday;

  const analysis = useMemo(() => {
    const now = new Date();
    const weightEntries = metrics
      .filter(m => m.weight_kg)
      .sort((a, b) => new Date(a.recorded_date).getTime() - new Date(b.recorded_date).getTime());

    if (weightEntries.length < 4) return null;

    // Calculate rolling 7-day averages for last 2 weeks
    const getWeekAvg = (endDate: Date, daysBack: number) => {
      const start = subDays(endDate, daysBack);
      const end = subDays(endDate, daysBack - 7);
      const entries = weightEntries.filter(m => {
        const d = new Date(m.recorded_date);
        return d >= start && d < end;
      });
      if (entries.length === 0) return null;
      return entries.reduce((s, m) => s + (m.weight_kg || 0), 0) / entries.length;
    };

    const thisWeekAvg = getWeekAvg(now, 0);
    const lastWeekAvg = getWeekAvg(now, 7);
    const twoWeeksAgoAvg = getWeekAvg(now, 14);

    if (!thisWeekAvg || !lastWeekAvg) return null;

    const weeklyChange = thisWeekAvg - lastWeekAvg;
    const prevWeeklyChange = twoWeeksAgoAvg ? lastWeekAvg - twoWeeksAgoAvg : null;
    const targetRate = profile?.target_weight_gain_per_week || 0.3;
    const currentCal = profile?.training_day_calories || 2556;

    // Consecutive week logic
    const consecutiveFast = prevWeeklyChange !== null && weeklyChange > 0.5 && prevWeeklyChange > 0.5;
    const consecutiveSlow = prevWeeklyChange !== null && weeklyChange < 0.1 && prevWeeklyChange < 0.1;

    let suggestion = '';
    let adjustCal = 0;
    if (consecutiveFast) {
      suggestion = 'Gaining too fast for 2+ weeks. Reduce calories.';
      adjustCal = -175;
    } else if (weeklyChange > 0.5) {
      suggestion = 'Gaining fast this week. Monitor next week.';
      adjustCal = -100;
    } else if (consecutiveSlow) {
      suggestion = 'Gaining too slowly for 2+ weeks. Increase calories.';
      adjustCal = 125;
    } else if (weeklyChange < 0.1) {
      suggestion = 'Slow gain this week. Monitor next week.';
      adjustCal = 75;
    } else {
      suggestion = 'On track! Keep current intake.';
    }

    const estimatedTDEE = currentCal + adjustCal;

    return {
      thisWeekAvg: Math.round(thisWeekAvg * 10) / 10,
      lastWeekAvg: Math.round(lastWeekAvg * 10) / 10,
      weeklyChange: Math.round(weeklyChange * 100) / 100,
      targetRate,
      suggestion,
      adjustCal,
      estimatedTDEE,
      dataPoints: weightEntries.length,
    };
  }, [metrics, profile]);

  // 6-week chart data
  const chartData = useMemo(() => {
    const sixWeeksAgo = subDays(new Date(), 42);
    const entries = metrics
      .filter(m => m.weight_kg && new Date(m.recorded_date) >= sixWeeksAgo)
      .sort((a, b) => new Date(a.recorded_date).getTime() - new Date(b.recorded_date).getTime());

    if (entries.length < 2) return [];

    // Calculate rolling average
    return entries.map((entry, i) => {
      const date = new Date(entry.recorded_date);
      const weekEntries = entries.filter(e => {
        const d = new Date(e.recorded_date);
        return d >= subDays(date, 3) && d <= date;
      });
      const avg = weekEntries.reduce((s, e) => s + (e.weight_kg || 0), 0) / weekEntries.length;

      // Target line: project from first entry
      const firstWeight = entries[0].weight_kg || 0;
      const daysSinceStart = (date.getTime() - new Date(entries[0].recorded_date).getTime()) / (1000 * 60 * 60 * 24);
      const targetWeight = firstWeight + (profile?.target_weight_gain_per_week || 0.3) * (daysSinceStart / 7);

      return {
        date: format(date, 'MMM d'),
        weight: entry.weight_kg,
        avg: Math.round(avg * 10) / 10,
        target: Math.round(targetWeight * 10) / 10,
      };
    });
  }, [metrics, profile]);

  const handleWeighIn = async () => {
    const weight = parseFloat(weighInValue);
    if (isNaN(weight) || weight < 30 || weight > 300) return;
    await createBodyMetric.mutateAsync({
      recorded_date: todayStr,
      weight_kg: weight,
    } as any);
    setWeighInValue('');
    setShowWeighIn(false);
  };

  const handleApplySuggestion = async () => {
    if (!analysis || analysis.adjustCal === 0) return;
    const newCal = (profile?.training_day_calories || 2556) + analysis.adjustCal;
    await updateProfile.mutateAsync({
      training_day_calories: Math.round(newCal),
    } as any);
  };

  // Monday weigh-in prompt
  if (shouldPromptWeighIn || showWeighIn) {
    return (
      <Card className="border-primary/50 ring-1 ring-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Weekly Weigh-In
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            It's Monday! Log your weight for accurate trend tracking.
          </p>
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.1"
              placeholder="e.g. 95.2"
              value={weighInValue}
              onChange={(e) => setWeighInValue(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleWeighIn} disabled={createBodyMetric.isPending}>
              Log
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Adaptive Macro Engine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Log at least 2 weeks of weigh-ins to see weight trend analysis and calorie suggestions.
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowWeighIn(true)}>
            Log Weight
          </Button>
        </CardContent>
      </Card>
    );
  }

  const Icon = analysis.weeklyChange > 0.5 ? TrendingUp : analysis.weeklyChange < 0.1 ? TrendingDown : Minus;
  const isOnTrack = analysis.adjustCal === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Adaptive Macro Engine
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-xs text-muted-foreground">Trend</div>
            <div className={`text-lg font-bold flex items-center justify-center gap-1 ${
              isOnTrack ? 'text-green-400' : 'text-amber-400'
            }`}>
              <Icon className="h-4 w-4" />
              {analysis.weeklyChange > 0 ? '+' : ''}{analysis.weeklyChange} kg/wk
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Target</div>
            <div className="text-lg font-bold text-primary">+{analysis.targetRate} kg/wk</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Est. TDEE</div>
            <div className="text-lg font-bold">{analysis.estimatedTDEE}</div>
          </div>
        </div>

        {/* Suggestion */}
        <div className={`p-3 rounded-lg ${isOnTrack ? 'bg-green-500/10 border border-green-500/30' : 'bg-amber-500/10 border border-amber-500/30'}`}>
          <div className="flex items-center gap-2">
            {isOnTrack ? (
              <Check className="h-4 w-4 text-green-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            )}
            <span className="text-sm font-medium">{analysis.suggestion}</span>
          </div>
          {analysis.adjustCal !== 0 && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">
                {analysis.adjustCal > 0 ? '+' : ''}{analysis.adjustCal} kcal/day
              </Badge>
              <Button size="sm" variant="outline" onClick={handleApplySuggestion} disabled={updateProfile.isPending}>
                Apply
              </Button>
            </div>
          )}
        </div>

        {/* Weigh-in button */}
        <Button variant="outline" size="sm" className="w-full" onClick={() => setShowWeighIn(true)}>
          Log Today's Weight
        </Button>

        {/* Chart toggle */}
        {chartData.length > 2 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setShowChart(!showChart)}
            >
              {showChart ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
              6-Week Trend
            </Button>

            {showChart && (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Line type="monotone" dataKey="weight" stroke="hsl(var(--muted-foreground))" strokeWidth={1} dot={{ r: 2 }} name="Actual" />
                    <Line type="monotone" dataKey="avg" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Rolling Avg" />
                    <Line type="monotone" dataKey="target" stroke="#22c55e" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Target" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
