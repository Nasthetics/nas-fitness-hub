export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      body_metrics: {
        Row: {
          arms_cm: number | null
          body_fat_percent: number | null
          chest_cm: number | null
          created_at: string
          id: string
          inbody_score: number | null
          legs_cm: number | null
          notes: string | null
          recorded_date: string
          user_id: string
          waist_cm: number | null
          weight_kg: number | null
          whoop_recovery: number | null
          whoop_sleep_hours: number | null
        }
        Insert: {
          arms_cm?: number | null
          body_fat_percent?: number | null
          chest_cm?: number | null
          created_at?: string
          id?: string
          inbody_score?: number | null
          legs_cm?: number | null
          notes?: string | null
          recorded_date?: string
          user_id: string
          waist_cm?: number | null
          weight_kg?: number | null
          whoop_recovery?: number | null
          whoop_sleep_hours?: number | null
        }
        Update: {
          arms_cm?: number | null
          body_fat_percent?: number | null
          chest_cm?: number | null
          created_at?: string
          id?: string
          inbody_score?: number | null
          legs_cm?: number | null
          notes?: string | null
          recorded_date?: string
          user_id?: string
          waist_cm?: number | null
          weight_kg?: number | null
          whoop_recovery?: number | null
          whoop_sleep_hours?: number | null
        }
        Relationships: []
      }
      cardio_logs: {
        Row: {
          activity_type: string
          avg_heart_rate: number | null
          calories_burned: number | null
          created_at: string
          distance_km: number | null
          duration_minutes: number
          id: string
          notes: string | null
          perceived_effort: number | null
          session_date: string
          user_id: string
        }
        Insert: {
          activity_type?: string
          avg_heart_rate?: number | null
          calories_burned?: number | null
          created_at?: string
          distance_km?: number | null
          duration_minutes?: number
          id?: string
          notes?: string | null
          perceived_effort?: number | null
          session_date?: string
          user_id: string
        }
        Update: {
          activity_type?: string
          avg_heart_rate?: number | null
          calories_burned?: number | null
          created_at?: string
          distance_km?: number | null
          duration_minutes?: number
          id?: string
          notes?: string | null
          perceived_effort?: number | null
          session_date?: string
          user_id?: string
        }
        Relationships: []
      }
      compounds_reference: {
        Row: {
          created_at: string
          id: string
          name: string
          purpose: string | null
          risks_cautions: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          purpose?: string | null
          risks_cautions?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          purpose?: string | null
          risks_cautions?: string | null
        }
        Relationships: []
      }
      exercise_library: {
        Row: {
          coaching_cues: string | null
          created_at: string
          equipment: Database["public"]["Enums"]["equipment_type"]
          id: string
          image_url: string | null
          muscle_subgroup: string | null
          name: string
          primary_muscle: string | null
          secondary_muscle: string | null
          substitutions: string[] | null
        }
        Insert: {
          coaching_cues?: string | null
          created_at?: string
          equipment: Database["public"]["Enums"]["equipment_type"]
          id?: string
          image_url?: string | null
          muscle_subgroup?: string | null
          name: string
          primary_muscle?: string | null
          secondary_muscle?: string | null
          substitutions?: string[] | null
        }
        Update: {
          coaching_cues?: string | null
          created_at?: string
          equipment?: Database["public"]["Enums"]["equipment_type"]
          id?: string
          image_url?: string | null
          muscle_subgroup?: string | null
          name?: string
          primary_muscle?: string | null
          secondary_muscle?: string | null
          substitutions?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_library_primary_muscle_fkey"
            columns: ["primary_muscle"]
            isOneToOne: false
            referencedRelation: "muscle_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_library_secondary_muscle_fkey"
            columns: ["secondary_muscle"]
            isOneToOne: false
            referencedRelation: "muscle_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_logs: {
        Row: {
          created_at: string
          exercise_id: string
          exercise_order: number
          id: string
          workout_log_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          exercise_order: number
          id?: string
          workout_log_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          exercise_order?: number
          id?: string
          workout_log_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercise_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_logs_workout_log_id_fkey"
            columns: ["workout_log_id"]
            isOneToOne: false
            referencedRelation: "workout_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      food_database: {
        Row: {
          calories_per_100g: number
          carbs_per_100g: number
          category: Database["public"]["Enums"]["grocery_category"] | null
          created_at: string
          fats_per_100g: number
          fiber_per_100g: number | null
          id: string
          name: string
          protein_per_100g: number
          serving_size_g: number | null
        }
        Insert: {
          calories_per_100g: number
          carbs_per_100g: number
          category?: Database["public"]["Enums"]["grocery_category"] | null
          created_at?: string
          fats_per_100g: number
          fiber_per_100g?: number | null
          id?: string
          name: string
          protein_per_100g: number
          serving_size_g?: number | null
        }
        Update: {
          calories_per_100g?: number
          carbs_per_100g?: number
          category?: Database["public"]["Enums"]["grocery_category"] | null
          created_at?: string
          fats_per_100g?: number
          fiber_per_100g?: number | null
          id?: string
          name?: string
          protein_per_100g?: number
          serving_size_g?: number | null
        }
        Relationships: []
      }
      grocery_items: {
        Row: {
          category: Database["public"]["Enums"]["grocery_category"] | null
          created_at: string
          id: string
          is_bought: boolean | null
          item_name: string
          quantity: string | null
          store_note: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["grocery_category"] | null
          created_at?: string
          id?: string
          is_bought?: boolean | null
          item_name: string
          quantity?: string | null
          store_note?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["grocery_category"] | null
          created_at?: string
          id?: string
          is_bought?: boolean | null
          item_name?: string
          quantity?: string | null
          store_note?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meal_items: {
        Row: {
          calories: number
          carbs: number
          created_at: string
          custom_food_name: string | null
          fats: number
          fiber: number | null
          food_id: string | null
          id: string
          meal_log_id: string
          protein: number
          quantity_g: number
        }
        Insert: {
          calories: number
          carbs: number
          created_at?: string
          custom_food_name?: string | null
          fats: number
          fiber?: number | null
          food_id?: string | null
          id?: string
          meal_log_id: string
          protein: number
          quantity_g: number
        }
        Update: {
          calories?: number
          carbs?: number
          created_at?: string
          custom_food_name?: string | null
          fats?: number
          fiber?: number | null
          food_id?: string | null
          id?: string
          meal_log_id?: string
          protein?: number
          quantity_g?: number
        }
        Relationships: [
          {
            foreignKeyName: "meal_items_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "food_database"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_items_meal_log_id_fkey"
            columns: ["meal_log_id"]
            isOneToOne: false
            referencedRelation: "meal_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_logs: {
        Row: {
          created_at: string
          id: string
          is_training_day: boolean | null
          meal_date: string
          meal_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_training_day?: boolean | null
          meal_date?: string
          meal_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_training_day?: boolean | null
          meal_date?: string
          meal_name?: string
          user_id?: string
        }
        Relationships: []
      }
      muscle_groups: {
        Row: {
          display_order: number | null
          id: string
          name: string
        }
        Insert: {
          display_order?: number | null
          id?: string
          name: string
        }
        Update: {
          display_order?: number | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      periodization_plans: {
        Row: {
          created_at: string
          current_week: number
          id: string
          name: string
          phase: string
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_week?: number
          id?: string
          name?: string
          phase?: string
          start_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_week?: number
          id?: string
          name?: string
          phase?: string
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pr_history: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          pr_type: string
          previous_reps: number | null
          previous_weight_kg: number | null
          recorded_date: string
          reps: number
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          pr_type?: string
          previous_reps?: number | null
          previous_weight_kg?: number | null
          recorded_date?: string
          reps?: number
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          pr_type?: string
          previous_reps?: number | null
          previous_weight_kg?: number | null
          recorded_date?: string
          reps?: number
          user_id?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "pr_history_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercise_library"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          body_fat_percent: number | null
          created_at: string
          display_name: string | null
          height_cm: number | null
          id: string
          lean_mass_kg: number | null
          ramadan_mode: boolean | null
          rest_day_calories: number | null
          rest_day_carbs: number | null
          rest_day_different_targets: boolean | null
          rest_day_fats: number | null
          rest_day_protein: number | null
          target_weight_gain_per_week: number | null
          training_day_calories: number | null
          training_day_carbs: number | null
          training_day_fats: number | null
          training_day_protein: number | null
          updated_at: string
          user_id: string
          water_target_ml: number | null
          weekly_workout_target: number | null
        }
        Insert: {
          body_fat_percent?: number | null
          created_at?: string
          display_name?: string | null
          height_cm?: number | null
          id?: string
          lean_mass_kg?: number | null
          ramadan_mode?: boolean | null
          rest_day_calories?: number | null
          rest_day_carbs?: number | null
          rest_day_different_targets?: boolean | null
          rest_day_fats?: number | null
          rest_day_protein?: number | null
          target_weight_gain_per_week?: number | null
          training_day_calories?: number | null
          training_day_carbs?: number | null
          training_day_fats?: number | null
          training_day_protein?: number | null
          updated_at?: string
          user_id: string
          water_target_ml?: number | null
          weekly_workout_target?: number | null
        }
        Update: {
          body_fat_percent?: number | null
          created_at?: string
          display_name?: string | null
          height_cm?: number | null
          id?: string
          lean_mass_kg?: number | null
          ramadan_mode?: boolean | null
          rest_day_calories?: number | null
          rest_day_carbs?: number | null
          rest_day_different_targets?: boolean | null
          rest_day_fats?: number | null
          rest_day_protein?: number | null
          target_weight_gain_per_week?: number | null
          training_day_calories?: number | null
          training_day_carbs?: number | null
          training_day_fats?: number | null
          training_day_protein?: number | null
          updated_at?: string
          user_id?: string
          water_target_ml?: number | null
          weekly_workout_target?: number | null
        }
        Relationships: []
      }
      progress_photos: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          recorded_date: string
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          recorded_date?: string
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          recorded_date?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: []
      }
      recovery_checkins: {
        Row: {
          breathwork_done: boolean | null
          checkin_date: string
          created_at: string
          energy: number | null
          id: string
          recovery_score: number | null
          sleep_hours: number | null
          sleep_quality: number | null
          stress: number | null
          user_id: string
        }
        Insert: {
          breathwork_done?: boolean | null
          checkin_date?: string
          created_at?: string
          energy?: number | null
          id?: string
          recovery_score?: number | null
          sleep_hours?: number | null
          sleep_quality?: number | null
          stress?: number | null
          user_id: string
        }
        Update: {
          breathwork_done?: boolean | null
          checkin_date?: string
          created_at?: string
          energy?: number | null
          id?: string
          recovery_score?: number | null
          sleep_hours?: number | null
          sleep_quality?: number | null
          stress?: number | null
          user_id?: string
        }
        Relationships: []
      }
      set_logs: {
        Row: {
          created_at: string
          exercise_log_id: string
          id: string
          is_dropset: boolean | null
          is_pr: boolean | null
          notes: string | null
          reps: number | null
          rest_seconds: number | null
          rir: number | null
          rpe: number | null
          set_number: number
          superset_group_id: string | null
          weight_kg: number | null
        }
        Insert: {
          created_at?: string
          exercise_log_id: string
          id?: string
          is_dropset?: boolean | null
          is_pr?: boolean | null
          notes?: string | null
          reps?: number | null
          rest_seconds?: number | null
          rir?: number | null
          rpe?: number | null
          set_number: number
          superset_group_id?: string | null
          weight_kg?: number | null
        }
        Update: {
          created_at?: string
          exercise_log_id?: string
          id?: string
          is_dropset?: boolean | null
          is_pr?: boolean | null
          notes?: string | null
          reps?: number | null
          rest_seconds?: number | null
          rir?: number | null
          rpe?: number | null
          set_number?: number
          superset_group_id?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "set_logs_exercise_log_id_fkey"
            columns: ["exercise_log_id"]
            isOneToOne: false
            referencedRelation: "exercise_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      supplement_logs: {
        Row: {
          created_at: string
          id: string
          supplement_id: string
          taken: boolean | null
          taken_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          supplement_id: string
          taken?: boolean | null
          taken_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          supplement_id?: string
          taken?: boolean | null
          taken_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplement_logs_supplement_id_fkey"
            columns: ["supplement_id"]
            isOneToOne: false
            referencedRelation: "supplements"
            referencedColumns: ["id"]
          },
        ]
      }
      supplements: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          purpose: string | null
          timing: Database["public"]["Enums"]["timing_type"][] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          purpose?: string | null
          timing?: Database["public"]["Enums"]["timing_type"][] | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          purpose?: string | null
          timing?: Database["public"]["Enums"]["timing_type"][] | null
          user_id?: string
        }
        Relationships: []
      }
      template_exercises: {
        Row: {
          created_at: string
          default_reps: number | null
          default_rest_seconds: number | null
          default_sets: number | null
          exercise_id: string
          exercise_order: number
          id: string
          notes: string | null
          template_id: string
        }
        Insert: {
          created_at?: string
          default_reps?: number | null
          default_rest_seconds?: number | null
          default_sets?: number | null
          exercise_id: string
          exercise_order: number
          id?: string
          notes?: string | null
          template_id: string
        }
        Update: {
          created_at?: string
          default_reps?: number | null
          default_rest_seconds?: number | null
          default_sets?: number | null
          exercise_id?: string
          exercise_order?: number
          id?: string
          notes?: string | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercise_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_exercises_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_compounds: {
        Row: {
          compound_id: string
          created_at: string
          id: string
          personal_notes: string | null
          status: Database["public"]["Enums"]["compound_status"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          compound_id: string
          created_at?: string
          id?: string
          personal_notes?: string | null
          status?: Database["public"]["Enums"]["compound_status"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          compound_id?: string
          created_at?: string
          id?: string
          personal_notes?: string | null
          status?: Database["public"]["Enums"]["compound_status"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_compounds_compound_id_fkey"
            columns: ["compound_id"]
            isOneToOne: false
            referencedRelation: "compounds_reference"
            referencedColumns: ["id"]
          },
        ]
      }
      water_logs: {
        Row: {
          amount_ml: number
          created_at: string
          id: string
          log_date: string
          user_id: string
        }
        Insert: {
          amount_ml?: number
          created_at?: string
          id?: string
          log_date?: string
          user_id: string
        }
        Update: {
          amount_ml?: number
          created_at?: string
          id?: string
          log_date?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_logs: {
        Row: {
          completed: boolean | null
          created_at: string
          id: string
          notes: string | null
          template_id: string | null
          updated_at: string
          user_id: string
          workout_date: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          id?: string
          notes?: string | null
          template_id?: string | null
          updated_at?: string
          user_id: string
          workout_date?: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          id?: string
          notes?: string | null
          template_id?: string | null
          updated_at?: string
          user_id?: string
          workout_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_templates: {
        Row: {
          created_at: string
          day_number: number
          day_type: Database["public"]["Enums"]["workout_day_type"]
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_number: number
          day_type: Database["public"]["Enums"]["workout_day_type"]
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_number?: number
          day_type?: Database["public"]["Enums"]["workout_day_type"]
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      compound_status: "researching" | "avoid" | "ask_doctor"
      equipment_type:
        | "barbell"
        | "dumbbell"
        | "cable"
        | "machine"
        | "bodyweight"
        | "kettlebell"
        | "resistance_band"
        | "other"
      grocery_category:
        | "protein"
        | "carbs"
        | "vegetables"
        | "fruits"
        | "supplements"
        | "snacks"
        | "dairy"
        | "fats"
        | "other"
      timing_type: "AM" | "PM" | "pre_workout" | "post_workout" | "with_meal"
      workout_day_type: "shoulders_arms" | "chest_back" | "legs" | "rest"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      compound_status: ["researching", "avoid", "ask_doctor"],
      equipment_type: [
        "barbell",
        "dumbbell",
        "cable",
        "machine",
        "bodyweight",
        "kettlebell",
        "resistance_band",
        "other",
      ],
      grocery_category: [
        "protein",
        "carbs",
        "vegetables",
        "fruits",
        "supplements",
        "snacks",
        "dairy",
        "fats",
        "other",
      ],
      timing_type: ["AM", "PM", "pre_workout", "post_workout", "with_meal"],
      workout_day_type: ["shoulders_arms", "chest_back", "legs", "rest"],
    },
  },
} as const
