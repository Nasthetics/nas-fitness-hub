import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MacroDonutChartProps {
  protein: number;
  carbs: number;
  fats: number;
  targetCalories: number;
  currentCalories: number;
}

const COLORS = {
  protein: 'hsl(var(--destructive))',
  carbs: 'hsl(var(--warning, 45 93% 47%))',
  fats: 'hsl(var(--accent-foreground))',
};

export function MacroDonutChart({ 
  protein, 
  carbs, 
  fats, 
  targetCalories, 
  currentCalories 
}: MacroDonutChartProps) {
  // Calculate calories from macros (protein & carbs = 4cal/g, fats = 9cal/g)
  const proteinCals = protein * 4;
  const carbsCals = carbs * 4;
  const fatsCals = fats * 9;
  const totalMacroCals = proteinCals + carbsCals + fatsCals;

  // Calculate percentages
  const proteinPercent = totalMacroCals > 0 ? Math.round((proteinCals / totalMacroCals) * 100) : 0;
  const carbsPercent = totalMacroCals > 0 ? Math.round((carbsCals / totalMacroCals) * 100) : 0;
  const fatsPercent = totalMacroCals > 0 ? 100 - proteinPercent - carbsPercent : 0;

  const remaining = Math.max(0, targetCalories - currentCalories);

  const data = [
    { name: 'Protein', value: proteinCals, percent: proteinPercent, color: COLORS.protein },
    { name: 'Carbs', value: carbsCals, percent: carbsPercent, color: COLORS.carbs },
    { name: 'Fats', value: fatsCals, percent: fatsPercent, color: COLORS.fats },
  ].filter(d => d.value > 0);

  // If no data, show placeholder
  if (data.length === 0) {
    data.push({ name: 'Empty', value: 1, percent: 0, color: 'hsl(var(--muted))' });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Macro Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={42}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-xs font-bold">{remaining}</div>
                <div className="text-[10px] text-muted-foreground">left</div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
              <span className="text-muted-foreground">Protein</span>
              <span className="ml-auto font-medium">{proteinPercent}%</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">Carbs</span>
              <span className="ml-auto font-medium">{carbsPercent}%</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <span className="text-muted-foreground">Fats</span>
              <span className="ml-auto font-medium">{fatsPercent}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
