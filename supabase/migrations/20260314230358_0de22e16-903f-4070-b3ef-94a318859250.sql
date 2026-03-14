
-- Add RIR column to set_logs
ALTER TABLE public.set_logs ADD COLUMN IF NOT EXISTS rir integer;

-- Add profile columns
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS height_cm numeric,
  ADD COLUMN IF NOT EXISTS body_fat_percent numeric,
  ADD COLUMN IF NOT EXISTS lean_mass_kg numeric,
  ADD COLUMN IF NOT EXISTS target_weight_gain_per_week numeric DEFAULT 0.3,
  ADD COLUMN IF NOT EXISTS water_target_ml integer DEFAULT 4000,
  ADD COLUMN IF NOT EXISTS ramadan_mode boolean DEFAULT false;

-- Create recovery_checkins table
CREATE TABLE public.recovery_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  checkin_date date NOT NULL DEFAULT CURRENT_DATE,
  sleep_hours numeric,
  sleep_quality integer,
  energy integer,
  stress integer,
  breathwork_done boolean DEFAULT false,
  recovery_score integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, checkin_date)
);

ALTER TABLE public.recovery_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recovery checkins" ON public.recovery_checkins FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own recovery checkins" ON public.recovery_checkins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recovery checkins" ON public.recovery_checkins FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recovery checkins" ON public.recovery_checkins FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create periodization_plans table
CREATE TABLE public.periodization_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Current Mesocycle',
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  current_week integer NOT NULL DEFAULT 1,
  phase text NOT NULL DEFAULT 'hypertrophy',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.periodization_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own periodization plans" ON public.periodization_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own periodization plans" ON public.periodization_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own periodization plans" ON public.periodization_plans FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own periodization plans" ON public.periodization_plans FOR DELETE TO authenticated USING (auth.uid() = user_id);
