import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ShoppingCart, Share2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MealSlot {
  name: string;
  ingredients: { item: string; qty: string; category: string }[];
}

const DEFAULT_MEALS: Record<string, MealSlot> = {
  'Post-Cardio Shake': {
    name: 'Post-Cardio Shake',
    ingredients: [
      { item: 'Protein powder', qty: '1 scoop', category: 'SUPPLEMENTS' },
      { item: 'Green apple', qty: '1', category: 'PRODUCE' },
    ],
  },
  'Post-Workout Shake': {
    name: 'Post-Workout Shake',
    ingredients: [
      { item: 'Protein powder', qty: '1 scoop', category: 'SUPPLEMENTS' },
      { item: 'Creatine', qty: '5g', category: 'SUPPLEMENTS' },
    ],
  },
  'Chicken & Rice': {
    name: 'Chicken & Rice',
    ingredients: [
      { item: 'Rice', qty: '200g', category: 'CARBS' },
      { item: 'Chicken breast', qty: '200g', category: 'PROTEINS' },
      { item: 'Coconut oil', qty: '2 tbsp', category: 'FATS' },
      { item: 'Watermelon juice', qty: '200ml', category: 'DRINKS' },
    ],
  },
  'Steak & Potatoes': {
    name: 'Steak & Potatoes',
    ingredients: [
      { item: 'Potatoes', qty: '100g', category: 'CARBS' },
      { item: 'Steak', qty: '200g', category: 'PROTEINS' },
      { item: 'Banana', qty: '1', category: 'PRODUCE' },
    ],
  },
  'Fish & Rice': {
    name: 'Fish & Rice',
    ingredients: [
      { item: 'Rice', qty: '80g', category: 'CARBS' },
      { item: 'White fish', qty: '200g', category: 'PROTEINS' },
      { item: 'Orange juice', qty: '150ml', category: 'DRINKS' },
    ],
  },
  'Eggs & Salad': {
    name: 'Eggs & Salad',
    ingredients: [
      { item: 'Egg whites', qty: '5', category: 'PROTEINS' },
      { item: 'Whole eggs', qty: '2', category: 'PROTEINS' },
      { item: 'Salad mix', qty: '1 serving', category: 'PRODUCE' },
    ],
  },
};

const MEAL_OPTIONS = Object.keys(DEFAULT_MEALS);
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOTS = ['Pre-Workout', 'Main Meals', 'Post-Workout'];

const DEFAULT_PLAN: string[][] = [
  // Each day has 3 slots
  ['Post-Cardio Shake', 'Chicken & Rice', 'Post-Workout Shake'],
  ['Post-Cardio Shake', 'Steak & Potatoes', 'Post-Workout Shake'],
  ['Post-Cardio Shake', 'Fish & Rice', 'Post-Workout Shake'],
  ['Post-Cardio Shake', 'Chicken & Rice', 'Post-Workout Shake'],
  ['Post-Cardio Shake', 'Steak & Potatoes', 'Post-Workout Shake'],
  ['Post-Cardio Shake', 'Eggs & Salad', 'Post-Workout Shake'],
  ['Post-Cardio Shake', 'Fish & Rice', 'Post-Workout Shake'],
];

interface GroceryEntry {
  item: string;
  category: string;
  qty: string;
  count: number;
}

const CATEGORY_ICONS: Record<string, string> = {
  PROTEINS: '🥩',
  CARBS: '🍚',
  PRODUCE: '🍎',
  FATS: '🫒',
  DRINKS: '🧃',
  SUPPLEMENTS: '💊',
};

