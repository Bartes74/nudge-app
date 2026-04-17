import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get active plan with current version
  const { data: plan, error: planError } = await supabase
    .from('training_plans')
    .select(`
      id, name, started_at,
      current_version:training_plan_versions!training_plans_current_version_fk (
        id, version_number, week_structure, progression_rules, additional_notes, change_reason, created_at,
        guided_mode, adaptation_phase, view_mode,
        workouts:plan_workouts (
          id, day_label, order_in_week, name, duration_min_estimated, confidence_goal,
          steps:plan_workout_steps (
            id, step_type, order_num, title, duration_min, instruction_text,
            setup_instructions, execution_steps, tempo_hint, breathing_hint,
            safety_notes, common_mistakes, stop_conditions, machine_settings,
            substitution_policy, starting_load_guidance, is_new_skill,
            exercise:exercises!plan_workout_steps_exercise_id_fkey (
              id, slug, name_pl, plain_language_name, simple_goal_description, category,
              setup_instructions, execution_steps, tempo_hint, breathing_hint,
              safety_notes, common_mistakes, easy_substitution_slugs,
              machine_busy_substitution_slugs, stop_conditions, starting_load_guidance
            )
          ),
          exercises:plan_exercises (
            id, order_num, sets, reps_min, reps_max, rir_target, rest_seconds,
            technique_notes, substitute_exercise_ids,
            exercise:exercises!plan_exercises_exercise_id_fkey (
              id, slug, name_pl, name_en, category, primary_muscles,
              equipment_required, difficulty, is_compound, technique_notes,
              alternatives_slugs
            )
          )
        )
      )
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  if (planError) {
    if (planError.code === 'PGRST116') return NextResponse.json({ plan: null })
    return NextResponse.json({ error: 'Failed to load plan' }, { status: 500 })
  }

  return NextResponse.json({ plan })
}
