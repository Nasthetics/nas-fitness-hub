
# Nutrition Page Redesign

This plan transforms the Nutrition page into a clearer, more organized experience with tabbed food categories, meal templates, and a visual macro breakdown.

---

## Current Issues

| Problem | Impact |
|---------|--------|
| Food search shows random 10 items with no organization | Hard to find foods in 150+ database |
| No category filtering | Users browse blindly |
| No visual macro representation | Progress bars alone don't show distribution |
| No quick-start options | New users unsure how to begin |
| Training/Rest day logic unclear | Users don't understand target changes |

---

## Solution Overview

### 1. Tabbed Food Browser with Categories

Replace the flat food list with a tabbed interface organized by category:

| Tab | Foods | Icon |
|-----|-------|------|
| All | Full search | Search |
| Protein | Chicken, Fish, Beef, etc. | Beef icon |
| Carbs | Rice, Bread, Pasta | Wheat icon |
| Dairy | Labneh, Halloumi, Yogurt | Milk icon |
| Vegetables | Okra, Spinach, Tomatoes | Salad icon |
| Fruits | Dates, Mango, Pomegranate | Apple icon |
| Fats | Ghee, Tahini, Nuts | Droplets icon |
| Snacks | Hummus, Falafel | Cookie icon |

### 2. Meal Templates (Quick Add)

Pre-built meal structures users can add with one click:

| Template | Typical Foods |
|----------|---------------|
| Breakfast | Eggs, Oats, Fruit, Yogurt |
| Pre-Workout | Banana, Rice, Chicken |
| Post-Workout | Protein shake, Rice, Chicken |
| Lunch | Rice, Protein, Vegetables |
| Dinner | Protein, Vegetables, Fats |
| Snack | Nuts, Dates, Hummus |

### 3. Visual Macro Breakdown

A donut/pie chart showing:
- Current macro distribution (P/C/F percentages)
- Remaining calories to target
- Color-coded segments matching the macro cards

### 4. Improved Empty State

When no meals are logged, show:
- Quick-start guide with 3 simple steps
- "Add Your First Meal" prominent CTA
- Suggested meal templates to get started

---

## UI Mockup

```text
+------------------------------------------------------------------+
|  Nutrition                                 [< Fri, Feb 7 >]       |
|  [Training Day Badge]                                            |
+------------------------------------------------------------------+
|                                                                   |
|  +------------+  +------------+  +------------+  +------------+   |
|  | Calories   |  | Protein    |  | Carbs      |  | Fats       |   |
|  | 1,850      |  | 165g       |  | 180g       |  | 52g        |   |
|  | ████████░░ |  | ████████░░ |  | ██████░░░░ |  | ██████░░░░ |   |
|  | / 2,800    |  | / 200g     |  | / 300g     |  | / 80g      |   |
|  +------------+  +------------+  +------------+  +------------+   |
|                                                                   |
|  +----------------------+  +------------------------------------+ |
|  | MACRO BREAKDOWN      |  | QUICK ADD MEAL                     | |
|  |     .-~~~-.          |  | [Breakfast] [Pre-Workout] [Lunch]  | |
|  |   /  P:33% \         |  | [Post-Workout] [Dinner] [Snack]    | |
|  |  |  C:39%   |        |  | [+ Custom Meal]                    | |
|  |   \ F:28% /          |  |                                    | |
|  |     '~~~'            |  |                                    | |
|  | 950 kcal remaining   |  |                                    | |
|  +----------------------+  +------------------------------------+ |
|                                                                   |
|  MEALS                                                            |
|  +--------------------------------------------------------------+ |
|  | Breakfast                          520 kcal | 42g protein    | |
|  |  - Scrambled Eggs (150g)              210 kcal | 18g P       | |
|  |  - Arabic Bread (80g)                 220 kcal | 7g P        | |
|  |  - Labneh (50g)                       72 kcal | 4g P         | |
|  |                                   [+ Add Food]                | |
|  +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
```

---

## Food Search Dialog Redesign

```text
+-----------------------------------------------+
|  Add Food to Breakfast                        |
+-----------------------------------------------+
|  [Search: ________________]                   |
|                                               |
|  [All] [Protein] [Carbs] [Dairy] [Veg] [...] |
|                                               |
|  +-------------------------------------------+|
|  | Chicken Breast                      Protein|
|  | 165 kcal | 31g P | 0g C | 4g F per 100g   |
|  +-------------------------------------------+|
|  | Hammour (Local Fish)                Protein|
|  | 96 kcal | 20g P | 0g C | 1g F per 100g    |
|  +-------------------------------------------+|
|  | ...more results...                         |
+-----------------------------------------------+
```

---

## Technical Implementation

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/nutrition/MacroDonutChart.tsx` | Pie/donut chart for macro visualization |
| `src/components/nutrition/FoodCategoryTabs.tsx` | Tabbed food browser component |
| `src/components/nutrition/MealTemplates.tsx` | Quick-add meal template buttons |
| `src/components/nutrition/NutritionEmptyState.tsx` | Improved empty state with onboarding |

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Nutrition.tsx` | Integrate new components, add macro chart section |
| `src/hooks/use-fitness-data.ts` | Add `useFoodsByCategory` hook for filtered queries |

### Component Details

#### MacroDonutChart
- Uses Recharts PieChart with custom colors
- Shows P/C/F distribution as percentages
- Center text displays remaining calories
- Responsive sizing

#### FoodCategoryTabs
- Horizontal scrollable tabs on mobile
- Each tab filters foods by `category` field
- Badge showing count per category
- Combines with search for "Protein + chicken" type filtering

#### MealTemplates
- Grid of preset meal buttons
- One-click creates meal with suggested name
- Optional: pre-populate with common foods for that meal type

---

## Data Flow

```text
User clicks "Add Food"
        |
        v
+------------------+
| FoodCategoryTabs |
|  - All (154)     |
|  - Protein (42)  | <-- Filter by category
|  - Carbs (25)    |
|  - ...           |
+------------------+
        |
        v
+------------------+
| Search + Filter  |
| Combined Results |
+------------------+
        |
        v
+------------------+
| Select Food      |
| Enter Quantity   |
+------------------+
        |
        v
+------------------+
| Add to Meal      |
| Update Totals    |
+------------------+
```

---

## Summary

| Addition | Benefit |
|----------|---------|
| **Category tabs** | Browse 154 foods by type (Protein, Carbs, etc.) |
| **Macro donut chart** | Visual breakdown of P/C/F distribution |
| **Meal templates** | Quick-start with Breakfast, Lunch, Dinner presets |
| **Improved empty state** | Clear onboarding for new users |
| **Combined search + filter** | Find "Chicken" within "Protein" category |

This redesign makes the nutrition tracking clearer and faster to use, especially with the expanded Dubai food database.
