-- Fix search_path warning for update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Insert muscle groups
INSERT INTO public.muscle_groups (name, display_order) VALUES
  ('Chest', 1),
  ('Back', 2),
  ('Shoulders', 3),
  ('Biceps', 4),
  ('Triceps', 5),
  ('Forearms', 6),
  ('Quadriceps', 7),
  ('Hamstrings', 8),
  ('Glutes', 9),
  ('Calves', 10),
  ('Core', 11),
  ('Traps', 12);

-- Insert exercises for each muscle group
-- Chest exercises
INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Barbell Bench Press', mg1.id, mg2.id, 'barbell', ARRAY['Dumbbell Press', 'Machine Chest Press'], 'Arch back slightly, retract shoulders, drive feet into floor'
FROM public.muscle_groups mg1, public.muscle_groups mg2 WHERE mg1.name = 'Chest' AND mg2.name = 'Triceps';

INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Incline Dumbbell Press', mg1.id, mg2.id, 'dumbbell', ARRAY['Incline Barbell Press', 'Incline Machine Press'], '30-45 degree angle, control the negative'
FROM public.muscle_groups mg1, public.muscle_groups mg2 WHERE mg1.name = 'Chest' AND mg2.name = 'Shoulders';

INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Cable Flyes', mg1.id, NULL, 'cable', ARRAY['Dumbbell Flyes', 'Pec Deck'], 'Slight bend in elbows, squeeze at peak contraction'
FROM public.muscle_groups mg1 WHERE mg1.name = 'Chest';

INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Machine Chest Press', mg1.id, mg2.id, 'machine', ARRAY['Barbell Bench Press', 'Push-ups'], 'Adjust seat height, full range of motion'
FROM public.muscle_groups mg1, public.muscle_groups mg2 WHERE mg1.name = 'Chest' AND mg2.name = 'Triceps';

INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Dips (Chest)', mg1.id, mg2.id, 'bodyweight', ARRAY['Decline Press', 'Cable Crossovers'], 'Lean forward, elbows flared out'
FROM public.muscle_groups mg1, public.muscle_groups mg2 WHERE mg1.name = 'Chest' AND mg2.name = 'Triceps';

-- Back exercises
INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Barbell Rows', mg1.id, mg2.id, 'barbell', ARRAY['Dumbbell Rows', 'Cable Rows'], 'Hinge at hips, pull to lower chest'
FROM public.muscle_groups mg1, public.muscle_groups mg2 WHERE mg1.name = 'Back' AND mg2.name = 'Biceps';

INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Lat Pulldowns', mg1.id, mg2.id, 'cable', ARRAY['Pull-ups', 'Machine Pulldown'], 'Lead with elbows, squeeze lats at bottom'
FROM public.muscle_groups mg1, public.muscle_groups mg2 WHERE mg1.name = 'Back' AND mg2.name = 'Biceps';

INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Seated Cable Rows', mg1.id, mg2.id, 'cable', ARRAY['Machine Rows', 'Dumbbell Rows'], 'Keep chest up, squeeze shoulder blades'
FROM public.muscle_groups mg1, public.muscle_groups mg2 WHERE mg1.name = 'Back' AND mg2.name = 'Biceps';

INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Pull-ups', mg1.id, mg2.id, 'bodyweight', ARRAY['Lat Pulldowns', 'Assisted Pull-ups'], 'Full extension at bottom, chin over bar'
FROM public.muscle_groups mg1, public.muscle_groups mg2 WHERE mg1.name = 'Back' AND mg2.name = 'Biceps';

INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'T-Bar Rows', mg1.id, mg2.id, 'barbell', ARRAY['Cable Rows', 'Machine Rows'], 'Keep back flat, pull to chest'
FROM public.muscle_groups mg1, public.muscle_groups mg2 WHERE mg1.name = 'Back' AND mg2.name = 'Biceps';

INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Face Pulls', mg1.id, mg2.id, 'cable', ARRAY['Reverse Flyes', 'Band Pull-aparts'], 'External rotation at end, squeeze rear delts'
FROM public.muscle_groups mg1, public.muscle_groups mg2 WHERE mg1.name = 'Back' AND mg2.name = 'Shoulders';

-- Shoulder exercises
INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Overhead Press', mg1.id, mg2.id, 'barbell', ARRAY['Dumbbell Press', 'Machine Press'], 'Core tight, press overhead in straight line'
FROM public.muscle_groups mg1, public.muscle_groups mg2 WHERE mg1.name = 'Shoulders' AND mg2.name = 'Triceps';

INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Dumbbell Lateral Raises', mg1.id, NULL, 'dumbbell', ARRAY['Cable Lateral Raises', 'Machine Lateral Raises'], 'Slight bend in elbows, lead with pinky'
FROM public.muscle_groups mg1 WHERE mg1.name = 'Shoulders';

INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Dumbbell Front Raises', mg1.id, NULL, 'dumbbell', ARRAY['Cable Front Raises', 'Plate Front Raises'], 'Alternate arms, control the movement'
FROM public.muscle_groups mg1 WHERE mg1.name = 'Shoulders';

INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Rear Delt Flyes', mg1.id, NULL, 'dumbbell', ARRAY['Reverse Pec Deck', 'Face Pulls'], 'Hinge at hips, squeeze shoulder blades'
FROM public.muscle_groups mg1 WHERE mg1.name = 'Shoulders';

INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Arnold Press', mg1.id, mg2.id, 'dumbbell', ARRAY['Dumbbell Shoulder Press', 'Machine Press'], 'Rotate palms during press, full ROM'
FROM public.muscle_groups mg1, public.muscle_groups mg2 WHERE mg1.name = 'Shoulders' AND mg2.name = 'Triceps';

-- Biceps exercises
INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Barbell Curls', mg1.id, mg2.id, 'barbell', ARRAY['Dumbbell Curls', 'Cable Curls'], 'Keep elbows pinned, squeeze at top'
FROM public.muscle_groups mg1, public.muscle_groups mg2 WHERE mg1.name = 'Biceps' AND mg2.name = 'Forearms';

INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Dumbbell Hammer Curls', mg1.id, mg2.id, 'dumbbell', ARRAY['Cable Hammer Curls', 'Rope Curls'], 'Neutral grip, alternate or together'
FROM public.muscle_groups mg1, public.muscle_groups mg2 WHERE mg1.name = 'Biceps' AND mg2.name = 'Forearms';

INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Incline Dumbbell Curls', mg1.id, NULL, 'dumbbell', ARRAY['Preacher Curls', 'Cable Curls'], 'Full stretch at bottom, control negative'
FROM public.muscle_groups mg1 WHERE mg1.name = 'Biceps';

INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Preacher Curls', mg1.id, NULL, 'dumbbell', ARRAY['Machine Preacher Curls', 'Cable Curls'], 'Keep upper arms on pad, squeeze at top'
FROM public.muscle_groups mg1 WHERE mg1.name = 'Biceps';

INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Cable Curls', mg1.id, NULL, 'cable', ARRAY['Barbell Curls', 'Dumbbell Curls'], 'Constant tension, squeeze at peak'
FROM public.muscle_groups mg1 WHERE mg1.name = 'Biceps';

-- Triceps exercises
INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Tricep Pushdowns', mg1.id, NULL, 'cable', ARRAY['Dumbbell Kickbacks', 'Dips'], 'Keep elbows pinned, full extension'
FROM public.muscle_groups mg1 WHERE mg1.name = 'Triceps';

INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Overhead Tricep Extension', mg1.id, NULL, 'cable', ARRAY['Dumbbell Overhead Extension', 'Skull Crushers'], 'Keep elbows close to head, full stretch'
FROM public.muscle_groups mg1 WHERE mg1.name = 'Triceps';

INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Skull Crushers', mg1.id, NULL, 'barbell', ARRAY['Cable Extensions', 'Dumbbell Extensions'], 'Lower to forehead, keep elbows stable'
FROM public.muscle_groups mg1 WHERE mg1.name = 'Triceps';

INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Close Grip Bench Press', mg1.id, mg2.id, 'barbell', ARRAY['Diamond Push-ups', 'Dips'], 'Hands shoulder-width, elbows close to body'
FROM public.muscle_groups mg1, public.muscle_groups mg2 WHERE mg1.name = 'Triceps' AND mg2.name = 'Chest';

INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Dips (Triceps)', mg1.id, mg2.id, 'bodyweight', ARRAY['Close Grip Bench', 'Pushdowns'], 'Upright torso, elbows back'
FROM public.muscle_groups mg1, public.muscle_groups mg2 WHERE mg1.name = 'Triceps' AND mg2.name = 'Chest';

