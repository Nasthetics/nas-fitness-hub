import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { 
  MuscleGroup, 
  Exercise, 
  Food, 
  WorkoutTemplate, 
  TemplateExercise,
  WorkoutLog,
  ExerciseLog,
  SetLog,
  MealLog,
  MealItem,
  GroceryItem,
  Supplement,
  SupplementLog,
  CompoundReference,
  UserCompound,
  BodyMetric,
  Profile
} from '@/lib/types';

// ============ MUSCLE GROUPS ============
export function useMuscleGroups() {
  return useQuery({
    queryKey: ['muscle-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('muscle_groups')
        .select('*')
        .order('display_order');
      if (error) throw error;
      return data as MuscleGroup[];
    },
  });
}

// ============ EXERCISE LIBRARY ============
export function useExerciseLibrary() {
  return useQuery({
    queryKey: ['exercise-library'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercise_library')
        .select(`
          *,
          primary:muscle_groups!exercise_library_primary_muscle_fkey(name),
          secondary:muscle_groups!exercise_library_secondary_muscle_fkey(name)
        `)
        .order('name');
      if (error) throw error;
      return data.map(e => ({
        id: e.id,
        name: e.name,
        primary_muscle: e.primary_muscle,
        secondary_muscle: e.secondary_muscle,
        equipment: e.equipment,
        substitutions: e.substitutions,
        coaching_cues: e.coaching_cues,
        image_url: e.image_url,
        created_at: e.created_at,
        primary_muscle_name: e.primary?.name,
        secondary_muscle_name: e.secondary?.name,
      })) as Exercise[];
      return data.map(e => ({
        ...e,
        primary_muscle_name: e.primary?.name,
        secondary_muscle_name: e.secondary?.name,
      })) as Exercise[];
    },
  });
}

// ============ FOOD DATABASE ============
export function useFoodDatabase() {
  return useQuery({
    queryKey: ['food-database'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('food_database')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Food[];
    },
  });
}

// ============ PROFILE ============
const CORRECT_DEFAULTS = {
  training_day_calories: 2556,
  training_day_protein: 246,
  training_day_carbs: 189,
  training_day_fats: 91,
  water_target_ml: 4000,
};

async function migrateStaleProfile(profile: Profile, userId: string) {
  const needsFix =
    profile.training_day_calories === 2800 ||
    profile.training_day_protein === 200 ||
    profile.display_name === 'Anas' ||
    (!profile.display_name);

  if (!needsFix) return profile;

  const updates: Record<string, any> = {};
  if (profile.training_day_calories === 2800) updates.training_day_calories = 2556;
  if (profile.training_day_protein === 200) updates.training_day_protein = 246;
  if (profile.training_day_carbs === 300) updates.training_day_carbs = 189;
  if (profile.training_day_fats === 80) updates.training_day_fats = 91;
  if (profile.display_name === 'Anas' || !profile.display_name) updates.display_name = 'Nas';

  if (Object.keys(updates).length > 0) {
    await supabase.from('profiles').update(updates).eq('user_id', userId);
    return { ...profile, ...updates };
  }
  return profile;
}

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const migrated = await migrateStaleProfile(data as Profile, user.id);
      return migrated as Profile | null;
    },
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

// ============ WORKOUT TEMPLATES ============
export function useWorkoutTemplates() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['workout-templates', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('workout_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('day_number');
      if (error) throw error;
      return data as WorkoutTemplate[];
    },
    enabled: !!user,
  });
}

export function useCreateWorkoutTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (template: Omit<WorkoutTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('workout_templates')
        .insert({ ...template, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-templates'] });
    },
  });
}

// ============ TEMPLATE EXERCISES ============
export function useTemplateExercises(templateId: string | null) {
  return useQuery({
    queryKey: ['template-exercises', templateId],
    queryFn: async () => {
      if (!templateId) return [];
      const { data, error } = await supabase
        .from('template_exercises')
        .select(`
          *,
          exercise:exercise_library(
            *,
            primary:muscle_groups!exercise_library_primary_muscle_fkey(name),
            secondary:muscle_groups!exercise_library_secondary_muscle_fkey(name)
          )
        `)
        .eq('template_id', templateId)
        .order('exercise_order');
      if (error) throw error;
      return data.map(te => ({
        ...te,
        exercise: te.exercise ? {
          ...te.exercise,
          primary_muscle_name: te.exercise.primary?.name,
          secondary_muscle_name: te.exercise.secondary?.name,
        } : undefined,
      })) as TemplateExercise[];
    },
    enabled: !!templateId,
  });
}

