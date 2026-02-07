import { useState } from 'react';
import { Search, Beef, Wheat, Milk, Salad, Apple, Droplets, Cookie, Package } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Food, GroceryCategory } from '@/lib/types';

interface FoodCategoryTabsProps {
  foods: Food[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectFood: (food: Food) => void;
}

const CATEGORY_CONFIG: Record<GroceryCategory | 'all', { label: string; icon: typeof Beef }> = {
  all: { label: 'All', icon: Search },
  protein: { label: 'Protein', icon: Beef },
  carbs: { label: 'Carbs', icon: Wheat },
  dairy: { label: 'Dairy', icon: Milk },
  vegetables: { label: 'Veg', icon: Salad },
  fruits: { label: 'Fruits', icon: Apple },
  fats: { label: 'Fats', icon: Droplets },
  snacks: { label: 'Snacks', icon: Cookie },
  supplements: { label: 'Supps', icon: Package },
  other: { label: 'Other', icon: Package },
};

export function FoodCategoryTabs({ 
  foods, 
  searchQuery, 
  onSearchChange, 
  onSelectFood 
}: FoodCategoryTabsProps) {
  const [selectedCategory, setSelectedCategory] = useState<GroceryCategory | 'all'>('all');

  // Filter foods by category and search
  const filteredFoods = foods.filter(food => {
    const matchesSearch = !searchQuery || 
      food.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
      food.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get category counts
  const categoryCounts = foods.reduce((acc, food) => {
    const cat = food.category || 'other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Categories to show (only ones with foods)
  const activeCategories = ['all', 'protein', 'carbs', 'dairy', 'vegetables', 'fruits', 'fats', 'snacks'] as const;

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search foods..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category Tabs */}
      <Tabs 
        value={selectedCategory} 
        onValueChange={(v) => setSelectedCategory(v as GroceryCategory | 'all')}
      >
        <ScrollArea className="w-full">
          <TabsList className="w-max h-auto p-1 gap-1">
            {activeCategories.map(category => {
              const config = CATEGORY_CONFIG[category];
              const Icon = config.icon;
              const count = category === 'all' 
                ? foods.length 
                : (categoryCounts[category] || 0);
              
              return (
                <TabsTrigger 
                  key={category} 
                  value={category}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{config.label}</span>
                  {count > 0 && (
                    <Badge variant="secondary" className="h-4 px-1 text-[10px] ml-1">
                      {count}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </ScrollArea>
      </Tabs>

      {/* Food List */}
      <ScrollArea className="h-[280px]">
        <div className="space-y-2 pr-4">
          {filteredFoods.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No foods found
            </div>
          ) : (
            filteredFoods.slice(0, 30).map(food => {
              const categoryConfig = CATEGORY_CONFIG[food.category || 'other'];
              
              return (
                <button
                  key={food.id}
                  onClick={() => onSelectFood(food)}
                  className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{food.name}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {categoryConfig.label}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {food.calories_per_100g} kcal | {food.protein_per_100g}g P | {food.carbs_per_100g}g C | {food.fats_per_100g}g F
                    <span className="text-muted-foreground/60 ml-1">per 100g</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