-- Leg exercises
INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Barbell Squats', mg1.id, mg2.id, 'barbell', ARRAY['Leg Press', 'Goblet Squats'], 'Chest up, knees track over toes'
FROM public.muscle_groups mg1, public.muscle_groups mg2 WHERE mg1.name = 'Quadriceps' AND mg2.name = 'Glutes';

INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Leg Press', mg1.id, mg2.id, 'machine', ARRAY['Squats', 'Hack Squats'], 'Full depth, dont lock knees'
FROM public.muscle_groups mg1, public.muscle_groups mg2 WHERE mg1.name = 'Quadriceps' AND mg2.name = 'Glutes';

INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Leg Extensions', mg1.id, NULL, 'machine', ARRAY['Sissy Squats', 'Walking Lunges'], 'Squeeze at top, control negative'
FROM public.muscle_groups mg1 WHERE mg1.name = 'Quadriceps';

INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Romanian Deadlifts', mg1.id, mg2.id, 'barbell', ARRAY['Stiff Leg Deadlifts', 'Good Mornings'], 'Hinge at hips, slight knee bend'
FROM public.muscle_groups mg1, public.muscle_groups mg2 WHERE mg1.name = 'Hamstrings' AND mg2.name = 'Glutes';

INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Leg Curls', mg1.id, NULL, 'machine', ARRAY['Nordic Curls', 'Swiss Ball Curls'], 'Full contraction, control eccentric'
FROM public.muscle_groups mg1 WHERE mg1.name = 'Hamstrings';

INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Hip Thrusts', mg1.id, mg2.id, 'barbell', ARRAY['Cable Pull-throughs', 'Glute Bridges'], 'Full hip extension, squeeze glutes at top'
FROM public.muscle_groups mg1, public.muscle_groups mg2 WHERE mg1.name = 'Glutes' AND mg2.name = 'Hamstrings';

INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Walking Lunges', mg1.id, mg2.id, 'dumbbell', ARRAY['Static Lunges', 'Bulgarian Split Squats'], 'Long stride, torso upright'
FROM public.muscle_groups mg1, public.muscle_groups mg2 WHERE mg1.name = 'Quadriceps' AND mg2.name = 'Glutes';

INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Bulgarian Split Squats', mg1.id, mg2.id, 'dumbbell', ARRAY['Lunges', 'Step-ups'], 'Rear foot elevated, deep stretch'
FROM public.muscle_groups mg1, public.muscle_groups mg2 WHERE mg1.name = 'Quadriceps' AND mg2.name = 'Glutes';

INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Calf Raises (Standing)', mg1.id, NULL, 'machine', ARRAY['Seated Calf Raises', 'Donkey Calf Raises'], 'Full stretch, pause at top'
FROM public.muscle_groups mg1 WHERE mg1.name = 'Calves';

INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Seated Calf Raises', mg1.id, NULL, 'machine', ARRAY['Standing Calf Raises', 'Smith Machine Calf Raises'], 'Slow controlled reps, full ROM'
FROM public.muscle_groups mg1 WHERE mg1.name = 'Calves';

INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Hack Squats', mg1.id, mg2.id, 'machine', ARRAY['Leg Press', 'Front Squats'], 'Keep back flat against pad'
FROM public.muscle_groups mg1, public.muscle_groups mg2 WHERE mg1.name = 'Quadriceps' AND mg2.name = 'Glutes';

-- Core exercises
INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Cable Crunches', mg1.id, NULL, 'cable', ARRAY['Weighted Crunches', 'Ab Wheel'], 'Round spine, exhale on contraction'
FROM public.muscle_groups mg1 WHERE mg1.name = 'Core';

INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Hanging Leg Raises', mg1.id, NULL, 'bodyweight', ARRAY['Lying Leg Raises', 'Captain Chair'], 'Control the swing, curl pelvis up'
FROM public.muscle_groups mg1 WHERE mg1.name = 'Core';

INSERT INTO public.exercise_library (name, primary_muscle, secondary_muscle, equipment, substitutions, coaching_cues)
SELECT 'Planks', mg1.id, NULL, 'bodyweight', ARRAY['Dead Bug', 'Ab Wheel'], 'Maintain neutral spine, squeeze glutes'
FROM public.muscle_groups mg1 WHERE mg1.name = 'Core';