export function useAddTemplateExercise() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { template_id: string; exercise_id: string; exercise_order: number }) => {
      const { data: result, error } = await supabase
        .from('template_exercises')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['template-exercises', variables.template_id] });
    },
  });
}

// ============ WORKOUT LOGS ============
export function useWorkoutLogs(startDate?: string, endDate?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['workout-logs', user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from('workout_logs')
        .select(`
          *,
          template:workout_templates(*),
          exercise_logs(
            *,
            exercise:exercise_library(*),
            set_logs(*)
          )
        `)
        .eq('user_id', user.id)
        .order('workout_date', { ascending: false });
      
      if (startDate) query = query.gte('workout_date', startDate);
      if (endDate) query = query.lte('workout_date', endDate);
      
      const { data, error } = await query;
      if (error) throw error;
      return data as WorkoutLog[];
    },
    enabled: !!user,
  });
}

export function useTodayWorkout() {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  
  return useQuery({
    queryKey: ['today-workout', user?.id, today],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('workout_logs')
        .select(`
          *,
          template:workout_templates(*),
          exercise_logs(
            *,
            exercise:exercise_library(
              *,
              primary:muscle_groups!exercise_library_primary_muscle_fkey(name)
            ),
            set_logs(*)
          )
        `)
        .eq('user_id', user.id)
        .eq('workout_date', today)
        .maybeSingle();
      if (error) throw error;
      return data as WorkoutLog | null;
    },
    enabled: !!user,
  });
}

export function useCreateWorkoutLog() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: { template_id?: string | null; workout_date: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data: result, error } = await supabase
        .from('workout_logs')
        .insert({ ...data, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-logs'] });
      queryClient.invalidateQueries({ queryKey: ['today-workout'] });
    },
  });
}

export function useUpdateWorkoutLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<WorkoutLog>) => {
      const { data, error } = await supabase
        .from('workout_logs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-logs'] });
      queryClient.invalidateQueries({ queryKey: ['today-workout'] });
    },
  });
}

// ============ EXERCISE LOGS ============
export function useCreateExerciseLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { workout_log_id: string; exercise_id: string; exercise_order: number }) => {
      const { data: result, error } = await supabase
        .from('exercise_logs')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-logs'] });
      queryClient.invalidateQueries({ queryKey: ['today-workout'] });
    },
  });
}

// ============ SET LOGS ============
export function useCreateSetLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<SetLog, 'id' | 'created_at'>) => {
      const { data: result, error } = await supabase
        .from('set_logs')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-logs'] });
      queryClient.invalidateQueries({ queryKey: ['today-workout'] });
    },
  });
}

export function useUpdateSetLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<SetLog>) => {
      const { data, error } = await supabase
        .from('set_logs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-logs'] });
      queryClient.invalidateQueries({ queryKey: ['today-workout'] });
    },
  });
}

export function useDeleteSetLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('set_logs')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-logs'] });
      queryClient.invalidateQueries({ queryKey: ['today-workout'] });
    },
  });
}

// ============ DELETE EXERCISE LOG ============
export function useDeleteExerciseLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // First delete all set logs for this exercise
      await supabase.from('set_logs').delete().eq('exercise_log_id', id);
      // Then delete the exercise log
      const { error } = await supabase
        .from('exercise_logs')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-logs'] });
      queryClient.invalidateQueries({ queryKey: ['today-workout'] });
    },
  });
}

// ============ PREVIOUS EXERCISE SETS ============
export function usePreviousExerciseSets(exerciseId: string | null, currentDate: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['previous-sets', user?.id, exerciseId, currentDate],
    queryFn: async () => {
      if (!user || !exerciseId) return [];
      
      // Get the most recent workout with this exercise before current date
      const { data, error } = await supabase
        .from('set_logs')
        .select(`
          weight_kg,
          reps,
          set_number,
          exercise_log:exercise_logs!inner(
            exercise_id,
            workout_log:workout_logs!inner(
              workout_date,
              user_id
            )
          )
        `)
        .eq('exercise_log.exercise_id', exerciseId)
        .eq('exercise_log.workout_log.user_id', user.id)
        .lt('exercise_log.workout_log.workout_date', currentDate)
        .order('exercise_log(workout_log(workout_date))', { ascending: false })
        .order('set_number', { ascending: true })
        .limit(10);
      
      if (error) throw error;
      
      // Return just the first workout's sets
      const sets = data || [];
      if (sets.length === 0) return [];
      
      // Get the workout date of the first set and filter to only that workout
      const firstWorkoutDate = (sets[0] as any).exercise_log?.workout_log?.workout_date;
      return sets
        .filter((s: any) => s.exercise_log?.workout_log?.workout_date === firstWorkoutDate)
        .map((s: any) => ({
          weight_kg: s.weight_kg,
          reps: s.reps,
          set_number: s.set_number,
        }));
    },
    enabled: !!user && !!exerciseId,
  });
}

