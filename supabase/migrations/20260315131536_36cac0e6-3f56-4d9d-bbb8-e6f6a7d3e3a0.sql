-- Add weekly_workout_target and rest_day_different_targets to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS weekly_workout_target integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS rest_day_different_targets boolean DEFAULT true;

-- Add muscle_subgroup to exercise_library
ALTER TABLE public.exercise_library 
  ADD COLUMN IF NOT EXISTS muscle_subgroup text DEFAULT NULL;