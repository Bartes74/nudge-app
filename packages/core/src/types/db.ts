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
      field_explanations: {
        Row: {
          estimated_time_seconds: number | null
          example: string | null
          field_key: string
          how_to_measure: string | null
          id: string
          locale: string
          show_in_contexts: string[] | null
          updated_at: string | null
          why_we_ask: string
        }
        Insert: {
          estimated_time_seconds?: number | null
          example?: string | null
          field_key: string
          how_to_measure?: string | null
          id?: string
          locale?: string
          show_in_contexts?: string[] | null
          updated_at?: string | null
          why_we_ask: string
        }
        Update: {
          estimated_time_seconds?: number | null
          example?: string | null
          field_key?: string
          how_to_measure?: string | null
          id?: string
          locale?: string
          show_in_contexts?: string[] | null
          updated_at?: string | null
          why_we_ask?: string
        }
        Relationships: []
      }
      product_events: {
        Row: {
          event_name: string
          id: string
          occurred_at: string
          properties: Json | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          event_name: string
          id?: string
          occurred_at?: string
          properties?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          event_name?: string
          id?: string
          occurred_at?: string
          properties?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      question_library: {
        Row: {
          answer_options: Json | null
          answer_type: Database["public"]["Enums"]["answer_type"]
          applicable_goals: Database["public"]["Enums"]["primary_goal"][] | null
          applicable_segments: string[] | null
          blocks_if_unanswered: boolean | null
          expected_time_seconds: number | null
          field_key: string
          how_to_measure: string | null
          id: string
          is_active: boolean | null
          layer: Database["public"]["Enums"]["question_layer"]
          phrasing_options: Json | null
          prerequisites: Json | null
          priority_base: number | null
          why_we_ask: string
        }
        Insert: {
          answer_options?: Json | null
          answer_type: Database["public"]["Enums"]["answer_type"]
          applicable_goals?:
            | Database["public"]["Enums"]["primary_goal"][]
            | null
          applicable_segments?: string[] | null
          blocks_if_unanswered?: boolean | null
          expected_time_seconds?: number | null
          field_key: string
          how_to_measure?: string | null
          id?: string
          is_active?: boolean | null
          layer: Database["public"]["Enums"]["question_layer"]
          phrasing_options?: Json | null
          prerequisites?: Json | null
          priority_base?: number | null
          why_we_ask: string
        }
        Update: {
          answer_options?: Json | null
          answer_type?: Database["public"]["Enums"]["answer_type"]
          applicable_goals?:
            | Database["public"]["Enums"]["primary_goal"][]
            | null
          applicable_segments?: string[] | null
          blocks_if_unanswered?: boolean | null
          expected_time_seconds?: number | null
          field_key?: string
          how_to_measure?: string | null
          id?: string
          is_active?: boolean | null
          layer?: Database["public"]["Enums"]["question_layer"]
          phrasing_options?: Json | null
          prerequisites?: Json | null
          priority_base?: number | null
          why_we_ask?: string
        }
        Relationships: []
      }
      user_equipment: {
        Row: {
          dumbbell_max_kg: number | null
          has_barbell: boolean | null
          has_bench: boolean | null
          has_cables: boolean | null
          has_cardio: boolean | null
          has_dumbbells: boolean | null
          has_kettlebells: boolean | null
          has_machines: boolean | null
          has_pullup_bar: boolean | null
          location_type: Database["public"]["Enums"]["location_type"] | null
          other_equipment: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          dumbbell_max_kg?: number | null
          has_barbell?: boolean | null
          has_bench?: boolean | null
          has_cables?: boolean | null
          has_cardio?: boolean | null
          has_dumbbells?: boolean | null
          has_kettlebells?: boolean | null
          has_machines?: boolean | null
          has_pullup_bar?: boolean | null
          location_type?: Database["public"]["Enums"]["location_type"] | null
          other_equipment?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          dumbbell_max_kg?: number | null
          has_barbell?: boolean | null
          has_bench?: boolean | null
          has_cables?: boolean | null
          has_cardio?: boolean | null
          has_dumbbells?: boolean | null
          has_kettlebells?: boolean | null
          has_machines?: boolean | null
          has_pullup_bar?: boolean | null
          location_type?: Database["public"]["Enums"]["location_type"] | null
          other_equipment?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_equipment_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_goals: {
        Row: {
          ended_at: string | null
          goal_type: Database["public"]["Enums"]["primary_goal"]
          horizon_weeks: number | null
          id: string
          is_current: boolean | null
          rationale: string | null
          secondary_goal: string | null
          started_at: string | null
          target_unit: string | null
          target_value: number | null
          user_id: string
        }
        Insert: {
          ended_at?: string | null
          goal_type: Database["public"]["Enums"]["primary_goal"]
          horizon_weeks?: number | null
          id?: string
          is_current?: boolean | null
          rationale?: string | null
          secondary_goal?: string | null
          started_at?: string | null
          target_unit?: string | null
          target_value?: number | null
          user_id: string
        }
        Update: {
          ended_at?: string | null
          goal_type?: Database["public"]["Enums"]["primary_goal"]
          horizon_weeks?: number | null
          id?: string
          is_current?: boolean | null
          rationale?: string | null
          secondary_goal?: string | null
          started_at?: string | null
          target_unit?: string | null
          target_value?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_health: {
        Row: {
          activity_level: Database["public"]["Enums"]["activity_level"] | null
          chronic_pain: string[] | null
          injuries: string[] | null
          medical_conditions: string[] | null
          notes: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
          chronic_pain?: string[] | null
          injuries?: string[] | null
          medical_conditions?: string[] | null
          notes?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
          chronic_pain?: string[] | null
          injuries?: string[] | null
          medical_conditions?: string[] | null
          notes?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_health_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profile: {
        Row: {
          age_bucket: Database["public"]["Enums"]["age_bucket"] | null
          birth_date: string | null
          current_weight_kg: number | null
          dietary_constraints: string[] | null
          display_name: string | null
          experience_level:
            | Database["public"]["Enums"]["experience_level"]
            | null
          gender: Database["public"]["Enums"]["gender"] | null
          height_cm: number | null
          last_plan_generated_at: string | null
          life_context: string[] | null
          nutrition_mode: Database["public"]["Enums"]["nutrition_mode"] | null
          onboarding_completed_at: string | null
          onboarding_layer_1_done: boolean | null
          onboarding_layer_2_done: boolean | null
          primary_goal: Database["public"]["Enums"]["primary_goal"] | null
          tone_preset: Database["public"]["Enums"]["tone_preset"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          age_bucket?: Database["public"]["Enums"]["age_bucket"] | null
          birth_date?: string | null
          current_weight_kg?: number | null
          dietary_constraints?: string[] | null
          display_name?: string | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          gender?: Database["public"]["Enums"]["gender"] | null
          height_cm?: number | null
          last_plan_generated_at?: string | null
          life_context?: string[] | null
          nutrition_mode?: Database["public"]["Enums"]["nutrition_mode"] | null
          onboarding_completed_at?: string | null
          onboarding_layer_1_done?: boolean | null
          onboarding_layer_2_done?: boolean | null
          primary_goal?: Database["public"]["Enums"]["primary_goal"] | null
          tone_preset?: Database["public"]["Enums"]["tone_preset"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          age_bucket?: Database["public"]["Enums"]["age_bucket"] | null
          birth_date?: string | null
          current_weight_kg?: number | null
          dietary_constraints?: string[] | null
          display_name?: string | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          gender?: Database["public"]["Enums"]["gender"] | null
          height_cm?: number | null
          last_plan_generated_at?: string | null
          life_context?: string[] | null
          nutrition_mode?: Database["public"]["Enums"]["nutrition_mode"] | null
          onboarding_completed_at?: string | null
          onboarding_layer_1_done?: boolean | null
          onboarding_layer_2_done?: boolean | null
          primary_goal?: Database["public"]["Enums"]["primary_goal"] | null
          tone_preset?: Database["public"]["Enums"]["tone_preset"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profile_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profile_facts: {
        Row: {
          confidence: number | null
          field_key: string
          id: string
          inferred_from: string | null
          observed_at: string
          source: Database["public"]["Enums"]["fact_source"]
          supersedes_id: string | null
          unit: string | null
          user_id: string
          value_bool: boolean | null
          value_json: Json | null
          value_numeric: number | null
          value_text: string | null
        }
        Insert: {
          confidence?: number | null
          field_key: string
          id?: string
          inferred_from?: string | null
          observed_at?: string
          source: Database["public"]["Enums"]["fact_source"]
          supersedes_id?: string | null
          unit?: string | null
          user_id: string
          value_bool?: boolean | null
          value_json?: Json | null
          value_numeric?: number | null
          value_text?: string | null
        }
        Update: {
          confidence?: number | null
          field_key?: string
          id?: string
          inferred_from?: string | null
          observed_at?: string
          source?: Database["public"]["Enums"]["fact_source"]
          supersedes_id?: string | null
          unit?: string | null
          user_id?: string
          value_bool?: boolean | null
          value_json?: Json | null
          value_numeric?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profile_facts_supersedes_id_fkey"
            columns: ["supersedes_id"]
            isOneToOne: false
            referencedRelation: "user_profile_facts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profile_facts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_question_asks: {
        Row: {
          answer_json: Json | null
          answer_numeric: number | null
          answer_text: string | null
          answered_at: string | null
          asked_at: string | null
          context: string | null
          id: string
          priority_score: number | null
          question_id: string
          skipped_at: string | null
          user_id: string
        }
        Insert: {
          answer_json?: Json | null
          answer_numeric?: number | null
          answer_text?: string | null
          answered_at?: string | null
          asked_at?: string | null
          context?: string | null
          id?: string
          priority_score?: number | null
          question_id: string
          skipped_at?: string | null
          user_id: string
        }
        Update: {
          answer_json?: Json | null
          answer_numeric?: number | null
          answer_text?: string | null
          answered_at?: string | null
          asked_at?: string | null
          context?: string | null
          id?: string
          priority_score?: number | null
          question_id?: string
          skipped_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_question_asks_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_question_asks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_safety_flags: {
        Row: {
          detected_at: string | null
          flag: Database["public"]["Enums"]["safety_flag"]
          id: string
          notes: string | null
          resolved_at: string | null
          restrictions_applied: Json | null
          severity: Database["public"]["Enums"]["severity_level"]
          source: string | null
          status: Database["public"]["Enums"]["flag_status"]
          user_id: string
        }
        Insert: {
          detected_at?: string | null
          flag: Database["public"]["Enums"]["safety_flag"]
          id?: string
          notes?: string | null
          resolved_at?: string | null
          restrictions_applied?: Json | null
          severity: Database["public"]["Enums"]["severity_level"]
          source?: string | null
          status?: Database["public"]["Enums"]["flag_status"]
          user_id: string
        }
        Update: {
          detected_at?: string | null
          flag?: Database["public"]["Enums"]["safety_flag"]
          id?: string
          notes?: string | null
          resolved_at?: string | null
          restrictions_applied?: Json | null
          severity?: Database["public"]["Enums"]["severity_level"]
          source?: string | null
          status?: Database["public"]["Enums"]["flag_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_safety_flags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_segment_snapshots: {
        Row: {
          age_bucket: Database["public"]["Enums"]["age_bucket"] | null
          computed_at: string | null
          experience_level:
            | Database["public"]["Enums"]["experience_level"]
            | null
          gender: Database["public"]["Enums"]["gender"] | null
          id: string
          life_context: string[] | null
          primary_goal: Database["public"]["Enums"]["primary_goal"] | null
          segment_key: string | null
          user_id: string
        }
        Insert: {
          age_bucket?: Database["public"]["Enums"]["age_bucket"] | null
          computed_at?: string | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          life_context?: string[] | null
          primary_goal?: Database["public"]["Enums"]["primary_goal"] | null
          segment_key?: string | null
          user_id: string
        }
        Update: {
          age_bucket?: Database["public"]["Enums"]["age_bucket"] | null
          computed_at?: string | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          life_context?: string[] | null
          primary_goal?: Database["public"]["Enums"]["primary_goal"] | null
          segment_key?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_segment_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          deleted_at: string | null
          email: string
          id: string
          last_active_at: string | null
          locale: string
          timezone: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          email: string
          id: string
          last_active_at?: string | null
          locale?: string
          timezone?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          email?: string
          id?: string
          last_active_at?: string | null
          locale?: string
          timezone?: string
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
      activity_level:
        | "sedentary"
        | "light"
        | "moderate"
        | "active"
        | "very_active"
      age_bucket: "under_25" | "age_25_40" | "age_40_55" | "age_55_plus"
      answer_type:
        | "text_short"
        | "text_long"
        | "numeric"
        | "single_select"
        | "multi_select"
        | "boolean"
        | "scale"
        | "measurement"
        | "photo"
      experience_level: "zero" | "beginner" | "amateur" | "advanced"
      fact_source:
        | "onboarding"
        | "user_input"
        | "user_correction"
        | "ai_inferred"
        | "behavioral_signal"
        | "measurement_device"
        | "photo_analysis"
        | "checkin"
        | "coach_chat"
      flag_status: "active" | "monitoring" | "resolved" | "dismissed_by_user"
      gender: "female" | "male" | "other" | "prefer_not_to_say"
      location_type: "home" | "gym" | "mixed"
      nutrition_mode: "simple" | "ranges" | "exact"
      primary_goal:
        | "weight_loss"
        | "muscle_building"
        | "strength_performance"
        | "general_health"
      question_layer:
        | "layer_1_minimum"
        | "layer_2_segment"
        | "layer_3_behavioral"
        | "layer_4_advanced"
      safety_flag:
        | "underage"
        | "pregnancy"
        | "postpartum"
        | "ed_risk"
        | "low_calorie_intake"
        | "rapid_weight_loss"
        | "injury_reported"
        | "acute_pain"
        | "medical_condition"
        | "medication_interaction"
        | "overtraining_signs"
      severity_level: "info" | "warning" | "critical"
      tone_preset: "warm_encouraging" | "partnering" | "factual_technical"
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
      activity_level: [
        "sedentary",
        "light",
        "moderate",
        "active",
        "very_active",
      ],
      age_bucket: ["under_25", "age_25_40", "age_40_55", "age_55_plus"],
      answer_type: [
        "text_short",
        "text_long",
        "numeric",
        "single_select",
        "multi_select",
        "boolean",
        "scale",
        "measurement",
        "photo",
      ],
      experience_level: ["zero", "beginner", "amateur", "advanced"],
      fact_source: [
        "onboarding",
        "user_input",
        "user_correction",
        "ai_inferred",
        "behavioral_signal",
        "measurement_device",
        "photo_analysis",
        "checkin",
        "coach_chat",
      ],
      flag_status: ["active", "monitoring", "resolved", "dismissed_by_user"],
      gender: ["female", "male", "other", "prefer_not_to_say"],
      location_type: ["home", "gym", "mixed"],
      nutrition_mode: ["simple", "ranges", "exact"],
      primary_goal: [
        "weight_loss",
        "muscle_building",
        "strength_performance",
        "general_health",
      ],
      question_layer: [
        "layer_1_minimum",
        "layer_2_segment",
        "layer_3_behavioral",
        "layer_4_advanced",
      ],
      safety_flag: [
        "underage",
        "pregnancy",
        "postpartum",
        "ed_risk",
        "low_calorie_intake",
        "rapid_weight_loss",
        "injury_reported",
        "acute_pain",
        "medical_condition",
        "medication_interaction",
        "overtraining_signs",
      ],
      severity_level: ["info", "warning", "critical"],
      tone_preset: ["warm_encouraging", "partnering", "factual_technical"],
    },
  },
} as const

