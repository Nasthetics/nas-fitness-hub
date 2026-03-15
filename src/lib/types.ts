// Enums matching database
export type EquipmentType = 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | 'kettlebell' | 'resistance_band' | 'other';
export type TimingType = 'AM' | 'PM' | 'pre_workout' | 'post_workout' | 'with_meal';
export type CompoundStatus = 'researching' | 'avoid' | 'ask_doctor';
export type GroceryCategory = 'protein' | 'carbs' | 'vegetables' | 'fruits' | 'supplements' | 'snacks' | 'dairy' | 'fats' | 'other';
export type WorkoutDayType = 'shoulders_arms' | 'chest_back' | 'legs' | 'rest';

// Muscle group
export interface MuscleGroup {
  id: string;
  name: string;
  display_order: number;
}

// Exercise from library
export interface Exercise {
  id: string;
  name: string;
  primary_muscle: string | null;
  secondary_muscle: string | null;
  equipment: EquipmentType;
  substitutions: string[] | null;
  coaching_cues: string | null;
  image_url: string | null;
  muscle_subgroup: string | null;
  created_at: string;
  // Joined fields
  primary_muscle_name?: string;
  secondary_muscle_name?: string;
}

// Food from database
export interface Food {
  id: string;
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
  fiber_per_100g: number;
  serving_size_g: number;
  category: GroceryCategory;
}

// User profile
export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  training_day_calories: number;
  training_day_protein: number;
  training_day_carbs: number;
  training_day_fats: number;
  rest_day_calories: number;
  rest_day_protein: number;
  rest_day_carbs: number;
  rest_day_fats: number;
  height_cm: number | null;
  body_fat_percent: number | null;
  lean_mass_kg: number | null;
  target_weight_gain_per_week: number | null;
  water_target_ml: number | null;
  ramadan_mode: boolean | null;
  created_at: string;
  updated_at: string;
}

// Workout template
export interface WorkoutTemplate {
  id: string;
  user_id: string;
  name: string;
  day_type: WorkoutDayType;
  day_number: number;
  created_at: string;
  updated_at: string;
}

// Template exercise
export interface TemplateExercise {
  id: string;
  template_id: string;
  exercise_id: string;
  exercise_order: number;
  default_sets: number;
  default_reps: number;
  default_rest_seconds: number;
  notes: string | null;
  created_at: string;
  // Joined fields
  exercise?: Exercise;
}

// Workout log (actual logged workout)
export interface WorkoutLog {
  id: string;
  user_id: string;
  template_id: string | null;
  workout_date: string;
  completed: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Computed/joined
  template?: WorkoutTemplate;
  exercise_logs?: ExerciseLog[];
}

// Exercise log within a workout
export interface ExerciseLog {
  id: string;
  workout_log_id: string;
  exercise_id: string;
  exercise_order: number;
  created_at: string;
  // Joined
  exercise?: Exercise;
  set_logs?: SetLog[];
}

// Individual set log
export interface SetLog {
  id: string;
  exercise_log_id: string;
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
  rpe: number | null;
  rir: number | null;
  rest_seconds: number | null;
  notes: string | null;
  is_pr: boolean;
  is_dropset?: boolean;
  superset_group_id?: string | null;
  created_at: string;
}

// Meal log
export interface MealLog {
  id: string;
  user_id: string;
  meal_name: string;
  meal_date: string;
  is_training_day: boolean;
  created_at: string;
  // Joined
  meal_items?: MealItem[];
}

// Meal item
export interface MealItem {
  id: string;
  meal_log_id: string;
  food_id: string | null;
  custom_food_name: string | null;
  quantity_g: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  created_at: string;
  // Joined
  food?: Food;
}

// Grocery item
export interface GroceryItem {
  id: string;
  user_id: string;
  item_name: string;
  category: GroceryCategory;
  quantity: string | null;
  store_note: string | null;
  is_bought: boolean;
  created_at: string;
  updated_at: string;
}