-- Insert food database
INSERT INTO public.food_database (name, calories_per_100g, protein_per_100g, carbs_per_100g, fats_per_100g, fiber_per_100g, serving_size_g, category) VALUES
  -- Proteins
  ('Chicken Breast (Cooked)', 165, 31, 0, 3.6, 0, 150, 'protein'),
  ('Chicken Thigh (Cooked)', 209, 26, 0, 11, 0, 150, 'protein'),
  ('Ground Beef (90% lean)', 176, 20, 0, 10, 0, 150, 'protein'),
  ('Beef Steak (Sirloin)', 206, 26, 0, 11, 0, 200, 'protein'),
  ('Salmon (Cooked)', 208, 20, 0, 13, 0, 150, 'protein'),
  ('Tilapia (Cooked)', 128, 26, 0, 3, 0, 150, 'protein'),
  ('Shrimp (Cooked)', 99, 24, 0, 0.3, 0, 100, 'protein'),
  ('Tuna (Canned)', 116, 26, 0, 1, 0, 100, 'protein'),
  ('Eggs (Whole)', 155, 13, 1.1, 11, 0, 50, 'protein'),
  ('Egg Whites', 52, 11, 0.7, 0.2, 0, 100, 'protein'),
  ('Turkey Breast', 135, 30, 0, 1, 0, 150, 'protein'),
  ('Greek Yogurt (Plain)', 100, 17, 6, 0.7, 0, 200, 'protein'),
  ('Cottage Cheese (Low-fat)', 98, 11, 3.4, 4.3, 0, 150, 'protein'),
  ('Whey Protein Powder', 400, 80, 8, 4, 0, 30, 'protein'),
  ('Casein Protein Powder', 370, 80, 4, 2, 0, 30, 'protein'),
  
  -- Carbs
  ('White Rice (Cooked)', 130, 2.7, 28, 0.3, 0.4, 200, 'carbs'),
  ('Brown Rice (Cooked)', 112, 2.6, 24, 0.9, 1.8, 200, 'carbs'),
  ('Jasmine Rice (Cooked)', 129, 2.7, 28, 0.2, 0.4, 200, 'carbs'),
  ('Oatmeal (Cooked)', 68, 2.4, 12, 1.4, 1.7, 250, 'carbs'),
  ('Sweet Potato (Cooked)', 86, 1.6, 20, 0.1, 3, 200, 'carbs'),
  ('White Potato (Cooked)', 87, 1.9, 20, 0.1, 1.8, 200, 'carbs'),
  ('Pasta (Cooked)', 131, 5, 25, 1.1, 1.8, 200, 'carbs'),
  ('Whole Wheat Bread', 247, 13, 41, 3.4, 7, 50, 'carbs'),
  ('White Bread', 265, 9, 49, 3.2, 2.7, 50, 'carbs'),
  ('Quinoa (Cooked)', 120, 4.4, 21, 1.9, 2.8, 200, 'carbs'),
  ('Bagel', 257, 10, 50, 1.6, 2.1, 100, 'carbs'),
  ('Cream of Rice (Cooked)', 52, 0.8, 11, 0.1, 0.2, 250, 'carbs'),
  
  -- Vegetables
  ('Broccoli', 34, 2.8, 7, 0.4, 2.6, 150, 'vegetables'),
  ('Spinach', 23, 2.9, 3.6, 0.4, 2.2, 100, 'vegetables'),
  ('Asparagus', 20, 2.2, 3.9, 0.1, 2.1, 150, 'vegetables'),
  ('Green Beans', 31, 1.8, 7, 0.1, 3.4, 150, 'vegetables'),
  ('Bell Peppers', 26, 1, 6, 0.2, 1.7, 150, 'vegetables'),
  ('Cucumber', 16, 0.7, 3.6, 0.1, 0.5, 150, 'vegetables'),
  ('Tomatoes', 18, 0.9, 3.9, 0.2, 1.2, 150, 'vegetables'),
  ('Zucchini', 17, 1.2, 3.1, 0.3, 1, 150, 'vegetables'),
  ('Mixed Salad Greens', 20, 1.5, 3.5, 0.3, 2, 100, 'vegetables'),
  
  -- Fruits
  ('Banana', 89, 1.1, 23, 0.3, 2.6, 120, 'fruits'),
  ('Apple', 52, 0.3, 14, 0.2, 2.4, 180, 'fruits'),
  ('Blueberries', 57, 0.7, 14, 0.3, 2.4, 150, 'fruits'),
  ('Strawberries', 32, 0.7, 7.7, 0.3, 2, 150, 'fruits'),
  ('Orange', 47, 0.9, 12, 0.1, 2.4, 180, 'fruits'),
  ('Grapes', 69, 0.7, 18, 0.2, 0.9, 150, 'fruits'),
  ('Watermelon', 30, 0.6, 7.6, 0.2, 0.4, 200, 'fruits'),
  
  -- Fats
  ('Olive Oil', 884, 0, 0, 100, 0, 15, 'fats'),
  ('Coconut Oil', 862, 0, 0, 100, 0, 15, 'fats'),
  ('Avocado', 160, 2, 9, 15, 7, 150, 'fats'),
  ('Almonds', 579, 21, 22, 50, 12, 30, 'fats'),
  ('Peanut Butter', 588, 25, 20, 50, 6, 32, 'fats'),
  ('Almond Butter', 614, 21, 19, 56, 10, 32, 'fats'),
  ('Walnuts', 654, 15, 14, 65, 7, 30, 'fats'),
  ('Cashews', 553, 18, 30, 44, 3, 30, 'fats'),
  
  -- Dairy
  ('Whole Milk', 61, 3.2, 4.8, 3.3, 0, 250, 'dairy'),
  ('Skim Milk', 34, 3.4, 5, 0.1, 0, 250, 'dairy'),
  ('Cheddar Cheese', 402, 25, 1.3, 33, 0, 30, 'dairy'),
  ('Mozzarella Cheese', 280, 28, 2.2, 17, 0, 30, 'dairy'),
  ('Butter', 717, 0.9, 0.1, 81, 0, 14, 'dairy'),
  
  -- Snacks
  ('Rice Cakes', 387, 8, 81, 3, 4, 30, 'snacks'),
  ('Dark Chocolate (70%)', 598, 8, 46, 43, 11, 30, 'snacks'),
  ('Beef Jerky', 410, 33, 11, 26, 1.8, 50, 'snacks'),
  ('Protein Bar', 400, 20, 40, 15, 5, 60, 'snacks'),
  ('Trail Mix', 462, 13, 44, 29, 4, 40, 'snacks'),
  
  -- Supplements
  ('Creatine Monohydrate', 0, 0, 0, 0, 0, 5, 'supplements'),
  ('BCAA Powder', 0, 0, 0, 0, 0, 10, 'supplements'),
  ('Pre-workout', 10, 0, 2, 0, 0, 15, 'supplements');

