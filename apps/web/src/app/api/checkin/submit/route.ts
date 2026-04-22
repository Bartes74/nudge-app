import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { computeAggregates, analyzeCheckin } from '@nudge/core/analyzers/checkin'

const bodySchema = z.object({
  week_of: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  subjective_energy: z.number().int().min(1).max(5),
  subjective_recovery: z.number().int().min(1).max(5),
  subjective_motivation: z.number().int().min(1).max(5),
  subjective_stress: z.number().int().min(1).max(5),
  subjective_sleep: z.number().int().min(1).max(5),
  wins_text: z.string().max(1000).optional(),
  struggles_text: z.string().max(1000).optional(),
  focus_next_week: z.string().max(1000).optional(),
})

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const {
    week_of,
    subjective_energy,
    subjective_recovery,
    subjective_motivation,
    subjective_stress,
    subjective_sleep,
    wins_text,
    struggles_text,
    focus_next_week,
  } = parsed.data

  // Prevent duplicate submit for same week
  const { data: existing } = await supabase
    .from('checkin_sessions')
    .select('id, verdict, verdict_summary, recommended_action, plan_change_needed, plan_change_details')
    .eq('user_id', user.id)
    .eq('week_of', week_of)
    .maybeSingle()

  if (existing?.verdict) {
    return NextResponse.json({ session: existing }, { status: 200 })
  }

  // Compute aggregates + profile in parallel
  const [aggregates, profileResult, segmentResult] = await Promise.all([
    computeAggregates(supabase, user.id, week_of),
    supabase
      .from('user_profile')
      .select('primary_goal, experience_level')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('user_segment_snapshots')
      .select('segment_key')
      .eq('user_id', user.id)
      .order('computed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const profile = {
    primaryGoal: profileResult.data?.primary_goal ?? null,
    segment: segmentResult.data?.segment_key ?? null,
    experienceLevel: profileResult.data?.experience_level ?? null,
  }

  const subjective = {
    energy: subjective_energy,
    recovery: subjective_recovery,
    motivation: subjective_motivation,
    stress: subjective_stress,
    sleep: subjective_sleep,
    winsText: wins_text ?? null,
    strugglesText: struggles_text ?? null,
    focusNextWeek: focus_next_week ?? null,
  }

  const apiKey = process.env['OPENAI_API_KEY']
  if (!apiKey) {
    return NextResponse.json({ error: 'LLM not configured' }, { status: 503 })
  }

  const { verdict, llmCallId } = await analyzeCheckin(aggregates, subjective, profile, {
    apiKey,
    supabase: adminSupabase,
    userId: user.id,
  })

  const now = new Date().toISOString()

  const sessionPayload = {
    user_id: user.id,
    week_of,
    workouts_completed: aggregates.workoutsCompleted,
    workouts_planned: aggregates.workoutsPlanned,
    avg_workout_rating: aggregates.avgWorkoutRating,
    weight_measurements: aggregates.weightMeasurements,
    weight_start_kg: aggregates.weightStartKg,
    weight_end_kg: aggregates.weightEndKg,
    weight_delta_kg: aggregates.weightDeltaKg,
    subjective_energy,
    subjective_recovery,
    subjective_motivation,
    subjective_stress,
    subjective_sleep,
    wins_text: wins_text ?? null,
    struggles_text: struggles_text ?? null,
    focus_next_week: focus_next_week ?? null,
    verdict: verdict.verdict,
    verdict_summary: verdict.verdictSummary,
    recommended_action: verdict.recommendedAction,
    plan_change_needed: verdict.planChangeNeeded,
    plan_change_details: verdict.planChangeDetails ?? null,
    submitted_at: now,
    analysis_at: now,
    llm_call_id: llmCallId,
  }

  const { data: session, error } = existing
    ? await supabase
        .from('checkin_sessions')
        .update(sessionPayload)
        .eq('id', existing.id)
        .select('id, verdict, verdict_summary, recommended_action, plan_change_needed, plan_change_details')
        .single()
    : await supabase
        .from('checkin_sessions')
        .insert(sessionPayload)
        .select('id, verdict, verdict_summary, recommended_action, plan_change_needed, plan_change_details')
        .single()

  if (error || !session) {
    return NextResponse.json({ error: error?.message ?? 'Insert failed' }, { status: 500 })
  }

  // Record ai_task for audit trail
  await supabase.from('ai_tasks').insert({
    user_id: user.id,
    task_type: 'weekly_checkin_analysis',
    status: 'completed',
    input_payload: { week_of, subjective },
    output_payload: { verdict: verdict.verdict, plan_change_needed: verdict.planChangeNeeded },
    queued_at: now,
    started_at: now,
    completed_at: now,
  })

  return NextResponse.json({ session }, { status: 201 })
}
