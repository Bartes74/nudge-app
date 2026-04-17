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
      ai_tasks: {
        Row: {
          completed_at: string | null
          error: string | null
          id: string
          input_payload: Json | null
          output_payload: Json | null
          queued_at: string
          started_at: string | null
          status: Database["public"]["Enums"]["ai_task_status"]
          task_type: Database["public"]["Enums"]["ai_task_type"]
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          error?: string | null
          id?: string
          input_payload?: Json | null
          output_payload?: Json | null
          queued_at?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["ai_task_status"]
          task_type: Database["public"]["Enums"]["ai_task_type"]
          user_id: string
        }
        Update: {
          completed_at?: string | null
          error?: string | null
          id?: string
          input_payload?: Json | null
          output_payload?: Json | null
          queued_at?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["ai_task_status"]
          task_type?: Database["public"]["Enums"]["ai_task_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      behavior_signals: {
        Row: {
          avg_session_length_sec: number | null
          coach_messages_sent_7d: number
          days_since_last_workout_log: number | null
          days_since_registration: number
          last_proactive_coach_at: string | null
          last_question_answered_at: string | null
          meal_logs_per_day_7d: number | null
          missed_workouts_7d: number
          onboarding_fields_skipped: number
          photo_vs_text_ratio: number | null
          updated_at: string
          user_id: string
          weight_log_regularity_score: number | null
          workout_completion_rate_30d: number | null
          workout_completion_rate_7d: number | null
        }
        Insert: {
          avg_session_length_sec?: number | null
          coach_messages_sent_7d?: number
          days_since_last_workout_log?: number | null
          days_since_registration?: number
          last_proactive_coach_at?: string | null
          last_question_answered_at?: string | null
          meal_logs_per_day_7d?: number | null
          missed_workouts_7d?: number
          onboarding_fields_skipped?: number
          photo_vs_text_ratio?: number | null
          updated_at?: string
          user_id: string
          weight_log_regularity_score?: number | null
          workout_completion_rate_30d?: number | null
          workout_completion_rate_7d?: number | null
        }
        Update: {
          avg_session_length_sec?: number | null
          coach_messages_sent_7d?: number
          days_since_last_workout_log?: number | null
          days_since_registration?: number
          last_proactive_coach_at?: string | null
          last_question_answered_at?: string | null
          meal_logs_per_day_7d?: number | null
          missed_workouts_7d?: number
          onboarding_fields_skipped?: number
          photo_vs_text_ratio?: number | null
          updated_at?: string
          user_id?: string
          weight_log_regularity_score?: number | null
          workout_completion_rate_30d?: number | null
          workout_completion_rate_7d?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "behavior_signals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      body_measurements: {
        Row: {
          arm_cm: number | null
          body_fat_pct: number | null
          chest_cm: number | null
          created_at: string
          hips_cm: number | null
          id: string
          measured_at: string
          neck_cm: number | null
          notes: string | null
          source: Database["public"]["Enums"]["fact_source"]
          thigh_cm: number | null
          user_id: string
          waist_cm: number | null
          weight_kg: number | null
        }
        Insert: {
          arm_cm?: number | null
          body_fat_pct?: number | null
          chest_cm?: number | null
          created_at?: string
          hips_cm?: number | null
          id?: string
          measured_at: string
          neck_cm?: number | null
          notes?: string | null
          source?: Database["public"]["Enums"]["fact_source"]
          thigh_cm?: number | null
          user_id: string
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Update: {
          arm_cm?: number | null
          body_fat_pct?: number | null
          chest_cm?: number | null
          created_at?: string
          hips_cm?: number | null
          id?: string
          measured_at?: string
          neck_cm?: number | null
          notes?: string | null
          source?: Database["public"]["Enums"]["fact_source"]
          thigh_cm?: number | null
          user_id?: string
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "body_measurements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      checkin_sessions: {
        Row: {
          analysis_at: string | null
          avg_workout_rating: number | null
          created_at: string
          focus_next_week: string | null
          id: string
          llm_call_id: string | null
          plan_change_details: Json | null
          plan_change_needed: boolean
          recommended_action: string | null
          struggles_text: string | null
          subjective_energy: number | null
          subjective_motivation: number | null
          subjective_recovery: number | null
          subjective_sleep: number | null
          subjective_stress: number | null
          submitted_at: string | null
          user_id: string
          verdict: Database["public"]["Enums"]["checkin_verdict"] | null
          verdict_summary: string | null
          week_of: string
          weight_delta_kg: number | null
          weight_end_kg: number | null
          weight_measurements: number | null
          weight_start_kg: number | null
          wins_text: string | null
          workouts_completed: number | null
          workouts_planned: number | null
        }
        Insert: {
          analysis_at?: string | null
          avg_workout_rating?: number | null
          created_at?: string
          focus_next_week?: string | null
          id?: string
          llm_call_id?: string | null
          plan_change_details?: Json | null
          plan_change_needed?: boolean
          recommended_action?: string | null
          struggles_text?: string | null
          subjective_energy?: number | null
          subjective_motivation?: number | null
          subjective_recovery?: number | null
          subjective_sleep?: number | null
          subjective_stress?: number | null
          submitted_at?: string | null
          user_id: string
          verdict?: Database["public"]["Enums"]["checkin_verdict"] | null
          verdict_summary?: string | null
          week_of: string
          weight_delta_kg?: number | null
          weight_end_kg?: number | null
          weight_measurements?: number | null
          weight_start_kg?: number | null
          wins_text?: string | null
          workouts_completed?: number | null
          workouts_planned?: number | null
        }
        Update: {
          analysis_at?: string | null
          avg_workout_rating?: number | null
          created_at?: string
          focus_next_week?: string | null
          id?: string
          llm_call_id?: string | null
          plan_change_details?: Json | null
          plan_change_needed?: boolean
          recommended_action?: string | null
          struggles_text?: string | null
          subjective_energy?: number | null
          subjective_motivation?: number | null
          subjective_recovery?: number | null
          subjective_sleep?: number | null
          subjective_stress?: number | null
          submitted_at?: string | null
          user_id?: string
          verdict?: Database["public"]["Enums"]["checkin_verdict"] | null
          verdict_summary?: string | null
          week_of?: string
          weight_delta_kg?: number | null
          weight_end_kg?: number | null
          weight_measurements?: number | null
          weight_start_kg?: number | null
          wins_text?: string | null
          workouts_completed?: number | null
          workouts_planned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "checkin_sessions_llm_call_id_fkey"
            columns: ["llm_call_id"]
            isOneToOne: false
            referencedRelation: "llm_calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkin_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_conversations: {
        Row: {
          closed: boolean
          context_entity_id: string | null
          context_entity_type: string | null
          entry_point: Database["public"]["Enums"]["entry_point"]
          id: string
          last_message_at: string | null
          started_at: string
          user_id: string
        }
        Insert: {
          closed?: boolean
          context_entity_id?: string | null
          context_entity_type?: string | null
          entry_point?: Database["public"]["Enums"]["entry_point"]
          id?: string
          last_message_at?: string | null
          started_at?: string
          user_id: string
        }
        Update: {
          closed?: boolean
          context_entity_id?: string | null
          context_entity_type?: string | null
          entry_point?: Database["public"]["Enums"]["entry_point"]
          id?: string
          last_message_at?: string | null
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          guardrail_flagged: boolean
          guardrail_reasons: string[] | null
          id: string
          intent: Database["public"]["Enums"]["coach_intent"] | null
          llm_call_id: string | null
          role: Database["public"]["Enums"]["message_role"]
          tokens_in: number | null
          tokens_out: number | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          guardrail_flagged?: boolean
          guardrail_reasons?: string[] | null
          id?: string
          intent?: Database["public"]["Enums"]["coach_intent"] | null
          llm_call_id?: string | null
          role: Database["public"]["Enums"]["message_role"]
          tokens_in?: number | null
          tokens_out?: number | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          guardrail_flagged?: boolean
          guardrail_reasons?: string[] | null
          id?: string
          intent?: Database["public"]["Enums"]["coach_intent"] | null
          llm_call_id?: string | null
          role?: Database["public"]["Enums"]["message_role"]
          tokens_in?: number | null
          tokens_out?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "coach_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_messages_llm_call_id_fkey"
            columns: ["llm_call_id"]
            isOneToOne: false
            referencedRelation: "llm_calls"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          alternatives_slugs: string[]
          category: Database["public"]["Enums"]["exercise_category"] | null
          common_mistakes: string | null
          created_at: string
          deprecated: boolean
          difficulty: Database["public"]["Enums"]["difficulty"] | null
          equipment_required: string[]
          id: string
          is_compound: boolean
          name_en: string | null
          name_pl: string
          primary_muscles: string[]
          secondary_muscles: string[]
          slug: string
          tags: string[]
          technique_notes: string | null
          video_url: string | null
        }
        Insert: {
          alternatives_slugs?: string[]
          category?: Database["public"]["Enums"]["exercise_category"] | null
          common_mistakes?: string | null
          created_at?: string
          deprecated?: boolean
          difficulty?: Database["public"]["Enums"]["difficulty"] | null
          equipment_required?: string[]
          id?: string
          is_compound?: boolean
          name_en?: string | null
          name_pl: string
          primary_muscles?: string[]
          secondary_muscles?: string[]
          slug: string
          tags?: string[]
          technique_notes?: string | null
          video_url?: string | null
        }
        Update: {
          alternatives_slugs?: string[]
          category?: Database["public"]["Enums"]["exercise_category"] | null
          common_mistakes?: string | null
          created_at?: string
          deprecated?: boolean
          difficulty?: Database["public"]["Enums"]["difficulty"] | null
          equipment_required?: string[]
          id?: string
          is_compound?: boolean
          name_en?: string | null
          name_pl?: string
          primary_muscles?: string[]
          secondary_muscles?: string[]
          slug?: string
          tags?: string[]
          technique_notes?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
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
      llm_calls: {
        Row: {
          ai_task_id: string | null
          cost_usd: number | null
          created_at: string
          id: string
          latency_ms: number | null
          model: string
          output_valid: boolean
          prompt_id: string | null
          prompt_version: number | null
          provider: string
          retries: number
          tokens_in: number | null
          tokens_out: number | null
          used_structured_output: boolean
          user_id: string | null
        }
        Insert: {
          ai_task_id?: string | null
          cost_usd?: number | null
          created_at?: string
          id?: string
          latency_ms?: number | null
          model: string
          output_valid?: boolean
          prompt_id?: string | null
          prompt_version?: number | null
          provider: string
          retries?: number
          tokens_in?: number | null
          tokens_out?: number | null
          used_structured_output?: boolean
          user_id?: string | null
        }
        Update: {
          ai_task_id?: string | null
          cost_usd?: number | null
          created_at?: string
          id?: string
          latency_ms?: number | null
          model?: string
          output_valid?: boolean
          prompt_id?: string | null
          prompt_version?: number | null
          provider?: string
          retries?: number
          tokens_in?: number | null
          tokens_out?: number | null
          used_structured_output?: boolean
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "llm_calls_ai_task_id_fkey"
            columns: ["ai_task_id"]
            isOneToOne: false
            referencedRelation: "ai_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "llm_calls_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "llm_calls_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_images: {
        Row: {
          id: string
          meal_log_id: string
          storage_path: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          id?: string
          meal_log_id: string
          storage_path: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          id?: string
          meal_log_id?: string
          storage_path?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_images_meal_log_id_fkey"
            columns: ["meal_log_id"]
            isOneToOne: false
            referencedRelation: "meal_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_images_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_log_items: {
        Row: {
          carbs_g: number | null
          created_at: string
          fat_g: number | null
          grams_estimate: number | null
          id: string
          is_user_corrected: boolean
          kcal_estimate: number | null
          label: string
          meal_log_id: string
          portion_estimate: string | null
          protein_g: number | null
          user_id: string
        }
        Insert: {
          carbs_g?: number | null
          created_at?: string
          fat_g?: number | null
          grams_estimate?: number | null
          id?: string
          is_user_corrected?: boolean
          kcal_estimate?: number | null
          label: string
          meal_log_id: string
          portion_estimate?: string | null
          protein_g?: number | null
          user_id: string
        }
        Update: {
          carbs_g?: number | null
          created_at?: string
          fat_g?: number | null
          grams_estimate?: number | null
          id?: string
          is_user_corrected?: boolean
          kcal_estimate?: number | null
          label?: string
          meal_log_id?: string
          portion_estimate?: string | null
          protein_g?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_log_items_meal_log_id_fkey"
            columns: ["meal_log_id"]
            isOneToOne: false
            referencedRelation: "meal_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_log_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_logs: {
        Row: {
          carbs_g_max: number | null
          carbs_g_min: number | null
          confidence_score: number | null
          created_at: string
          fat_g_max: number | null
          fat_g_min: number | null
          id: string
          kcal_estimate_max: number | null
          kcal_estimate_min: number | null
          llm_call_id: string | null
          logged_at: string
          meal_type: Database["public"]["Enums"]["meal_type"] | null
          note: string | null
          protein_g_max: number | null
          protein_g_min: number | null
          source: Database["public"]["Enums"]["meal_source"]
          status: Database["public"]["Enums"]["meal_log_status"]
          user_id: string
          user_warnings: Json | null
        }
        Insert: {
          carbs_g_max?: number | null
          carbs_g_min?: number | null
          confidence_score?: number | null
          created_at?: string
          fat_g_max?: number | null
          fat_g_min?: number | null
          id?: string
          kcal_estimate_max?: number | null
          kcal_estimate_min?: number | null
          llm_call_id?: string | null
          logged_at?: string
          meal_type?: Database["public"]["Enums"]["meal_type"] | null
          note?: string | null
          protein_g_max?: number | null
          protein_g_min?: number | null
          source: Database["public"]["Enums"]["meal_source"]
          status?: Database["public"]["Enums"]["meal_log_status"]
          user_id: string
          user_warnings?: Json | null
        }
        Update: {
          carbs_g_max?: number | null
          carbs_g_min?: number | null
          confidence_score?: number | null
          created_at?: string
          fat_g_max?: number | null
          fat_g_min?: number | null
          id?: string
          kcal_estimate_max?: number | null
          kcal_estimate_min?: number | null
          llm_call_id?: string | null
          logged_at?: string
          meal_type?: Database["public"]["Enums"]["meal_type"] | null
          note?: string | null
          protein_g_max?: number | null
          protein_g_min?: number | null
          source?: Database["public"]["Enums"]["meal_source"]
          status?: Database["public"]["Enums"]["meal_log_status"]
          user_id?: string
          user_warnings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_logs_llm_call_id_fkey"
            columns: ["llm_call_id"]
            isOneToOne: false
            referencedRelation: "llm_calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_plan_versions: {
        Row: {
          calories_target: number | null
          carbs_g_target: number | null
          change_reason: string | null
          created_at: string
          created_by_ai_task_id: string | null
          emergency_plan: Json | null
          fat_g_target: number | null
          fiber_g_target: number | null
          id: string
          llm_call_id: string | null
          meal_distribution: Json | null
          mode: Database["public"]["Enums"]["nutrition_mode"]
          plan_id: string
          practical_guidelines: Json | null
          protein_g_target: number | null
          strategy_notes: string | null
          supplement_recommendations: Json | null
          version_number: number
          water_ml_target: number | null
        }
        Insert: {
          calories_target?: number | null
          carbs_g_target?: number | null
          change_reason?: string | null
          created_at?: string
          created_by_ai_task_id?: string | null
          emergency_plan?: Json | null
          fat_g_target?: number | null
          fiber_g_target?: number | null
          id?: string
          llm_call_id?: string | null
          meal_distribution?: Json | null
          mode?: Database["public"]["Enums"]["nutrition_mode"]
          plan_id: string
          practical_guidelines?: Json | null
          protein_g_target?: number | null
          strategy_notes?: string | null
          supplement_recommendations?: Json | null
          version_number: number
          water_ml_target?: number | null
        }
        Update: {
          calories_target?: number | null
          carbs_g_target?: number | null
          change_reason?: string | null
          created_at?: string
          created_by_ai_task_id?: string | null
          emergency_plan?: Json | null
          fat_g_target?: number | null
          fiber_g_target?: number | null
          id?: string
          llm_call_id?: string | null
          meal_distribution?: Json | null
          mode?: Database["public"]["Enums"]["nutrition_mode"]
          plan_id?: string
          practical_guidelines?: Json | null
          protein_g_target?: number | null
          strategy_notes?: string | null
          supplement_recommendations?: Json | null
          version_number?: number
          water_ml_target?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_plan_versions_created_by_ai_task_id_fkey"
            columns: ["created_by_ai_task_id"]
            isOneToOne: false
            referencedRelation: "ai_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutrition_plan_versions_llm_call_id_fkey"
            columns: ["llm_call_id"]
            isOneToOne: false
            referencedRelation: "llm_calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutrition_plan_versions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "nutrition_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_plans: {
        Row: {
          current_version_id: string | null
          ended_at: string | null
          id: string
          is_active: boolean
          started_at: string
          user_id: string
        }
        Insert: {
          current_version_id?: string | null
          ended_at?: string | null
          id?: string
          is_active?: boolean
          started_at?: string
          user_id: string
        }
        Update: {
          current_version_id?: string | null
          ended_at?: string | null
          id?: string
          is_active?: boolean
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_plans_current_version_fk"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "nutrition_plan_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutrition_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_daily_totals: {
        Row: {
          carbs_g_total: number
          date: string
          fat_g_total: number
          id: string
          kcal_total: number
          meal_count: number
          protein_g_total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          carbs_g_total?: number
          date: string
          fat_g_total?: number
          id?: string
          kcal_total?: number
          meal_count?: number
          protein_g_total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          carbs_g_total?: number
          date?: string
          fat_g_total?: number
          id?: string
          kcal_total?: number
          meal_count?: number
          protein_g_total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_daily_totals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_exercises: {
        Row: {
          exercise_id: string | null
          id: string
          order_num: number
          plan_workout_id: string
          reps_max: number | null
          reps_min: number | null
          rest_seconds: number | null
          rir_target: number | null
          rpe_target: number | null
          sets: number | null
          substitute_exercise_ids: string[]
          technique_notes: string | null
          tempo: string | null
        }
        Insert: {
          exercise_id?: string | null
          id?: string
          order_num?: number
          plan_workout_id: string
          reps_max?: number | null
          reps_min?: number | null
          rest_seconds?: number | null
          rir_target?: number | null
          rpe_target?: number | null
          sets?: number | null
          substitute_exercise_ids?: string[]
          technique_notes?: string | null
          tempo?: string | null
        }
        Update: {
          exercise_id?: string | null
          id?: string
          order_num?: number
          plan_workout_id?: string
          reps_max?: number | null
          reps_min?: number | null
          rest_seconds?: number | null
          rir_target?: number | null
          rpe_target?: number | null
          sets?: number | null
          substitute_exercise_ids?: string[]
          technique_notes?: string | null
          tempo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_exercises_plan_workout_id_fkey"
            columns: ["plan_workout_id"]
            isOneToOne: false
            referencedRelation: "plan_workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_workouts: {
        Row: {
          cooldown_notes: string | null
          day_label: string | null
          duration_min_estimated: number | null
          id: string
          name: string | null
          order_in_week: number
          plan_version_id: string
          warmup_notes: string | null
        }
        Insert: {
          cooldown_notes?: string | null
          day_label?: string | null
          duration_min_estimated?: number | null
          id?: string
          name?: string | null
          order_in_week?: number
          plan_version_id: string
          warmup_notes?: string | null
        }
        Update: {
          cooldown_notes?: string | null
          day_label?: string | null
          duration_min_estimated?: number | null
          id?: string
          name?: string | null
          order_in_week?: number
          plan_version_id?: string
          warmup_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_workouts_plan_version_id_fkey"
            columns: ["plan_version_id"]
            isOneToOne: false
            referencedRelation: "training_plan_versions"
            referencedColumns: ["id"]
          },
        ]
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
      prompts: {
        Row: {
          created_at: string
          deprecated: boolean
          id: string
          output_schema: Json | null
          purpose: string | null
          slug: string
          system_template: string | null
          tone_preset: Database["public"]["Enums"]["tone_preset"] | null
          user_template: string | null
          version: number
        }
        Insert: {
          created_at?: string
          deprecated?: boolean
          id?: string
          output_schema?: Json | null
          purpose?: string | null
          slug: string
          system_template?: string | null
          tone_preset?: Database["public"]["Enums"]["tone_preset"] | null
          user_template?: string | null
          version: number
        }
        Update: {
          created_at?: string
          deprecated?: boolean
          id?: string
          output_schema?: Json | null
          purpose?: string | null
          slug?: string
          system_template?: string | null
          tone_preset?: Database["public"]["Enums"]["tone_preset"] | null
          user_template?: string | null
          version?: number
        }
        Relationships: []
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
      training_plan_versions: {
        Row: {
          additional_notes: string | null
          assumptions_snapshot: Json | null
          change_reason: string | null
          created_at: string
          created_by_ai_task_id: string | null
          goal_snapshot: Json | null
          id: string
          llm_call_id: string | null
          plan_id: string
          progression_rules: Json | null
          version_number: number
          week_structure: Json | null
        }
        Insert: {
          additional_notes?: string | null
          assumptions_snapshot?: Json | null
          change_reason?: string | null
          created_at?: string
          created_by_ai_task_id?: string | null
          goal_snapshot?: Json | null
          id?: string
          llm_call_id?: string | null
          plan_id: string
          progression_rules?: Json | null
          version_number: number
          week_structure?: Json | null
        }
        Update: {
          additional_notes?: string | null
          assumptions_snapshot?: Json | null
          change_reason?: string | null
          created_at?: string
          created_by_ai_task_id?: string | null
          goal_snapshot?: Json | null
          id?: string
          llm_call_id?: string | null
          plan_id?: string
          progression_rules?: Json | null
          version_number?: number
          week_structure?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "training_plan_versions_created_by_ai_task_id_fkey"
            columns: ["created_by_ai_task_id"]
            isOneToOne: false
            referencedRelation: "ai_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_plan_versions_llm_call_id_fkey"
            columns: ["llm_call_id"]
            isOneToOne: false
            referencedRelation: "llm_calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_plan_versions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      training_plans: {
        Row: {
          current_version_id: string | null
          ended_at: string | null
          id: string
          is_active: boolean
          name: string | null
          started_at: string
          user_id: string
        }
        Insert: {
          current_version_id?: string | null
          ended_at?: string | null
          id?: string
          is_active?: boolean
          name?: string | null
          started_at?: string
          user_id: string
        }
        Update: {
          current_version_id?: string | null
          ended_at?: string | null
          id?: string
          is_active?: boolean
          name?: string | null
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_plans_current_version_fk"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "training_plan_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
          checkin_session_id: string | null
          context: string | null
          id: string
          priority_score: number | null
          question_id: string
          skipped_at: string | null
          source: Database["public"]["Enums"]["question_source"] | null
          user_id: string
        }
        Insert: {
          answer_json?: Json | null
          answer_numeric?: number | null
          answer_text?: string | null
          answered_at?: string | null
          asked_at?: string | null
          checkin_session_id?: string | null
          context?: string | null
          id?: string
          priority_score?: number | null
          question_id: string
          skipped_at?: string | null
          source?: Database["public"]["Enums"]["question_source"] | null
          user_id: string
        }
        Update: {
          answer_json?: Json | null
          answer_numeric?: number | null
          answer_text?: string | null
          answered_at?: string | null
          asked_at?: string | null
          checkin_session_id?: string | null
          context?: string | null
          id?: string
          priority_score?: number | null
          question_id?: string
          skipped_at?: string | null
          source?: Database["public"]["Enums"]["question_source"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_question_asks_checkin_session_id_fkey"
            columns: ["checkin_session_id"]
            isOneToOne: false
            referencedRelation: "checkin_sessions"
            referencedColumns: ["id"]
          },
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
      workout_log_exercises: {
        Row: {
          exercise_id: string | null
          id: string
          notes: string | null
          order_num: number
          original_exercise_id: string | null
          plan_exercise_id: string | null
          was_substituted: boolean
          workout_log_id: string
        }
        Insert: {
          exercise_id?: string | null
          id?: string
          notes?: string | null
          order_num?: number
          original_exercise_id?: string | null
          plan_exercise_id?: string | null
          was_substituted?: boolean
          workout_log_id: string
        }
        Update: {
          exercise_id?: string | null
          id?: string
          notes?: string | null
          order_num?: number
          original_exercise_id?: string | null
          plan_exercise_id?: string | null
          was_substituted?: boolean
          workout_log_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_log_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_log_exercises_original_exercise_id_fkey"
            columns: ["original_exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_log_exercises_plan_exercise_id_fkey"
            columns: ["plan_exercise_id"]
            isOneToOne: false
            referencedRelation: "plan_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_log_exercises_workout_log_id_fkey"
            columns: ["workout_log_id"]
            isOneToOne: false
            referencedRelation: "workout_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_log_sets: {
        Row: {
          created_at: string
          duration_sec: number | null
          id: string
          reps: number | null
          rir: number | null
          set_number: number
          to_failure: boolean
          weight_kg: number | null
          workout_log_exercise_id: string
        }
        Insert: {
          created_at?: string
          duration_sec?: number | null
          id?: string
          reps?: number | null
          rir?: number | null
          set_number: number
          to_failure?: boolean
          weight_kg?: number | null
          workout_log_exercise_id: string
        }
        Update: {
          created_at?: string
          duration_sec?: number | null
          id?: string
          reps?: number | null
          rir?: number | null
          set_number?: number
          to_failure?: boolean
          weight_kg?: number | null
          workout_log_exercise_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_log_sets_workout_log_exercise_id_fkey"
            columns: ["workout_log_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_log_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_logs: {
        Row: {
          created_at: string
          duration_min: number | null
          ended_at: string | null
          id: string
          notes: string | null
          overall_rating: number | null
          plan_workout_id: string | null
          pre_energy: Database["public"]["Enums"]["energy_level"] | null
          pre_mood: Database["public"]["Enums"]["pre_mood"] | null
          started_at: string
          user_id: string
          went_poorly: string | null
          went_well: string | null
          what_to_improve: string | null
        }
        Insert: {
          created_at?: string
          duration_min?: number | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          overall_rating?: number | null
          plan_workout_id?: string | null
          pre_energy?: Database["public"]["Enums"]["energy_level"] | null
          pre_mood?: Database["public"]["Enums"]["pre_mood"] | null
          started_at?: string
          user_id: string
          went_poorly?: string | null
          went_well?: string | null
          what_to_improve?: string | null
        }
        Update: {
          created_at?: string
          duration_min?: number | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          overall_rating?: number | null
          plan_workout_id?: string | null
          pre_energy?: Database["public"]["Enums"]["energy_level"] | null
          pre_mood?: Database["public"]["Enums"]["pre_mood"] | null
          started_at?: string
          user_id?: string
          went_poorly?: string | null
          went_well?: string | null
          what_to_improve?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_plan_workout_id_fkey"
            columns: ["plan_workout_id"]
            isOneToOne: false
            referencedRelation: "plan_workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
      ai_task_status:
        | "queued"
        | "running"
        | "completed"
        | "failed"
        | "cancelled"
      ai_task_type:
        | "generate_training_plan"
        | "generate_nutrition_plan"
        | "analyze_meal_photo"
        | "weekly_checkin_analysis"
        | "pick_next_question"
        | "classify_intent"
        | "proactive_nudge"
        | "recalculate_targets"
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
      checkin_verdict:
        | "on_track"
        | "needs_adjustment"
        | "plan_change_recommended"
      coach_intent:
        | "technical_exercise"
        | "diet"
        | "motivation"
        | "pain"
        | "goal_extreme"
        | "greeting"
        | "other"
      difficulty: "beginner" | "intermediate" | "advanced"
      energy_level: "low" | "moderate" | "high" | "variable"
      entry_point:
        | "global_bubble"
        | "exercise_shortcut"
        | "meal_shortcut"
        | "checkin_shortcut"
        | "proactive_coach"
        | "onboarding"
      exercise_category:
        | "push"
        | "pull"
        | "legs"
        | "core"
        | "cardio"
        | "mobility"
        | "full_body"
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
      meal_log_status: "pending_analysis" | "analyzed" | "failed" | "manual"
      meal_source: "photo" | "manual"
      meal_type:
        | "breakfast"
        | "lunch"
        | "dinner"
        | "snack"
        | "drink"
        | "dessert"
      message_role: "user" | "assistant" | "system" | "tool"
      nutrition_mode: "simple" | "ranges" | "exact"
      pre_mood: "bad" | "ok" | "good" | "great"
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
      question_source: "contextual" | "proactive" | "checkin" | "onboarding"
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
      ai_task_status: ["queued", "running", "completed", "failed", "cancelled"],
      ai_task_type: [
        "generate_training_plan",
        "generate_nutrition_plan",
        "analyze_meal_photo",
        "weekly_checkin_analysis",
        "pick_next_question",
        "classify_intent",
        "proactive_nudge",
        "recalculate_targets",
      ],
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
      checkin_verdict: [
        "on_track",
        "needs_adjustment",
        "plan_change_recommended",
      ],
      coach_intent: [
        "technical_exercise",
        "diet",
        "motivation",
        "pain",
        "goal_extreme",
        "greeting",
        "other",
      ],
      difficulty: ["beginner", "intermediate", "advanced"],
      energy_level: ["low", "moderate", "high", "variable"],
      entry_point: [
        "global_bubble",
        "exercise_shortcut",
        "meal_shortcut",
        "checkin_shortcut",
        "proactive_coach",
        "onboarding",
      ],
      exercise_category: [
        "push",
        "pull",
        "legs",
        "core",
        "cardio",
        "mobility",
        "full_body",
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
      message_role: ["user", "assistant", "system", "tool"],
      nutrition_mode: ["simple", "ranges", "exact"],
      pre_mood: ["bad", "ok", "good", "great"],
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
      question_source: ["contextual", "proactive", "checkin", "onboarding"],
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

