import { Utensils, Search, Plus, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface NutritionEmptyStateProps {
  onAddMeal: () => void;
  onQuickAdd: (mealName: string) => void;
}

const QUICK_MEAL_OPTIONS = ['Breakfast', 'Lunch', 'Dinner'];

export function NutritionEmptyState({ onAddMeal, onQuickAdd }: NutritionEmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="pt-8 pb-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <ChefHat className="h-8 w-8 text-primary" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold">Start Tracking Your Nutrition</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Log your meals to track calories and macros
            </p>
          </div>

          {/* Quick Start Steps */}
          <div className="grid gap-3 text-left max-w-xs mx-auto mt-6">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">
                1
              </div>
              <div className="text-sm">
                <p className="font-medium">Add a meal</p>
                <p className="text-muted-foreground">Breakfast, Lunch, Dinner, etc.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">
                2
              </div>
              <div className="text-sm">
                <p className="font-medium">Search for foods</p>
                <p className="text-muted-foreground">150+ Dubai foods available</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">
                3
              </div>
              <div className="text-sm">
                <p className="font-medium">Track your progress</p>
                <p className="text-muted-foreground">See macros and calories in real-time</p>
              </div>
            </div>
          </div>

          {/* Quick Add Buttons */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {QUICK_MEAL_OPTIONS.map(meal => (
              <Button
                key={meal}
                variant="outline"
                size="sm"
                onClick={() => onQuickAdd(meal)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                {meal}
              </Button>
            ))}
          </div>

          <Button onClick={onAddMeal} className="mt-2">
            <Utensils className="h-4 w-4 mr-2" />
            Add Your First Meal
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