-- Insert compounds reference (educational only - no dosing)
INSERT INTO public.compounds_reference (name, purpose, risks_cautions) VALUES
  ('Testosterone', 'Primary male hormone associated with muscle growth, strength, and recovery', 'Requires medical supervision. Associated with cardiovascular, liver, and hormonal risks.'),
  ('Nandrolone (Deca)', 'Associated with joint health and muscle tissue', 'Requires medical supervision. Hormonal and cardiovascular considerations.'),
  ('Trenbolone', 'Known as a potent compound in bodybuilding circles', 'Requires medical supervision. Significant health considerations including cardiovascular and mental health.'),
  ('BPC-157', 'Peptide researched for tissue repair properties', 'Research compound. Consult healthcare provider. Limited human studies.'),
  ('TB-500', 'Peptide researched for recovery and healing', 'Research compound. Consult healthcare provider. Limited human studies.'),
  ('GH (Growth Hormone)', 'Hormone associated with recovery and body composition', 'Requires medical supervision. Associated with various health considerations.'),
  ('Anavar (Oxandrolone)', 'Oral compound known in bodybuilding', 'Requires medical supervision. Liver and hormonal considerations.'),
  ('Winstrol (Stanozolol)', 'Oral/injectable compound known in athletics', 'Requires medical supervision. Joint, liver, and cardiovascular considerations.'),
  ('MK-677 (Ibutamoren)', 'GH secretagogue researched for GH elevation', 'Research compound. Blood sugar and water retention considerations.'),
  ('RAD-140 (Testolone)', 'SARM researched for muscle properties', 'Research compound. Limited human data. Liver considerations.'),
  ('LGK-4033 (Ligandrol)', 'SARM researched for muscle and bone properties', 'Research compound. Limited human data. Hormonal considerations.'),
  ('Cardarine (GW-501516)', 'Research compound associated with endurance', 'Research discontinued. Consult healthcare provider before considering.'),
  ('HCG', 'Hormone used in various medical contexts', 'Requires medical supervision. Used in specific protocols.'),
  ('Clomid (Clomiphene)', 'SERM used in medical fertility contexts', 'Requires medical supervision. Vision and hormonal considerations.'),
  ('Anastrozole (Arimidex)', 'Aromatase inhibitor used medically', 'Requires medical supervision. Bone density considerations.');