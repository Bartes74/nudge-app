export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          last_active_at: string | null
          deleted_at: string | null
          timezone: string
          locale: string
        }
        Insert: {
          id: string
          email: string
          created_at?: string
          last_active_at?: string | null
          deleted_at?: string | null
          timezone?: string
          locale?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          last_active_at?: string | null
          deleted_at?: string | null
          timezone?: string
          locale?: string
        }
        Relationships: []
      }
      user_profile: {
        Row: {
          user_id: string
          display_name: string | null
          birth_date: string | null
          age_bucket: Database['public']['Enums']['age_bucket'] | null
          gender: Database['public']['Enums']['gender'] | null
          height_cm: number | null
          current_weight_kg: number | null
          experience_level: Database['public']['Enums']['experience_level'] | null
          primary_goal: Database['public']['Enums']['primary_goal'] | null
          dietary_constraints: string[] | null
          life_context: string[] | null
          onboarding_completed_at: string | null
          onboarding_layer_1_done: boolean
          onboarding_layer_2_done: boolean
          last_plan_generated_at: string | null
          tone_preset: Database['public']['Enums']['tone_preset'] | null
          nutrition_mode: Database['public']['Enums']['nutrition_mode'] | null
          updated_at: string | null
        }
        Insert: {
          user_id: string
          display_name?: string | null
          birth_date?: string | null
          age_bucket?: Database['public']['Enums']['age_bucket'] | null
          gender?: Database['public']['Enums']['gender'] | null
          height_cm?: number | null
          current_weight_kg?: number | null
          experience_level?: Database['public']['Enums']['experience_level'] | null
          primary_goal?: Database['public']['Enums']['primary_goal'] | null
          dietary_constraints?: string[] | null
          life_context?: string[] | null
          onboarding_completed_at?: string | null
          onboarding_layer_1_done?: boolean
          onboarding_layer_2_done?: boolean
          last_plan_generated_at?: string | null
          tone_preset?: Database['public']['Enums']['tone_preset'] | null
          nutrition_mode?: Database['public']['Enums']['nutrition_mode'] | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          display_name?: string | null
          birth_date?: string | null
          age_bucket?: Database['public']['Enums']['age_bucket'] | null
          gender?: Database['public']['Enums']['gender'] | null
          height_cm?: number | null
          current_weight_kg?: number | null
          experience_level?: Database['public']['Enums']['experience_level'] | null
          primary_goal?: Database['public']['Enums']['primary_goal'] | null
          dietary_constraints?: string[] | null
          life_context?: string[] | null
          onboarding_completed_at?: string | null
          onboarding_layer_1_done?: boolean
          onboarding_layer_2_done?: boolean
          last_plan_generated_at?: string | null
          tone_preset?: Database['public']['Enums']['tone_preset'] | null
          nutrition_mode?: Database['public']['Enums']['nutrition_mode'] | null
          updated_at?: string | null
        }
        Relationships: [{ foreignKeyName: 'user_profile_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] }]
      }
      user_profile_facts: {
        Row: {
          id: string
          user_id: string
          field_key: string
          value_text: string | null
          value_numeric: number | null
          value_bool: boolean | null
          value_json: Json | null
          unit: string | null
          source: Database['public']['Enums']['fact_source']
          confidence: number | null
          inferred_from: string | null
          supersedes_id: string | null
          observed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          field_key: string
          value_text?: string | null
          value_numeric?: number | null
          value_bool?: boolean | null
          value_json?: Json | null
          unit?: string | null
          source: Database['public']['Enums']['fact_source']
          confidence?: number | null
          inferred_from?: string | null
          supersedes_id?: string | null
          observed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          field_key?: string
          value_text?: string | null
          value_numeric?: number | null
          value_bool?: boolean | null
          value_json?: Json | null
          unit?: string | null
          source?: Database['public']['Enums']['fact_source']
          confidence?: number | null
          inferred_from?: string | null
          supersedes_id?: string | null
          observed_at?: string
        }
        Relationships: [{ foreignKeyName: 'user_profile_facts_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] }]
      }
      user_equipment: {
        Row: {
          user_id: string
          location_type: Database['public']['Enums']['location_type'] | null
          has_barbell: boolean
          has_dumbbells: boolean
          has_kettlebells: boolean
          has_machines: boolean
          has_cables: boolean
          has_cardio: boolean
          has_pullup_bar: boolean
          has_bench: boolean
          dumbbell_max_kg: number | null
          other_equipment: string[] | null
          updated_at: string | null
        }
        Insert: {
          user_id: string
          location_type?: Database['public']['Enums']['location_type'] | null
          has_barbell?: boolean
          has_dumbbells?: boolean
          has_kettlebells?: boolean
          has_machines?: boolean
          has_cables?: boolean
          has_cardio?: boolean
          has_pullup_bar?: boolean
          has_bench?: boolean
          dumbbell_max_kg?: number | null
          other_equipment?: string[] | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          location_type?: Database['public']['Enums']['location_type'] | null
          has_barbell?: boolean
          has_dumbbells?: boolean
          has_kettlebells?: boolean
          has_machines?: boolean
          has_cables?: boolean
          has_cardio?: boolean
          has_pullup_bar?: boolean
          has_bench?: boolean
          dumbbell_max_kg?: number | null
          other_equipment?: string[] | null
          updated_at?: string | null
        }
        Relationships: [{ foreignKeyName: 'user_equipment_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] }]
      }
      user_health: {
        Row: {
          user_id: string
          injuries: string[] | null
          chronic_pain: string[] | null
          medical_conditions: string[] | null
          activity_level: Database['public']['Enums']['activity_level'] | null
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          user_id: string
          injuries?: string[] | null
          chronic_pain?: string[] | null
          medical_conditions?: string[] | null
          activity_level?: Database['public']['Enums']['activity_level'] | null
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          injuries?: string[] | null
          chronic_pain?: string[] | null
          medical_conditions?: string[] | null
          activity_level?: Database['public']['Enums']['activity_level'] | null
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: [{ foreignKeyName: 'user_health_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] }]
      }
      user_safety_flags: {
        Row: {
          id: string
          user_id: string
          flag: Database['public']['Enums']['safety_flag']
          status: Database['public']['Enums']['flag_status']
          source: string | null
          severity: Database['public']['Enums']['severity_level']
          detected_at: string
          resolved_at: string | null
          notes: string | null
          restrictions_applied: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          flag: Database['public']['Enums']['safety_flag']
          status?: Database['public']['Enums']['flag_status']
          source?: string | null
          severity: Database['public']['Enums']['severity_level']
          detected_at?: string
          resolved_at?: string | null
          notes?: string | null
          restrictions_applied?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          flag?: Database['public']['Enums']['safety_flag']
          status?: Database['public']['Enums']['flag_status']
          source?: string | null
          severity?: Database['public']['Enums']['severity_level']
          detected_at?: string
          resolved_at?: string | null
          notes?: string | null
          restrictions_applied?: Json | null
        }
        Relationships: [{ foreignKeyName: 'user_safety_flags_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] }]
      }
      user_goals: {
        Row: {
          id: string
          user_id: string
          goal_type: Database['public']['Enums']['primary_goal']
          target_value: number | null
          target_unit: string | null
          secondary_goal: string | null
          horizon_weeks: number | null
          rationale: string | null
          started_at: string
          ended_at: string | null
          is_current: boolean
        }
        Insert: {
          id?: string
          user_id: string
          goal_type: Database['public']['Enums']['primary_goal']
          target_value?: number | null
          target_unit?: string | null
          secondary_goal?: string | null
          horizon_weeks?: number | null
          rationale?: string | null
          started_at?: string
          ended_at?: string | null
          is_current?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          goal_type?: Database['public']['Enums']['primary_goal']
          target_value?: number | null
          target_unit?: string | null
          secondary_goal?: string | null
          horizon_weeks?: number | null
          rationale?: string | null
          started_at?: string
          ended_at?: string | null
          is_current?: boolean
        }
        Relationships: [{ foreignKeyName: 'user_goals_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] }]
      }
      user_segment_snapshots: {
        Row: {
          id: string
          user_id: string
          experience_level: Database['public']['Enums']['experience_level'] | null
          primary_goal: Database['public']['Enums']['primary_goal'] | null
          gender: Database['public']['Enums']['gender'] | null
          age_bucket: Database['public']['Enums']['age_bucket'] | null
          life_context: string[] | null
          segment_key: string | null
          computed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          experience_level?: Database['public']['Enums']['experience_level'] | null
          primary_goal?: Database['public']['Enums']['primary_goal'] | null
          gender?: Database['public']['Enums']['gender'] | null
          age_bucket?: Database['public']['Enums']['age_bucket'] | null
          life_context?: string[] | null
          segment_key?: string | null
          computed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          experience_level?: Database['public']['Enums']['experience_level'] | null
          primary_goal?: Database['public']['Enums']['primary_goal'] | null
          gender?: Database['public']['Enums']['gender'] | null
          age_bucket?: Database['public']['Enums']['age_bucket'] | null
          life_context?: string[] | null
          segment_key?: string | null
          computed_at?: string
        }
        Relationships: [{ foreignKeyName: 'user_segment_snapshots_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] }]
      }
      question_library: {
        Row: {
          id: string
          field_key: string
          layer: Database['public']['Enums']['question_layer']
          applicable_segments: string[] | null
          applicable_goals: Database['public']['Enums']['primary_goal'][] | null
          priority_base: number | null
          why_we_ask: string
          how_to_measure: string | null
          phrasing_options: Json | null
          answer_type: Database['public']['Enums']['answer_type']
          answer_options: Json | null
          blocks_if_unanswered: boolean
          expected_time_seconds: number | null
          prerequisites: Json | null
          is_active: boolean
        }
        Insert: {
          id?: string
          field_key: string
          layer: Database['public']['Enums']['question_layer']
          applicable_segments?: string[] | null
          applicable_goals?: Database['public']['Enums']['primary_goal'][] | null
          priority_base?: number | null
          why_we_ask: string
          how_to_measure?: string | null
          phrasing_options?: Json | null
          answer_type: Database['public']['Enums']['answer_type']
          answer_options?: Json | null
          blocks_if_unanswered?: boolean
          expected_time_seconds?: number | null
          prerequisites?: Json | null
          is_active?: boolean
        }
        Update: Record<string, never>
        Relationships: []
      }
      user_question_asks: {
        Row: {
          id: string
          user_id: string
          question_id: string
          asked_at: string
          answered_at: string | null
          skipped_at: string | null
          answer_text: string | null
          answer_numeric: number | null
          answer_json: Json | null
          context: string | null
          priority_score: number | null
        }
        Insert: {
          id?: string
          user_id: string
          question_id: string
          asked_at?: string
          answered_at?: string | null
          skipped_at?: string | null
          answer_text?: string | null
          answer_numeric?: number | null
          answer_json?: Json | null
          context?: string | null
          priority_score?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          question_id?: string
          asked_at?: string
          answered_at?: string | null
          skipped_at?: string | null
          answer_text?: string | null
          answer_numeric?: number | null
          answer_json?: Json | null
          context?: string | null
          priority_score?: number | null
        }
        Relationships: [{ foreignKeyName: 'user_question_asks_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] }]
      }
      field_explanations: {
        Row: {
          id: string
          field_key: string
          locale: string
          why_we_ask: string
          how_to_measure: string | null
          example: string | null
          estimated_time_seconds: number | null
          show_in_contexts: string[] | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          field_key: string
          locale?: string
          why_we_ask: string
          how_to_measure?: string | null
          example?: string | null
          estimated_time_seconds?: number | null
          show_in_contexts?: string[] | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          field_key?: string
          locale?: string
          why_we_ask?: string
          how_to_measure?: string | null
          example?: string | null
          estimated_time_seconds?: number | null
          show_in_contexts?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      product_events: {
        Row: {
          id: string
          user_id: string | null
          event_name: string
          properties: Json | null
          session_id: string | null
          occurred_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          event_name: string
          properties?: Json | null
          session_id?: string | null
          occurred_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          event_name?: string
          properties?: Json | null
          session_id?: string | null
          occurred_at?: string
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
      gender: 'female' | 'male' | 'other' | 'prefer_not_to_say'
      age_bucket: 'under_25' | 'age_25_40' | 'age_40_55' | 'age_55_plus'
      experience_level: 'zero' | 'beginner' | 'amateur' | 'advanced'
      primary_goal: 'weight_loss' | 'muscle_building' | 'strength_performance' | 'general_health'
      tone_preset: 'warm_encouraging' | 'partnering' | 'factual_technical'
      nutrition_mode: 'simple' | 'ranges' | 'exact'
      fact_source:
        | 'onboarding'
        | 'user_input'
        | 'user_correction'
        | 'ai_inferred'
        | 'behavioral_signal'
        | 'measurement_device'
        | 'photo_analysis'
        | 'checkin'
        | 'coach_chat'
      location_type: 'home' | 'gym' | 'mixed'
      activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
      safety_flag:
        | 'underage'
        | 'pregnancy'
        | 'postpartum'
        | 'ed_risk'
        | 'low_calorie_intake'
        | 'rapid_weight_loss'
        | 'injury_reported'
        | 'acute_pain'
        | 'medical_condition'
        | 'medication_interaction'
        | 'overtraining_signs'
      flag_status: 'active' | 'monitoring' | 'resolved' | 'dismissed_by_user'
      severity_level: 'info' | 'warning' | 'critical'
      question_layer:
        | 'layer_1_minimum'
        | 'layer_2_segment'
        | 'layer_3_behavioral'
        | 'layer_4_advanced'
      answer_type:
        | 'text_short'
        | 'text_long'
        | 'numeric'
        | 'single_select'
        | 'multi_select'
        | 'boolean'
        | 'scale'
        | 'measurement'
        | 'photo'
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      gender: ['female', 'male', 'other', 'prefer_not_to_say'] as const,
      age_bucket: ['under_25', 'age_25_40', 'age_40_55', 'age_55_plus'] as const,
      experience_level: ['zero', 'beginner', 'amateur', 'advanced'] as const,
      primary_goal: [
        'weight_loss',
        'muscle_building',
        'strength_performance',
        'general_health',
      ] as const,
      tone_preset: ['warm_encouraging', 'partnering', 'factual_technical'] as const,
      nutrition_mode: ['simple', 'ranges', 'exact'] as const,
      location_type: ['home', 'gym', 'mixed'] as const,
      activity_level: ['sedentary', 'light', 'moderate', 'active', 'very_active'] as const,
      safety_flag: [
        'underage',
        'pregnancy',
        'postpartum',
        'ed_risk',
        'low_calorie_intake',
        'rapid_weight_loss',
        'injury_reported',
        'acute_pain',
        'medical_condition',
        'medication_interaction',
        'overtraining_signs',
      ] as const,
      flag_status: ['active', 'monitoring', 'resolved', 'dismissed_by_user'] as const,
      severity_level: ['info', 'warning', 'critical'] as const,
      question_layer: [
        'layer_1_minimum',
        'layer_2_segment',
        'layer_3_behavioral',
        'layer_4_advanced',
      ] as const,
      answer_type: [
        'text_short',
        'text_long',
        'numeric',
        'single_select',
        'multi_select',
        'boolean',
        'scale',
        'measurement',
        'photo',
      ] as const,
    },
  },
} as const

