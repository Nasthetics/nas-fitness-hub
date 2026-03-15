ALTER TABLE public.profiles ALTER COLUMN training_day_calories SET DEFAULT 2556;
ALTER TABLE public.profiles ALTER COLUMN training_day_protein SET DEFAULT 246;
ALTER TABLE public.profiles ALTER COLUMN training_day_carbs SET DEFAULT 189;
ALTER TABLE public.profiles ALTER COLUMN training_day_fats SET DEFAULT 91;
ALTER TABLE public.profiles ALTER COLUMN rest_day_calories SET DEFAULT 2100;
ALTER TABLE public.profiles ALTER COLUMN rest_day_protein SET DEFAULT 200;
ALTER TABLE public.profiles ALTER COLUMN rest_day_carbs SET DEFAULT 150;
ALTER TABLE public.profiles ALTER COLUMN rest_day_fats SET DEFAULT 75;

CREATE POLICY "Authenticated users can insert exercises"
ON public.exercise_library
FOR INSERT
TO authenticated
WITH CHECK (true);