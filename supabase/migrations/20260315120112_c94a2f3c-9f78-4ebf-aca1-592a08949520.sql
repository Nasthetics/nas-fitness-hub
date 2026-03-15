
-- Create cardio_logs table
CREATE TABLE public.cardio_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL DEFAULT 'run',
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  distance_km NUMERIC NULL,
  avg_heart_rate INTEGER NULL,
  perceived_effort INTEGER NULL DEFAULT 5,
  calories_burned INTEGER NULL,
  notes TEXT NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cardio_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own cardio logs" ON public.cardio_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own cardio logs" ON public.cardio_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cardio logs" ON public.cardio_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cardio logs" ON public.cardio_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);
