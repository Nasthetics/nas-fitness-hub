import { Sunrise, Zap, Utensils, Moon, Cookie, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MealTemplatesProps {
  onSelectTemplate: (mealName: string) => void;
  onCustomMeal: () => void;
}

const MEAL_TEMPLATES = [
  { name: 'Breakfast', icon: Sunrise, color: 'text-orange-500' },
  { name: 'Pre-Workout', icon: Zap, color: 'text-yellow-500' },
  { name: 'Lunch', icon: Utensils, color: 'text-emerald-500' },
  { name: 'Post-Workout', icon: Dumbbell, color: 'text-blue-500' },
  { name: 'Dinner', icon: Moon, color: 'text-purple-500' },
  { name: 'Snack', icon: Cookie, color: 'text-pink-500' },
];

export function MealTemplates({ onSelectTemplate, onCustomMeal }: MealTemplatesProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Quick Add Meal</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {MEAL_TEMPLATES.map(template => {
            const Icon = template.icon;
            return (
              <Button
                key={template.name}
                variant="outline"
                size="sm"
                className="flex flex-col h-auto py-2 px-2 gap-1"
                onClick={() => onSelectTemplate(template.name)}
              >
                <Icon className={`h-4 w-4 ${template.color}`} />
                <span className="text-xs">{template.name}</span>
              </Button>
            );
          })}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2 text-xs"
          onClick={onCustomMeal}
        >
          + Custom Meal
        </Button>
      </CardContent>
    </Card>
  );
}
