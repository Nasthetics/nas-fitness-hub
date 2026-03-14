import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBodyMetrics, useProfile } from '@/hooks/use-fitness-data';
import { format, subDays } from 'date-fns';

export function AdaptiveMacroCard() {
  const { data: metrics = [] } = useBodyMetrics(30);
  const { data: profile } = useProfile();

  const analysis = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = subDays(now, 7);
    const twoWeeksAgo = subDays(now, 14);

    const thisWeek = metrics.filter(m => 
      m.weight_kg && new Date(m.recorded_date) >= oneWeekAgo
    );
    const lastWeek = metrics.filter(m => 
      m.weight_kg && new Date(m.recorded_date) >= twoWeeksAgo && new Date(m.recorded_date) < oneWeekAgo
    );

    if (thisWeek.length === 0 || lastWeek.length === 0) return null;

    const thisWeekAvg = thisWeek.reduce((s, m) => s + (m.weight_kg || 0), 0) / thisWeek.length;
    const lastWeekAvg = lastWeek.reduce((s, m) => s + (m.weight_kg || 0), 0) / lastWeek.length;
    const weeklyChange = thisWeekAvg - lastWeekAvg;
    const targetRate = profile?.target_weight_gain_per_week || 0.3;

    let suggestion = '';
    let adjustCal = 0;
    if (weeklyChange > 0.5) {
      suggestion = 'Gaining too fast. Consider reducing calories.';
      adjustCal = -150;
    } else if (weeklyChange < 0.2) {
      suggestion = 'Gaining too slowly. Consider increasing calories.';
      adjustCal = 150;
    } else {
      suggestion = 'On track! Keep current intake.';
    }

    return {
      thisWeekAvg: Math.round(thisWeekAvg * 10) / 10,
      lastWeekAvg: Math.round(lastWeekAvg * 10) / 10,
      weeklyChange: Math.round(weeklyChange * 100) / 100,
      targetRate,
      suggestion,
      adjustCal,
      dataPoints: thisWeek.length,
    };
  }, [metrics, profile]);

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
        </CardContent>
      </Card>
    );
  }

  const Icon = analysis.weeklyChange > 0.5 ? TrendingUp : analysis.weeklyChange < 0.2 ? TrendingDown : Minus;
  const changeColor = analysis.adjustCal < 0 ? 'text-amber-400' : analysis.adjustCal > 0 ? 'text-blue-400' : 'text-green-400';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Adaptive Macro Engine
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-sm text-muted-foreground">This Week Avg</div>
            <div className="text-xl font-bold">{analysis.thisWeekAvg} kg</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Weekly Δ</div>
            <div className={`text-xl font-bold flex items-center justify-center gap-1 ${changeColor}`}>
              <Icon className="h-4 w-4" />
              {analysis.weeklyChange > 0 ? '+' : ''}{analysis.weeklyChange} kg
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Target</div>
            <div className="text-xl font-bold text-primary">+{analysis.targetRate} kg/wk</div>
          </div>
        </div>

        <div className={`p-3 rounded-lg ${analysis.adjustCal !== 0 ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-green-500/10 border border-green-500/30'}`}>
          <div className="flex items-center gap-2">
            {analysis.adjustCal !== 0 && <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />}
            <span className="text-sm font-medium">{analysis.suggestion}</span>
          </div>
          {analysis.adjustCal !== 0 && (
            <Badge className="mt-2" variant="outline">
              Suggested: {analysis.adjustCal > 0 ? '+' : ''}{analysis.adjustCal} kcal/day
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
