import { useState, useMemo } from 'react';
import { Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

const BAR_WEIGHT = 20;
const AVAILABLE_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

const PLATE_COLORS: Record<number, string> = {
  25: 'bg-red-500',
  20: 'bg-blue-500',
  15: 'bg-amber-400',
  10: 'bg-emerald-500',
  5: 'bg-white text-black',
  2.5: 'bg-red-300',
  1.25: 'bg-gray-400',
};

function calculatePlates(targetWeight: number): number[] {
  const perSide = (targetWeight - BAR_WEIGHT) / 2;
  if (perSide <= 0) return [];
  
  const plates: number[] = [];
  let remaining = perSide;
  
  for (const plate of AVAILABLE_PLATES) {
    while (remaining >= plate) {
      plates.push(plate);
      remaining -= plate;
      remaining = Math.round(remaining * 100) / 100;
    }
  }
  
  return plates;
}

export function PlateCalculator() {
  const [targetWeight, setTargetWeight] = useState(100);
  
  const plates = useMemo(() => calculatePlates(targetWeight), [targetWeight]);
  const perSide = (targetWeight - BAR_WEIGHT) / 2;
  const isValid = targetWeight >= BAR_WEIGHT && perSide >= 0;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Calculator className="h-4 w-4" />
          Plate Calculator
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Plate Calculator</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Target Weight (kg)</Label>
            <Input
              type="number"
              value={targetWeight}
              onChange={(e) => setTargetWeight(Number(e.target.value))}
              min={BAR_WEIGHT}
              step={2.5}
            />
            <p className="text-xs text-muted-foreground">Based on {BAR_WEIGHT}kg Olympic bar</p>
          </div>

          {isValid && plates.length > 0 && (
            <>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Each side</div>
                <div className="text-2xl font-bold">{perSide} kg</div>
              </div>

              {/* Visual plate diagram */}
              <div className="flex items-center justify-center gap-1 py-4">
                {/* Left plates */}
                {[...plates].reverse().map((plate, i) => (
                  <div
                    key={`l-${i}`}
                    className={`${PLATE_COLORS[plate]} rounded-sm flex items-center justify-center text-xs font-bold`}
                    style={{
                      width: `${Math.max(20, plate * 1.5)}px`,
                      height: `${Math.max(30, plate * 2.5)}px`,
                    }}
                  >
                    {plate}
                  </div>
                ))}
                {/* Bar */}
                <div className="bg-muted-foreground/50 rounded-full w-16 h-3" />
                {/* Right plates */}
                {plates.map((plate, i) => (
                  <div
                    key={`r-${i}`}
                    className={`${PLATE_COLORS[plate]} rounded-sm flex items-center justify-center text-xs font-bold`}
                    style={{
                      width: `${Math.max(20, plate * 1.5)}px`,
                      height: `${Math.max(30, plate * 2.5)}px`,
                    }}
                  >
                    {plate}
                  </div>
                ))}
              </div>

              {/* Plate list */}
              <div className="space-y-1">
                <div className="text-sm font-medium">Load per side:</div>
                <div className="flex flex-wrap gap-2">
                  {plates.map((plate, i) => (
                    <Badge key={i} variant="outline">{plate} kg</Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {isValid && plates.length === 0 && targetWeight === BAR_WEIGHT && (
            <div className="text-center text-muted-foreground py-4">
              Just the bar! ({BAR_WEIGHT} kg)
            </div>
          )}

          {!isValid && (
            <div className="text-center text-destructive py-4">
              Target must be at least {BAR_WEIGHT} kg (bar weight)
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