// Supplement
export interface Supplement {
  id: string;
  user_id: string;
  name: string;
  purpose: string | null;
  timing: TimingType[] | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

// Supplement log
export interface SupplementLog {
  id: string;
  supplement_id: string;
  user_id: string;
  taken_date: string;
  taken: boolean;
  created_at: string;
  // Joined
  supplement?: Supplement;
}

// Compound reference (system data)
export interface CompoundReference {
  id: string;
  name: string;
  purpose: string | null;
  risks_cautions: string | null;
  created_at: string;
}

// User compound tracking
export interface UserCompound {
  id: string;
  user_id: string;
  compound_id: string;
  status: CompoundStatus;
  personal_notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  compound?: CompoundReference;
}

// Body metrics
export interface BodyMetric {
  id: string;
  user_id: string;
  recorded_date: string;
  weight_kg: number | null;
  body_fat_percent: number | null;
  waist_cm: number | null;
  chest_cm: number | null;
  arms_cm: number | null;
  legs_cm: number | null;
  inbody_score: number | null;
  whoop_recovery: number | null;
  whoop_sleep_hours: number | null;
  notes: string | null;
  created_at: string;
}

// Progress photo
export interface ProgressPhoto {
  id: string;
  user_id: string;
  storage_path: string;
  recorded_date: string;
  notes: string | null;
  created_at: string;
}

// Dashboard stats
export interface DashboardStats {
  todayWorkout: WorkoutLog | null;
  weeklyWorkoutsCompleted: number;
  weeklyWorkoutsPlanned: number;
  weeklySetsByMuscle: { muscle: string; sets: number }[];
  totalWeeklyVolume: number;
  todayCalories: number;
  todayProtein: number;
  targetCalories: number;
  targetProtein: number;
  supplementsToday: { total: number; taken: number };
  weightTrend: { date: string; weight: number }[];
}

// Workout day display info
export const WORKOUT_DAY_INFO: Record<WorkoutDayType, { label: string; color: string; muscles: string[] }> = {
  shoulders_arms: { 
    label: 'Shoulders + Arms', 
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    muscles: ['Shoulders', 'Biceps', 'Triceps']
  },
  chest_back: { 
    label: 'Chest + Back', 
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    muscles: ['Chest', 'Back']
  },
  legs: { 
    label: 'Legs', 
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    muscles: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves']
  },
  rest: { 
    label: 'Rest Day', 
    color: 'bg-muted text-muted-foreground border-muted',
    muscles: []
  },
};

// Equipment display
export const EQUIPMENT_INFO: Record<EquipmentType, { label: string; icon: string }> = {
  barbell: { label: 'Barbell', icon: '🏋️' },
  dumbbell: { label: 'Dumbbell', icon: '💪' },
  cable: { label: 'Cable', icon: '🔗' },
  machine: { label: 'Machine', icon: '⚙️' },
  bodyweight: { label: 'Bodyweight', icon: '🧘' },
  kettlebell: { label: 'Kettlebell', icon: '🔔' },
  resistance_band: { label: 'Band', icon: '➰' },
  other: { label: 'Other', icon: '📦' },
};

// Grocery category display
export const GROCERY_CATEGORY_INFO: Record<GroceryCategory, { label: string; color: string }> = {
  protein: { label: 'Protein', color: 'bg-red-500/20 text-red-400' },
  carbs: { label: 'Carbs', color: 'bg-amber-500/20 text-amber-400' },
  vegetables: { label: 'Vegetables', color: 'bg-emerald-500/20 text-emerald-400' },
  fruits: { label: 'Fruits', color: 'bg-orange-500/20 text-orange-400' },
  supplements: { label: 'Supplements', color: 'bg-purple-500/20 text-purple-400' },
  snacks: { label: 'Snacks', color: 'bg-pink-500/20 text-pink-400' },
  dairy: { label: 'Dairy', color: 'bg-blue-500/20 text-blue-400' },
  fats: { label: 'Fats', color: 'bg-yellow-500/20 text-yellow-400' },
  other: { label: 'Other', color: 'bg-muted text-muted-foreground' },
};

// Timing display
export const TIMING_INFO: Record<TimingType, { label: string; time: string }> = {
  AM: { label: 'Morning', time: '🌅 AM' },
  PM: { label: 'Evening', time: '🌙 PM' },
  pre_workout: { label: 'Pre-workout', time: '⚡ Pre' },
  post_workout: { label: 'Post-workout', time: '💪 Post' },
  with_meal: { label: 'With meal', time: '🍽️ Meal' },
};