export default function Groceries() {
  const { toast } = useToast();
  const [plan, setPlan] = useState<string[][]>(() => {
    try {
      const saved = localStorage.getItem('meal_plan');
      return saved ? JSON.parse(saved) : DEFAULT_PLAN;
    } catch { return DEFAULT_PLAN; }
  });
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [showPlan, setShowPlan] = useState(false);
  const [editCell, setEditCell] = useState<{ day: number; slot: number } | null>(null);
  const [activeDays, setActiveDays] = useState(7);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const savePlan = (newPlan: string[][]) => {
    setPlan(newPlan);
    localStorage.setItem('meal_plan', JSON.stringify(newPlan));
  };

  const handleCellChange = (day: number, slot: number, meal: string) => {
    const newPlan = plan.map((d, i) => i === day ? d.map((s, j) => j === slot ? meal : s) : d);
    savePlan(newPlan);
    setEditCell(null);
  };

  // Aggregate ingredients
  const groceryList = useMemo(() => {
    const map = new Map<string, GroceryEntry>();
    const daysToUse = plan.slice(0, activeDays);
    
    daysToUse.forEach(daySlots => {
      daySlots.forEach(mealName => {
        const meal = DEFAULT_MEALS[mealName];
        if (!meal) return;
        meal.ingredients.forEach(ing => {
          const key = `${ing.item}__${ing.category}`;
          const existing = map.get(key);
          if (existing) {
            existing.count += 1;
          } else {
            map.set(key, { item: ing.item, category: ing.category, qty: ing.qty, count: 1 });
          }
        });
      });
    });

    return Array.from(map.values());
  }, [plan, activeDays]);

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, GroceryEntry[]> = {};
    groceryList.forEach(entry => {
      if (!groups[entry.category]) groups[entry.category] = [];
      groups[entry.category].push(entry);
    });
    return groups;
  }, [groceryList]);

  const formatQty = (entry: GroceryEntry) => {
    const { qty, count } = entry;
    // Parse numeric quantities and multiply
    const numMatch = qty.match(/^(\d+\.?\d*)\s*(.*)/);
    if (numMatch) {
      const total = parseFloat(numMatch[1]) * count;
      return `${total}${numMatch[2] ? ' ' + numMatch[2] : ''}`;
    }
    return count > 1 ? `${qty} × ${count}` : qty;
  };

  const toggleCheck = (key: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const shareList = async () => {
    const lines: string[] = ['🛒 Weekly Grocery List\n'];
    Object.entries(grouped).forEach(([cat, items]) => {
      lines.push(`${CATEGORY_ICONS[cat] || '📦'} ${cat}`);
      items.forEach(item => {
        lines.push(`  ${checkedItems.has(item.item) ? '✅' : '⬜'} ${item.item} — ${formatQty(item)}`);
      });
      lines.push('');
    });
    const text = lines.join('\n');
    
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Grocery List', text });
      } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied to clipboard! 📋' });
    }
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategory(prev => prev === cat ? null : cat);
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Grocery List</h1>
          <p className="text-muted-foreground">Auto-generated from your meal plan</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPlan(true)}>
            Edit Plan
          </Button>
          <Button variant="outline" size="sm" onClick={shareList}>
            <Share2 className="h-4 w-4 mr-1" /> Share
          </Button>
        </div>
      </div>

      {/* Days selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Days:</span>
        {[5, 6, 7].map(d => (
          <Button key={d} variant={activeDays === d ? 'default' : 'outline'} size="sm" onClick={() => setActiveDays(d)}>
            {d}
          </Button>
        ))}
      </div>

      {/* Grocery List by Category */}
      <div className="space-y-3">
        {Object.entries(grouped).map(([category, items]) => (
          <Card key={category}>
            <button
              className="w-full text-left"
              onClick={() => toggleCategory(category)}
            >
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{CATEGORY_ICONS[category] || '📦'}</span>
                    <CardTitle className="text-base">{category}</CardTitle>
                    <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                  </div>
                  {expandedCategory === category ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </CardHeader>
            </button>
            {(expandedCategory === category || expandedCategory === null) && (
              <CardContent className="pt-0 pb-3 space-y-2">
                {items.map(item => {
                  const checked = checkedItems.has(item.item);
                  return (
                    <div
                      key={item.item}
                      className={`flex items-center gap-3 py-2 px-3 rounded-lg transition-colors ${checked ? 'bg-muted/30 opacity-60' : 'bg-accent/20'}`}
                      onClick={() => toggleCheck(item.item)}
                    >
                      <Checkbox checked={checked} />
                      <span className={`flex-1 text-sm font-medium ${checked ? 'line-through' : ''}`}>
                        {item.item}
                      </span>
                      <span className="text-sm text-muted-foreground">{formatQty(item)}</span>
                    </div>
                  );
                })}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Meal Plan Editor Dialog */}
      <Dialog open={showPlan} onOpenChange={setShowPlan}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" /> Weekly Meal Plan
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-2 text-muted-foreground">Slot</th>
                  {DAYS.slice(0, activeDays).map(d => (
                    <th key={d} className="p-2 text-center font-medium">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SLOTS.map((slot, si) => (
                  <tr key={slot}>
                    <td className="p-2 text-xs text-muted-foreground whitespace-nowrap">{slot}</td>
                    {DAYS.slice(0, activeDays).map((_, di) => (
                      <td key={di} className="p-1">
                        {editCell?.day === di && editCell?.slot === si ? (
                          <Select value={plan[di]?.[si] || ''} onValueChange={(v) => handleCellChange(di, si, v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {MEAL_OPTIONS.map(m => (
                                <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <button
                            className="w-full text-left p-1.5 rounded bg-muted/50 hover:bg-muted text-xs truncate"
                            onClick={() => setEditCell({ day: di, slot: si })}
                          >
                            {plan[di]?.[si] || '—'}
                          </button>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { savePlan(DEFAULT_PLAN); toast({ title: 'Plan reset to defaults' }); }}>
              <RefreshCw className="h-3 w-3 mr-1" /> Reset
            </Button>
            <DialogClose asChild><Button>Done</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