// ============ MEAL LOGS ============
export function useMealLogs(date?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['meal-logs', user?.id, date],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from('meal_logs')
        .select(`
          *,
          meal_items(
            *,
            food:food_database(*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      
      if (date) query = query.eq('meal_date', date);
      
      const { data, error } = await query;
      if (error) throw error;
      return data as MealLog[];
    },
    enabled: !!user,
  });
}

export function useCreateMealLog() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: { meal_name: string; meal_date: string; is_training_day: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      const { data: result, error } = await supabase
        .from('meal_logs')
        .insert({ ...data, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-logs'] });
    },
  });
}

export function useCreateMealItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<MealItem, 'id' | 'created_at'>) => {
      const { data: result, error } = await supabase
        .from('meal_items')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-logs'] });
    },
  });
}

// ============ GROCERY ITEMS ============
export function useGroceryItems() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['grocery-items', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('grocery_items')
        .select('*')
        .eq('user_id', user.id)
        .order('category')
        .order('item_name');
      if (error) throw error;
      return data as GroceryItem[];
    },
    enabled: !!user,
  });
}

export function useCreateGroceryItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: Omit<GroceryItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data: result, error } = await supabase
        .from('grocery_items')
        .insert({ ...data, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grocery-items'] });
    },
  });
}

export function useUpdateGroceryItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<GroceryItem>) => {
      const { data, error } = await supabase
        .from('grocery_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grocery-items'] });
    },
  });
}

export function useDeleteGroceryItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('grocery_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grocery-items'] });
    },
  });
}

// ============ SUPPLEMENTS ============
export function useSupplements() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['supplements', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('supplements')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      if (error) throw error;
      return data as Supplement[];
    },
    enabled: !!user,
  });
}

export function useCreateSupplement() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: Omit<Supplement, 'id' | 'user_id' | 'created_at'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data: result, error } = await supabase
        .from('supplements')
        .insert({ ...data, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplements'] });
    },
  });
}

// ============ SUPPLEMENT LOGS ============
export function useSupplementLogs(date?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['supplement-logs', user?.id, date],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from('supplement_logs')
        .select(`
          *,
          supplement:supplements(*)
        `)
        .eq('user_id', user.id);
      
      if (date) query = query.eq('taken_date', date);
      
      const { data, error } = await query;
      if (error) throw error;
      return data as SupplementLog[];
    },
    enabled: !!user,
  });
}

export function useToggleSupplementLog() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ supplementId, date, taken }: { supplementId: string; date: string; taken: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Try to upsert
      const { data, error } = await supabase
        .from('supplement_logs')
        .upsert(
          { supplement_id: supplementId, user_id: user.id, taken_date: date, taken },
          { onConflict: 'supplement_id,taken_date' }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplement-logs'] });
    },
  });
}

// ============ COMPOUNDS ============
export function useCompoundsReference() {
  return useQuery({
    queryKey: ['compounds-reference'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compounds_reference')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as CompoundReference[];
    },
  });
}

export function useUserCompounds() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user-compounds', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_compounds')
        .select(`
          *,
          compound:compounds_reference(*)
        `)
        .eq('user_id', user.id);
      if (error) throw error;
      return data as UserCompound[];
    },
    enabled: !!user,
  });
}

export function useUpdateUserCompound() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ compoundId, status, notes }: { compoundId: string; status: 'researching' | 'avoid' | 'ask_doctor'; notes?: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      // First try to find existing record
      const { data: existing } = await supabase
        .from('user_compounds')
        .select('id')
        .eq('user_id', user.id)
        .eq('compound_id', compoundId)
        .maybeSingle();
      
      if (existing) {
        const { data, error } = await supabase
          .from('user_compounds')
          .update({ status, personal_notes: notes })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('user_compounds')
          .insert({ compound_id: compoundId, user_id: user.id, status, personal_notes: notes })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-compounds'] });
    },
  });
}

// ============ BODY METRICS ============
export function useBodyMetrics(limit?: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['body-metrics', user?.id, limit],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from('body_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_date', { ascending: false });
      
      if (limit) query = query.limit(limit);
      
      const { data, error } = await query;
      if (error) throw error;
      return data as BodyMetric[];
    },
    enabled: !!user,
  });
}

export function useCreateBodyMetric() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: Omit<BodyMetric, 'id' | 'user_id' | 'created_at'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data: result, error } = await supabase
        .from('body_metrics')
        .insert({ ...data, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['body-metrics'] });
    },
  });
}
