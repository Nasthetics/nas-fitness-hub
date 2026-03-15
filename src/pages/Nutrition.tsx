import { useState, useMemo } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { Plus, Flame, Beef, Wheat, Droplets, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useMealLogs, useCreateMealLog, useCreateMealItem, useFoodDatabase, useProfile, useTodayWorkout } from '@/hooks/use-fitness-data';
import { MacroDonutChart } from '@/components/nutrition/MacroDonutChart';
import { MealTemplates } from '@/components/nutrition/MealTemplates';
import { FoodCategoryTabs } from '@/components/nutrition/FoodCategoryTabs';
import { NutritionEmptyState } from '@/components/nutrition/NutritionEmptyState';
import { AdaptiveMacroCard } from '@/components/nutrition/AdaptiveMacroCard';
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

  // Cardio calories for selected date
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

  // Determine if today is a training day (match Dashboard logic: default to Training unless explicitly a Rest day)
  const isActualTrainingDay = todayWorkout?.template?.day_type !== 'rest';

  // Calculate daily totals
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

  // Get targets based on training/rest day
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
    await createMealLog.mutateAsync({
      meal_name: name,
      meal_date: dateStr,
      is_training_day: isTrainingDay,
    });
    setNewMealName('');
    setIsAddMealDialogOpen(false);
  };

  const handleQuickAddMeal = async (mealName: string) => {
    await handleCreateMeal(mealName);
  };

  const handleAddFood = async () => {
    if (!addingToMealId || !selectedFood) return;
    const qty = parseFloat(quantity);
    const multiplier = qty / 100;
    
    await createMealItem.mutateAsync({
      meal_log_id: addingToMealId,
      food_id: selectedFood.id,
      custom_food_name: null,
      quantity_g: qty,
      calories: Math.round(selectedFood.calories_per_100g * multiplier),
      protein: Math.round(selectedFood.protein_per_100g * multiplier * 10) / 10,
      carbs: Math.round(selectedFood.carbs_per_100g * multiplier * 10) / 10,
      fats: Math.round(selectedFood.fats_per_100g * multiplier * 10) / 10,
      fiber: Math.round((selectedFood.fiber_per_100g || 0) * multiplier * 10) / 10,
    });
    
    setAddingToMealId(null);
    setSelectedFood(null);
    setQuantity('100');
    setFoodSearchQuery('');
  };

  const handleAddScannedFood = async () => {
    if (!scannedMealId || !scannedProduct) return;
    const qty = parseFloat(scannedQty);
    const multiplier = qty / 100;
    await createMealItem.mutateAsync({
      meal_log_id: scannedMealId,
      food_id: null,
      custom_food_name: scannedProduct.name,
      quantity_g: qty,
      calories: Math.round(scannedProduct.calories * multiplier),
      protein: Math.round(scannedProduct.protein * multiplier * 10) / 10,
      carbs: Math.round(scannedProduct.carbs * multiplier * 10) / 10,
      fats: Math.round(scannedProduct.fats * multiplier * 10) / 10,
      fiber: 0,
    });
    setScannedProduct(null);
    setScannedQty('100');
    setScannedMealId(null);
  };

  const navigateDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with date navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nutrition</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={isActualTrainingDay ? "default" : "secondary"}>
              {isActualTrainingDay ? '🏋️ Training Day' : '😴 Rest Day'}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <BarcodeScanner onProductScanned={(product) => {
            setScannedProduct(product);
          }} />
          <Button variant="outline" size="icon" onClick={() => navigateDate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[140px] text-center">
            {format(selectedDate, 'EEE, MMM d')}
          </span>
          <Button variant="outline" size="icon" onClick={() => navigateDate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Macro Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Calories</span>
            </div>
            <div className="text-2xl font-bold">{Math.round(dailyTotals.calories)}</div>
            <Progress 
              value={Math.min((dailyTotals.calories / targets.calories) * 100, 100)} 
              className="h-2 mt-2"
            />
            <div className="text-xs text-muted-foreground mt-1">
              / {targets.calories} kcal
            </div>
            {cardioCalories > 0 && (
              <div className="flex items-center gap-1 mt-2 text-xs">
                <Activity className="h-3 w-3 text-orange-400" />
                <span className="text-muted-foreground">Burned:</span>
                <span className="font-medium text-orange-400">{cardioCalories} kcal</span>
                <span className="text-muted-foreground">from cardio</span>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Beef className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Protein</span>
            </div>
            <div className="text-2xl font-bold">{Math.round(dailyTotals.protein)}g</div>
            <Progress 
              value={Math.min((dailyTotals.protein / targets.protein) * 100, 100)} 
              className="h-2 mt-2"
            />
            <div className="text-xs text-muted-foreground mt-1">
              / {targets.protein}g
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Wheat className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Carbs</span>
            </div>
            <div className="text-2xl font-bold">{Math.round(dailyTotals.carbs)}g</div>
            <Progress 
              value={Math.min((dailyTotals.carbs / targets.carbs) * 100, 100)} 
              className="h-2 mt-2"
            />
            <div className="text-xs text-muted-foreground mt-1">
              / {targets.carbs}g
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Fats</span>
            </div>
            <div className="text-2xl font-bold">{Math.round(dailyTotals.fats)}g</div>
            <Progress 
              value={Math.min((dailyTotals.fats / targets.fats) * 100, 100)} 
              className="h-2 mt-2"
            />
            <div className="text-xs text-muted-foreground mt-1">
              / {targets.fats}g
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Macro Chart + Adaptive Engine + Water + Meal Templates */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MacroDonutChart
          protein={dailyTotals.protein}
          carbs={dailyTotals.carbs}
          fats={dailyTotals.fats}
          targetCalories={targets.calories}
          currentCalories={dailyTotals.calories}
        />
        <AdaptiveMacroCard />
        <WaterTracker />
        <MealTemplates
          onSelectTemplate={handleQuickAddMeal}
          onCustomMeal={() => setIsAddMealDialogOpen(true)}
        />
      </div>

      {/* Add Meal Sheet */}
      <div>
        <Button onClick={() => setIsAddMealDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Meal
        </Button>
      </div>
      <Sheet open={isAddMealDialogOpen} onOpenChange={setIsAddMealDialogOpen}>
        <SheetContent side="bottom" className="h-[50vh] w-full max-w-[100vw] rounded-t-2xl px-4">
          <div className="flex h-full flex-col">
            <SheetHeader className="pb-2">
              <SheetTitle className="text-left">Add Meal</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Meal Name</Label>
                <Input
                  placeholder="e.g., Breakfast, Pre-workout, Dinner"
                  value={newMealName}
                  onChange={(e) => setNewMealName(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={isTrainingDay} onCheckedChange={setIsTrainingDay} />
                <Label>Training day</Label>
              </div>
            </div>
            <div className="mt-auto space-y-2 border-t border-border pt-4 pb-[env(safe-area-inset-bottom,16px)]">
              <Button onClick={() => handleCreateMeal()} disabled={!newMealName.trim()} className="w-full">
                Create Meal
              </Button>
              <Button variant="outline" onClick={() => setIsAddMealDialogOpen(false)} className="w-full">
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Meals List or Empty State */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Meals</h2>
        
        {mealLogs.length === 0 ? (
          <NutritionEmptyState
            onAddMeal={() => setIsAddMealDialogOpen(true)}
            onQuickAdd={handleQuickAddMeal}
          />
        ) : (
          mealLogs.map(meal => {
            const mealTotals = meal.meal_items?.reduce((acc, item) => ({
              calories: acc.calories + (item.calories || 0),
              protein: acc.protein + (item.protein || 0),
            }), { calories: 0, protein: 0 }) || { calories: 0, protein: 0 };

            return (
              <Card key={meal.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{meal.meal_name}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{Math.round(mealTotals.calories)} kcal</span>
                      <span>{Math.round(mealTotals.protein)}g protein</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAddingToMealId(meal.id);
                          setSelectedFood(null);
                          setFoodSearchQuery('');
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Food
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                {meal.meal_items && meal.meal_items.length > 0 && (
                  <CardContent>
                    <div className="space-y-2">
                      {meal.meal_items.map(item => (
                        <div 
                          key={item.id}
                          className="flex items-center justify-between py-2 px-3 bg-accent/30 rounded-lg text-sm"
                        >
                          <div>
                            <span className="font-medium">
                              {item.food?.name || item.custom_food_name}
                            </span>
                            <span className="text-muted-foreground ml-2">
                              {item.quantity_g}g
                            </span>
                          </div>
                          <div className="text-muted-foreground">
                            {Math.round(item.calories)} kcal • {Math.round(item.protein)}g P
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      <Sheet
        open={!!addingToMealId}
        onOpenChange={(open) => {
          if (!open) {
            setAddingToMealId(null);
            setSelectedFood(null);
            setFoodSearchQuery('');
          }
        }}
      >
        <SheetContent side="bottom" className="h-[50vh] w-full max-w-[100vw] rounded-t-2xl px-4">
          <div className="flex h-full flex-col">
            <SheetHeader className="pb-2">
              <SheetTitle className="text-left">
                Add Food to {mealLogs.find((m) => m.id === addingToMealId)?.meal_name || 'Meal'}
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto py-2 pr-1">
              {!selectedFood ? (
                <FoodCategoryTabs
                  foods={foods}
                  searchQuery={foodSearchQuery}
                  onSearchChange={setFoodSearchQuery}
                  onSelectFood={setSelectedFood}
                />
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg bg-accent/50 p-4">
                    <div className="font-medium">{selectedFood.name}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {selectedFood.calories_per_100g} kcal per 100g
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity (grams)</Label>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      min="1"
                      className="w-full"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    = {Math.round(selectedFood.calories_per_100g * parseFloat(quantity || '0') / 100)} kcal,{' '}
                    {Math.round(selectedFood.protein_per_100g * parseFloat(quantity || '0') / 100 * 10) / 10}g protein
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedFood(null)}>
                    ← Choose different food
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-auto space-y-2 border-t border-border pt-4 pb-[env(safe-area-inset-bottom,16px)]">
              <Button onClick={handleAddFood} disabled={!selectedFood || !quantity} className="w-full">
                Add Food
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setAddingToMealId(null);
                  setSelectedFood(null);
                  setFoodSearchQuery('');
                }}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Scanned Product Dialog */}
      <Dialog open={!!scannedProduct} onOpenChange={(v) => { if (!v) setScannedProduct(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scanned Product</DialogTitle>
          </DialogHeader>
          {scannedProduct && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-accent/50 rounded-lg">
                <div className="font-medium text-lg">{scannedProduct.name}</div>
                <div className="grid grid-cols-4 gap-2 mt-2 text-sm text-muted-foreground">
                  <div><span className="font-medium text-foreground">{scannedProduct.calories}</span> kcal</div>
                  <div><span className="font-medium text-foreground">{scannedProduct.protein}g</span> P</div>
                  <div><span className="font-medium text-foreground">{scannedProduct.carbs}g</span> C</div>
                  <div><span className="font-medium text-foreground">{scannedProduct.fats}g</span> F</div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">per 100g</div>
              </div>
              <div className="space-y-2">
                <Label>Quantity (grams)</Label>
                <Input type="number" value={scannedQty} onChange={(e) => setScannedQty(e.target.value)} min="1" />
              </div>
              <div className="text-sm text-muted-foreground">
                = {Math.round(scannedProduct.calories * parseFloat(scannedQty || '0') / 100)} kcal, {' '}
                {Math.round(scannedProduct.protein * parseFloat(scannedQty || '0') / 100 * 10) / 10}g protein
              </div>
              {mealLogs.length > 0 ? (
                <div className="space-y-2">
                  <Label>Add to meal</Label>
                  <div className="grid gap-2">
                    {mealLogs.map(meal => (
                      <Button
                        key={meal.id}
                        variant={scannedMealId === meal.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setScannedMealId(meal.id)}
                        className="justify-start"
                      >
                        {meal.meal_name}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Create a meal first to add this food.</p>
              )}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleAddScannedFood} disabled={!scannedMealId || !scannedProduct}>
              Add to Meal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
