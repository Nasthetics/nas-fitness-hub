import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Plus, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useMealLogs, useCreateMealLog, useCreateMealItem, useFoodDatabase, useProfile, useTodayWorkout } from '@/hooks/use-fitness-data';
import { MealTemplates } from '@/components/nutrition/MealTemplates';
import { FoodCategoryTabs } from '@/components/nutrition/FoodCategoryTabs';
import { NutritionEmptyState } from '@/components/nutrition/NutritionEmptyState';
import { WaterTracker } from '@/components/nutrition/WaterTracker';
import { BarcodeScanner } from '@/components/nutrition/BarcodeScanner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import type { Food } from '@/lib/types';

export default function Nutrition() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  
  const { data: mealLogs = [], isLoading } = useMealLogs(dateStr);
  const { data: foods = [] } = useFoodDatabase();
  const { data: profile } = useProfile();
  const { data: todayWorkout } = useTodayWorkout();
  const createMealLog = useCreateMealLog();
  const createMealItem = useCreateMealItem();
  
  const [newMealName, setNewMealName] = useState('');
  const [isTrainingDay, setIsTrainingDay] = useState(true);
  const [addingToMealId, setAddingToMealId] = useState<string | null>(null);
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState('100');
  const [isAddMealDialogOpen, setIsAddMealDialogOpen] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<{name: string; calories: number; protein: number; carbs: number; fats: number; barcode?: string} | null>(null);
  const [scannedQty, setScannedQty] = useState('100');
  const [scannedMealId, setScannedMealId] = useState<string | null>(null);

  const { data: cardioCalories = 0 } = useQuery({
    queryKey: ['cardio-calories', user?.id, dateStr],
    queryFn: async () => {
      if (!user) return 0;
      const { data, error } = await supabase
        .from('cardio_logs')
        .select('calories_burned')
        .eq('user_id', user.id)
        .eq('session_date', dateStr);
      if (error) return 0;
      return (data || []).reduce((s, l) => s + (l.calories_burned || 0), 0);
    },
    enabled: !!user,
  });

  const isActualTrainingDay = todayWorkout?.template?.day_type !== 'rest';

  const dailyTotals = useMemo(() => {
    return mealLogs.reduce((acc, meal) => {
      const mealTotals =
        meal.meal_items?.reduce(
          (mealAcc, item) => ({
            calories: mealAcc.calories + (item.calories || 0),
            protein: mealAcc.protein + (item.protein || 0),
            carbs: mealAcc.carbs + (item.carbs || 0),
            fats: mealAcc.fats + (item.fats || 0),
            fiber: mealAcc.fiber + (item.fiber || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 },
        ) || { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 };
      return {
        calories: acc.calories + mealTotals.calories,
        protein: acc.protein + mealTotals.protein,
        carbs: acc.carbs + mealTotals.carbs,
        fats: acc.fats + mealTotals.fats,
        fiber: acc.fiber + mealTotals.fiber,
      };
    }, { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 });
  }, [mealLogs]);

  const targets = isActualTrainingDay
    ? {
        calories: profile?.training_day_calories || 2556,
        protein: profile?.training_day_protein || 245,
        carbs: profile?.training_day_carbs || 189,
        fats: profile?.training_day_fats || 91,
      }
    : {
        calories: profile?.rest_day_calories || 2100,
        protein: profile?.rest_day_protein || 200,
        carbs: profile?.rest_day_carbs || 150,
        fats: profile?.rest_day_fats || 75,
      };

  const handleCreateMeal = async (mealName?: string) => {
    const name = mealName || newMealName;
    if (!name.trim()) return;
    await createMealLog.mutateAsync({ meal_name: name, meal_date: dateStr, is_training_day: isTrainingDay });
    setNewMealName('');
    setIsAddMealDialogOpen(false);
  };

  const handleAddFood = async () => {
    if (!addingToMealId || !selectedFood) return;
    const qty = parseFloat(quantity);
    const multiplier = qty / 100;
    await createMealItem.mutateAsync({
      meal_log_id: addingToMealId, food_id: selectedFood.id, custom_food_name: null,
      quantity_g: qty,
      calories: Math.round(selectedFood.calories_per_100g * multiplier),
      protein: Math.round(selectedFood.protein_per_100g * multiplier * 10) / 10,
      carbs: Math.round(selectedFood.carbs_per_100g * multiplier * 10) / 10,
      fats: Math.round(selectedFood.fats_per_100g * multiplier * 10) / 10,
      fiber: Math.round((selectedFood.fiber_per_100g || 0) * multiplier * 10) / 10,
    });
    setAddingToMealId(null); setSelectedFood(null); setQuantity('100'); setFoodSearchQuery('');
  };

  const handleAddScannedFood = async () => {
    if (!scannedMealId || !scannedProduct) return;
    const qty = parseFloat(scannedQty);
    const multiplier = qty / 100;
    await createMealItem.mutateAsync({
      meal_log_id: scannedMealId, food_id: null, custom_food_name: scannedProduct.name,
      quantity_g: qty,
      calories: Math.round(scannedProduct.calories * multiplier),
      protein: Math.round(scannedProduct.protein * multiplier * 10) / 10,
      carbs: Math.round(scannedProduct.carbs * multiplier * 10) / 10,
      fats: Math.round(scannedProduct.fats * multiplier * 10) / 10,
      fiber: 0,
    });
    setScannedProduct(null); setScannedQty('100'); setScannedMealId(null);
  };

  const navigateDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  // Calorie ring SVG params
  const ringSize = 180;
  const sw = 10;
  const r = (ringSize - sw) / 2;
  const c = r * 2 * Math.PI;
  const calPct = Math.min(dailyTotals.calories / targets.calories, 1);
  const calOff = c - calPct * c;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Nutrition</h1>
        <div className="flex items-center gap-2">
          <BarcodeScanner onProductScanned={(product) => setScannedProduct(product)} />
          <Button variant="outline" size="icon" onClick={() => navigateDate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[100px] text-center">
            {format(selectedDate, 'MMM d')}
          </span>
          <Button variant="outline" size="icon" onClick={() => navigateDate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calorie Ring */}
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: ringSize, height: ringSize }}>
          <svg width={ringSize} height={ringSize} className="-rotate-90">
            <circle cx={ringSize/2} cy={ringSize/2} r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth={sw} />
            <circle cx={ringSize/2} cy={ringSize/2} r={r} fill="none" stroke="hsl(var(--primary))" strokeWidth={sw} strokeDasharray={c} strokeDashoffset={calOff} strokeLinecap="round" className="transition-all duration-700" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-foreground">{Math.round(dailyTotals.calories)}</span>
            <span className="text-xs text-muted-foreground">/ {targets.calories} kcal</span>
          </div>
        </div>
        <Badge variant={isActualTrainingDay ? "default" : "secondary"} className="mt-2">
          {isActualTrainingDay ? '🏋️ Training' : '😴 Rest'}
        </Badge>
      </div>

      {/* Macro rows */}
      <div className="space-y-3">
        {[
          { label: 'Protein', current: dailyTotals.protein, target: targets.protein, unit: 'g' },
          { label: 'Carbs', current: dailyTotals.carbs, target: targets.carbs, unit: 'g' },
          { label: 'Fat', current: dailyTotals.fats, target: targets.fats, unit: 'g' },
        ].map(macro => (
          <div key={macro.label} className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground w-16">{macro.label}</span>
            <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
              <div 
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.min((macro.current / macro.target) * 100, 100)}%` }}
              />
            </div>
            <span className="text-sm font-bold text-foreground w-20 text-right">
              {Math.round(macro.current)}/{macro.target}{macro.unit}
            </span>
          </div>
        ))}
      </div>

      {cardioCalories > 0 && (
        <div className="flex items-center gap-2 text-sm rounded-xl bg-card border border-border p-3">
          <Activity className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">Cardio burned:</span>
          <span className="font-bold text-primary">{cardioCalories} kcal</span>
        </div>
      )}

      {/* Water Tracker */}
      <WaterTracker />

      {/* Add Meal */}
      <Button onClick={() => setIsAddMealDialogOpen(true)} className="w-full rounded-xl">
        <Plus className="h-4 w-4 mr-2" /> Add Meal
      </Button>

      <Sheet open={isAddMealDialogOpen} onOpenChange={setIsAddMealDialogOpen}>
        <SheetContent side="bottom" className="h-[50vh] w-full max-w-[100vw] rounded-t-2xl px-4">
          <div className="flex h-full flex-col">
            <SheetHeader className="pb-2">
              <SheetTitle className="text-left">Add Meal</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Meal Name</Label>
                <Input placeholder="e.g., Breakfast, Pre-workout" value={newMealName} onChange={(e) => setNewMealName(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={isTrainingDay} onCheckedChange={setIsTrainingDay} />
                <Label>Training day</Label>
              </div>
            </div>
            <div className="mt-auto space-y-2 border-t border-border pt-4 pb-[env(safe-area-inset-bottom,16px)]">
              <Button onClick={() => handleCreateMeal()} disabled={!newMealName.trim()} className="w-full">Create Meal</Button>
              <Button variant="outline" onClick={() => setIsAddMealDialogOpen(false)} className="w-full">Cancel</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Meal Templates */}
      <MealTemplates onSelectTemplate={(name) => handleCreateMeal(name)} onCustomMeal={() => setIsAddMealDialogOpen(true)} />

      {/* Meals List */}
      <div className="space-y-3">
        <p className="section-label">Today's Meals</p>
        {mealLogs.length === 0 ? (
          <NutritionEmptyState onAddMeal={() => setIsAddMealDialogOpen(true)} onQuickAdd={(name) => handleCreateMeal(name)} />
        ) : (
          mealLogs.map(meal => {
            const mealTotals = meal.meal_items?.reduce((acc, item) => ({
              calories: acc.calories + (item.calories || 0),
              protein: acc.protein + (item.protein || 0),
            }), { calories: 0, protein: 0 }) || { calories: 0, protein: 0 };

            return (
              <div key={meal.id} className="rounded-xl bg-card border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-foreground">{meal.meal_name}</span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{Math.round(mealTotals.calories)} kcal</span>
                    <span>{Math.round(mealTotals.protein)}g P</span>
                    <Button variant="ghost" size="sm" onClick={() => {
                      setAddingToMealId(meal.id); setSelectedFood(null); setFoodSearchQuery('');
                    }}>
                      <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                  </div>
                </div>
                {meal.meal_items && meal.meal_items.length > 0 && (
                  <div className="space-y-1">
                    {meal.meal_items.map(item => (
                      <div key={item.id} className="flex items-center justify-between py-1.5 px-2 bg-secondary/50 rounded-lg text-xs">
                        <span className="font-medium">{item.food?.name || item.custom_food_name} <span className="text-muted-foreground">{item.quantity_g}g</span></span>
                        <span className="text-muted-foreground">{Math.round(item.calories)} kcal</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Food picker sheet */}
      <Sheet open={!!addingToMealId} onOpenChange={(open) => {
        if (!open) { setAddingToMealId(null); setSelectedFood(null); setFoodSearchQuery(''); }
      }}>
        <SheetContent side="bottom" className="h-[50vh] w-full max-w-[100vw] rounded-t-2xl px-4">
          <div className="flex h-full flex-col">
            <SheetHeader className="pb-2">
              <SheetTitle className="text-left">
                Add Food to {mealLogs.find((m) => m.id === addingToMealId)?.meal_name || 'Meal'}
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto py-2 pr-1">
              {!selectedFood ? (
                <FoodCategoryTabs foods={foods} searchQuery={foodSearchQuery} onSearchChange={setFoodSearchQuery} onSelectFood={setSelectedFood} />
              ) : (
                <div className="space-y-4 animate-in">
                  <div className="p-4 rounded-xl bg-secondary/50">
                    <div className="font-bold text-lg">{selectedFood.name}</div>
                    <div className="grid grid-cols-4 gap-2 mt-2 text-xs text-muted-foreground">
                      <div>{selectedFood.calories_per_100g} kcal</div>
                      <div>{selectedFood.protein_per_100g}g P</div>
                      <div>{selectedFood.carbs_per_100g}g C</div>
                      <div>{selectedFood.fats_per_100g}g F</div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">per 100g</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity (grams)</Label>
                    <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="text-center text-lg font-bold" />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setSelectedFood(null)}>Back</Button>
                    <Button className="flex-1" onClick={handleAddFood}>Add</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Scanned food sheet */}
      <Sheet open={!!scannedProduct} onOpenChange={(open) => { if (!open) setScannedProduct(null); }}>
        <SheetContent side="bottom" className="h-[50vh] w-full max-w-[100vw] rounded-t-2xl px-4">
          <div className="flex h-full flex-col">
            <SheetHeader className="pb-2"><SheetTitle className="text-left">Scanned Product</SheetTitle></SheetHeader>
            {scannedProduct && (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-xl bg-secondary/50">
                  <div className="font-bold text-lg">{scannedProduct.name}</div>
                  <div className="grid grid-cols-4 gap-2 mt-2 text-xs text-muted-foreground">
                    <div>{scannedProduct.calories} kcal</div>
                    <div>{scannedProduct.protein}g P</div>
                    <div>{scannedProduct.carbs}g C</div>
                    <div>{scannedProduct.fats}g F</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Quantity (grams)</Label>
                  <Input type="number" value={scannedQty} onChange={(e) => setScannedQty(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Add to meal</Label>
                  <div className="flex flex-wrap gap-2">
                    {mealLogs.map(m => (
                      <Button key={m.id} variant={scannedMealId === m.id ? 'default' : 'outline'} size="sm"
                        onClick={() => setScannedMealId(m.id)}>
                        {m.meal_name}
                      </Button>
                    ))}
                  </div>
                </div>
                <Button className="w-full" disabled={!scannedMealId} onClick={handleAddScannedFood}>Add to Meal</Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
