import { useMemo } from 'react';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useBodyMetrics } from '@/hooks/use-fitness-data';

export function BulkQualityCard() {
  const { data: metrics = [] } = useBodyMetrics(90);

  const analysis = useMemo(() => {
    const withBF = metrics.filter(m => m.weight_kg && m.body_fat_percent);
    if (withBF.length < 2) return null;

    const latest = withBF[0];
    const oldest = withBF[withBF.length - 1];

    const latestLean = latest.weight_kg! * (1 - latest.body_fat_percent! / 100);
    const latestFat = latest.weight_kg! * (latest.body_fat_percent! / 100);
    const oldestLean = oldest.weight_kg! * (1 - oldest.body_fat_percent! / 100);
    const oldestFat = oldest.weight_kg! * (oldest.body_fat_percent! / 100);

    const totalGain = latest.weight_kg! - oldest.weight_kg!;
    const leanGain = latestLean - oldestLean;
    const fatGain = latestFat - oldestFat;

    const bulkQuality = totalGain > 0 ? (leanGain / totalGain) * 100 : 0;
    const bfTrending = latest.body_fat_percent! > 16;

    // 12-month projection
    const weeksBetween = Math.max(1, (new Date(latest.recorded_date).getTime() - new Date(oldest.recorded_date).getTime()) / (7 * 24 * 60 * 60 * 1000));
    const weeklyRate = totalGain / weeksBetween;
    const projectedWeight12m = latest.weight_kg! + (weeklyRate * 52);

    return {
      currentWeight: latest.weight_kg!,
      currentBF: latest.body_fat_percent!,
      leanMass: Math.round(latestLean * 10) / 10,
      fatMass: Math.round(latestFat * 10) / 10,
      totalGain: Math.round(totalGain * 10) / 10,
      leanGain: Math.round(leanGain * 10) / 10,
      fatGain: Math.round(fatGain * 10) / 10,
      bulkQuality: Math.round(bulkQuality),
      bfTrending,
      projectedWeight: Math.round(projectedWeight12m * 10) / 10,
      weeklyRate: Math.round(weeklyRate * 100) / 100,
    };
  }, [metrics]);

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bulk Quality</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Log weight + body fat % at least twice to see bulk quality analysis.
          </p>
        </CardContent>
      </Card>
    );
  }

  const qualityColor = analysis.bulkQuality >= 70 ? 'text-green-400' : analysis.bulkQuality >= 50 ? 'text-amber-400' : 'text-red-400';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Bulk Quality Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* BF Warning */}
        {analysis.bfTrending && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
            <span className="text-sm text-red-400">Body fat trending above 16%. Consider a mini-cut.</span>
          </div>
        )}

        {/* Quality Score */}
        <div className="text-center">
          <div className={`text-4xl font-bold ${qualityColor}`}>{analysis.bulkQuality}%</div>
          <div className="text-sm text-muted-foreground">of weight gain is lean mass</div>
          <Progress value={analysis.bulkQuality} className="h-2 mt-2" />
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-lg font-bold">{analysis.leanMass} kg</div>
            <div className="text-xs text-muted-foreground">Lean Mass</div>
            <div className="text-xs text-green-400">+{analysis.leanGain} kg</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-lg font-bold">{analysis.fatMass} kg</div>
            <div className="text-xs text-muted-foreground">Fat Mass</div>
            <div className="text-xs text-red-400">+{analysis.fatGain} kg</div>
          </div>
        </div>

        {/* Projection */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
          <div className="text-sm text-muted-foreground">12-Month Projection</div>
          <div className="text-xl font-bold">{analysis.projectedWeight} kg</div>
          <div className="text-xs text-muted-foreground">
            at {analysis.weeklyRate > 0 ? '+' : ''}{analysis.weeklyRate} kg/week
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
