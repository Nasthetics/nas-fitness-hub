
-- Water logs table
CREATE TABLE public.water_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_ml INTEGER NOT NULL DEFAULT 250,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own water logs" ON public.water_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own water logs" ON public.water_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own water logs" ON public.water_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- PR history table
CREATE TABLE public.pr_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exercise_id UUID REFERENCES public.exercise_library(id) ON DELETE CASCADE NOT NULL,
  pr_type TEXT NOT NULL DEFAULT '1rm',
  weight_kg NUMERIC NOT NULL,
  reps INTEGER NOT NULL DEFAULT 1,
  previous_weight_kg NUMERIC,
  previous_reps INTEGER,
  recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pr_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own PRs" ON public.pr_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own PRs" ON public.pr_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own PRs" ON public.pr_history FOR DELETE TO authenticated USING (auth.uid() = user_id);
