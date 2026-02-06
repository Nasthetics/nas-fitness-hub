-- Create enum types
CREATE TYPE public.equipment_type AS ENUM ('barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell', 'resistance_band', 'other');
CREATE TYPE public.timing_type AS ENUM ('AM', 'PM', 'pre_workout', 'post_workout', 'with_meal');
CREATE TYPE public.compound_status AS ENUM ('researching', 'avoid', 'ask_doctor');
CREATE TYPE public.grocery_category AS ENUM ('protein', 'carbs', 'vegetables', 'fruits', 'supplements', 'snacks', 'dairy', 'fats', 'other');
CREATE TYPE public.workout_day_type AS ENUM ('shoulders_arms', 'chest_back', 'legs', 'rest');

-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  -- Nutrition targets
  training_day_calories INTEGER DEFAULT 2800,
  training_day_protein INTEGER DEFAULT 200,
  training_day_carbs INTEGER DEFAULT 300,
  training_day_fats INTEGER DEFAULT 80,
  rest_day_calories INTEGER DEFAULT 2200,
  rest_day_protein INTEGER DEFAULT 180,
  rest_day_carbs INTEGER DEFAULT 200,
  rest_day_fats INTEGER DEFAULT 70
);

-- Muscle groups (system data)
CREATE TABLE public.muscle_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0
);

-- Exercise library (system data - pre-populated)
CREATE TABLE public.exercise_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  primary_muscle UUID REFERENCES public.muscle_groups(id),
  secondary_muscle UUID REFERENCES public.muscle_groups(id),
  equipment equipment_type NOT NULL,
  substitutions TEXT[],
  coaching_cues TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Food database (system data - pre-populated)
CREATE TABLE public.food_database (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  calories_per_100g DECIMAL(10,2) NOT NULL,
  protein_per_100g DECIMAL(10,2) NOT NULL,
  carbs_per_100g DECIMAL(10,2) NOT NULL,
  fats_per_100g DECIMAL(10,2) NOT NULL,
  fiber_per_100g DECIMAL(10,2) DEFAULT 0,
  serving_size_g INTEGER DEFAULT 100,
  category grocery_category DEFAULT 'other',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Compounds reference (system data - educational only)
CREATE TABLE public.compounds_reference (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  purpose TEXT,
  risks_cautions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- User workout templates (their 6-day split)
CREATE TABLE public.workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  day_type workout_day_type NOT NULL,
  day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 7),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Template exercises (exercises in each workout template)
CREATE TABLE public.template_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.workout_templates(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.exercise_library(id) NOT NULL,
  exercise_order INTEGER NOT NULL,
  default_sets INTEGER DEFAULT 4,
  default_reps INTEGER DEFAULT 10,
  default_rest_seconds INTEGER DEFAULT 90,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Workout logs (actual logged workouts)
CREATE TABLE public.workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES public.workout_templates(id),
  workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Exercise logs (individual exercise within a workout)
CREATE TABLE public.exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_log_id UUID REFERENCES public.workout_logs(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.exercise_library(id) NOT NULL,
  exercise_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Set logs (individual sets within an exercise)
CREATE TABLE public.set_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_log_id UUID REFERENCES public.exercise_logs(id) ON DELETE CASCADE NOT NULL,
  set_number INTEGER NOT NULL,
  reps INTEGER,
  weight_kg DECIMAL(10,2),
  rpe INTEGER CHECK (rpe >= 1 AND rpe <= 10),
  rest_seconds INTEGER,
  notes TEXT,
  is_pr BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Meal logs
CREATE TABLE public.meal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  meal_name TEXT NOT NULL,
  meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_training_day BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Meal items (foods in a meal)
CREATE TABLE public.meal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_log_id UUID REFERENCES public.meal_logs(id) ON DELETE CASCADE NOT NULL,
  food_id UUID REFERENCES public.food_database(id),
  custom_food_name TEXT,
  quantity_g DECIMAL(10,2) NOT NULL,
  calories DECIMAL(10,2) NOT NULL,
  protein DECIMAL(10,2) NOT NULL,
  carbs DECIMAL(10,2) NOT NULL,
  fats DECIMAL(10,2) NOT NULL,
  fiber DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Grocery list
CREATE TABLE public.grocery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_name TEXT NOT NULL,
  category grocery_category DEFAULT 'other',
  quantity TEXT,
  store_note TEXT,
  is_bought BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Supplements (user's personal stack)
CREATE TABLE public.supplements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  purpose TEXT,
  timing timing_type[],
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Supplement logs (daily tracking)
CREATE TABLE public.supplement_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplement_id UUID REFERENCES public.supplements(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  taken_date DATE NOT NULL DEFAULT CURRENT_DATE,
  taken BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(supplement_id, taken_date)
);

-- User compounds tracking (personal notes only)
CREATE TABLE public.user_compounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  compound_id UUID REFERENCES public.compounds_reference(id) NOT NULL,
  status compound_status DEFAULT 'researching',
  personal_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Body metrics
CREATE TABLE public.body_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg DECIMAL(10,2),
  body_fat_percent DECIMAL(5,2),
  waist_cm DECIMAL(10,2),
  chest_cm DECIMAL(10,2),
  arms_cm DECIMAL(10,2),
  legs_cm DECIMAL(10,2),
  inbody_score INTEGER,
  whoop_recovery INTEGER,
  whoop_sleep_hours DECIMAL(4,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Progress photos storage
CREATE TABLE public.progress_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,
  recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muscle_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_database ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compounds_reference ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.set_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplement_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_compounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for system tables (read-only for all authenticated)
CREATE POLICY "Anyone can read muscle groups" ON public.muscle_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read exercise library" ON public.exercise_library FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read food database" ON public.food_database FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read compounds reference" ON public.compounds_reference FOR SELECT TO authenticated USING (true);

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for workout templates
CREATE POLICY "Users can view own templates" ON public.workout_templates FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own templates" ON public.workout_templates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON public.workout_templates FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own templates" ON public.workout_templates FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for template exercises (through template ownership)
CREATE POLICY "Users can view template exercises" ON public.template_exercises FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.workout_templates WHERE id = template_id AND user_id = auth.uid()));
CREATE POLICY "Users can create template exercises" ON public.template_exercises FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM public.workout_templates WHERE id = template_id AND user_id = auth.uid()));
CREATE POLICY "Users can update template exercises" ON public.template_exercises FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.workout_templates WHERE id = template_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete template exercises" ON public.template_exercises FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.workout_templates WHERE id = template_id AND user_id = auth.uid()));

-- RLS Policies for workout logs
CREATE POLICY "Users can view own workout logs" ON public.workout_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own workout logs" ON public.workout_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workout logs" ON public.workout_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workout logs" ON public.workout_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for exercise logs (through workout log ownership)
CREATE POLICY "Users can view exercise logs" ON public.exercise_logs FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.workout_logs WHERE id = workout_log_id AND user_id = auth.uid()));
CREATE POLICY "Users can create exercise logs" ON public.exercise_logs FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM public.workout_logs WHERE id = workout_log_id AND user_id = auth.uid()));
CREATE POLICY "Users can update exercise logs" ON public.exercise_logs FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.workout_logs WHERE id = workout_log_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete exercise logs" ON public.exercise_logs FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.workout_logs WHERE id = workout_log_id AND user_id = auth.uid()));

-- RLS Policies for set logs (through exercise log -> workout log ownership)
CREATE POLICY "Users can view set logs" ON public.set_logs FOR SELECT TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM public.exercise_logs el 
    JOIN public.workout_logs wl ON el.workout_log_id = wl.id 
    WHERE el.id = exercise_log_id AND wl.user_id = auth.uid()
  ));
CREATE POLICY "Users can create set logs" ON public.set_logs FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.exercise_logs el 
    JOIN public.workout_logs wl ON el.workout_log_id = wl.id 
    WHERE el.id = exercise_log_id AND wl.user_id = auth.uid()
  ));
CREATE POLICY "Users can update set logs" ON public.set_logs FOR UPDATE TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM public.exercise_logs el 
    JOIN public.workout_logs wl ON el.workout_log_id = wl.id 
    WHERE el.id = exercise_log_id AND wl.user_id = auth.uid()
  ));
CREATE POLICY "Users can delete set logs" ON public.set_logs FOR DELETE TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM public.exercise_logs el 
    JOIN public.workout_logs wl ON el.workout_log_id = wl.id 
    WHERE el.id = exercise_log_id AND wl.user_id = auth.uid()
  ));

-- RLS Policies for meal logs
CREATE POLICY "Users can view own meal logs" ON public.meal_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own meal logs" ON public.meal_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meal logs" ON public.meal_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meal logs" ON public.meal_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for meal items (through meal log ownership)
CREATE POLICY "Users can view meal items" ON public.meal_items FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.meal_logs WHERE id = meal_log_id AND user_id = auth.uid()));
CREATE POLICY "Users can create meal items" ON public.meal_items FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM public.meal_logs WHERE id = meal_log_id AND user_id = auth.uid()));
CREATE POLICY "Users can update meal items" ON public.meal_items FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.meal_logs WHERE id = meal_log_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete meal items" ON public.meal_items FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.meal_logs WHERE id = meal_log_id AND user_id = auth.uid()));

-- RLS Policies for grocery items
CREATE POLICY "Users can view own grocery items" ON public.grocery_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own grocery items" ON public.grocery_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own grocery items" ON public.grocery_items FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own grocery items" ON public.grocery_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for supplements
CREATE POLICY "Users can view own supplements" ON public.supplements FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own supplements" ON public.supplements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own supplements" ON public.supplements FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own supplements" ON public.supplements FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for supplement logs
CREATE POLICY "Users can view own supplement logs" ON public.supplement_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own supplement logs" ON public.supplement_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own supplement logs" ON public.supplement_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own supplement logs" ON public.supplement_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for user compounds
CREATE POLICY "Users can view own compounds" ON public.user_compounds FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own compounds" ON public.user_compounds FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own compounds" ON public.user_compounds FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own compounds" ON public.user_compounds FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for body metrics
CREATE POLICY "Users can view own body metrics" ON public.body_metrics FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own body metrics" ON public.body_metrics FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own body metrics" ON public.body_metrics FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own body metrics" ON public.body_metrics FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for progress photos
CREATE POLICY "Users can view own progress photos" ON public.progress_photos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own progress photos" ON public.progress_photos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own progress photos" ON public.progress_photos FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create storage bucket for progress photos
INSERT INTO storage.buckets (id, name, public) VALUES ('progress-photos', 'progress-photos', false);

-- Storage policies for progress photos bucket
CREATE POLICY "Users can upload own progress photos" ON storage.objects FOR INSERT TO authenticated 
  WITH CHECK (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own progress photos" ON storage.objects FOR SELECT TO authenticated 
  USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own progress photos" ON storage.objects FOR DELETE TO authenticated 
  USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_workout_templates_updated_at BEFORE UPDATE ON public.workout_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_workout_logs_updated_at BEFORE UPDATE ON public.workout_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_grocery_items_updated_at BEFORE UPDATE ON public.grocery_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_compounds_updated_at BEFORE UPDATE ON public.user_compounds FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();