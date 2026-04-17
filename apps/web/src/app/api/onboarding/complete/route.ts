import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { TablesInsert } from '@nudge/core/types/db'
import { calculateAgeBucket, calculateAgeBucketFromAge } from '@nudge/core/rules/calculateAgeBucket'
import { classifySegment } from '@nudge/core/rules/classifySegment'
import { generateFactsFromOnboarding, equipmentFromOnboarding } from '@nudge/core/rules/generateFactsFromOnboarding'
import { qualifyEntryPath } from '@nudge/core/rules/qualifyEntryPath'
import {
  normalizeExperienceLevel,
  type JobActivity,
  type LocationType,
  type ProfileInput,
  type RecentActivityWindow,
  type TrainingBackground,
} from '@nudge/core/domain/profile'
import type { Json } from '@nudge/core/types/db'

const experienceLevelSchema = z.enum([
  'zero',
  'beginner_zero',
  'beginner',
  'amateur',
  'intermediate',
  'advanced',
])

const recentActivitySchema = z.enum([
  'never_regular',
  'over_12_months',
  'within_12_months',
  'within_3_months',
])

const trainingBackgroundSchema = z.enum([
  'just_starting',
  'returning_after_break',
  'knows_basics_needs_plan',
  'training_regularly',
])

const jobActivitySchema = z.enum([
  'mostly_sitting',
  'mixed',
  'mostly_standing',
  'physically_active',
])

const bodySchema = z.object({
  primary_goal: z.enum(['weight_loss', 'muscle_building', 'strength_performance', 'general_health']).nullable().optional(),
  age_years: z.number().int().min(16).max(99).nullable().optional(),
  birth_date: z.string().nullable().optional(),
  gender: z.enum(['female', 'male', 'other', 'prefer_not_to_say']).nullable().optional(),
  height_cm: z.number().nullable().optional(),
  current_weight_kg: z.number().nullable().optional(),
  days_per_week: z.number().int().min(1).max(7).nullable().optional(),
  equipment_location: z.enum(['home', 'gym', 'mixed']).nullable().optional(),
  equipment_list: z.array(z.string()).nullable().optional(),
  recent_activity_window: recentActivitySchema.nullable().optional(),
  training_background: trainingBackgroundSchema.nullable().optional(),
  experience_level: experienceLevelSchema.nullable().optional(),
  health_constraints: z.array(z.string()).nullable().optional(),
  job_activity: jobActivitySchema.nullable().optional(),
  nutrition_mode: z.enum(['simple', 'ranges', 'exact']).nullable().optional(),
  dietary_constraints: z.array(z.string()).nullable().optional(),
  life_context: z.array(z.string()).nullable().optional(),
  display_name: z.string().nullable().optional(),
})

function mapExperienceToBackground(
  experienceLevel: string | null | undefined,
): TrainingBackground | null {
  const normalized = normalizeExperienceLevel(
    experienceLevel as Parameters<typeof normalizeExperienceLevel>[0],
  )
  if (normalized === 'beginner_zero') return 'just_starting'
  if (normalized === 'beginner') return 'returning_after_break'
  if (normalized === 'intermediate' || normalized === 'advanced') return 'training_regularly'
  return null
}

function mapExperienceToRecentActivity(
  experienceLevel: string | null | undefined,
): RecentActivityWindow | null {
  const normalized = normalizeExperienceLevel(
    experienceLevel as Parameters<typeof normalizeExperienceLevel>[0],
  )
  if (normalized === 'beginner_zero') return 'never_regular'
  if (normalized === 'beginner') return 'within_12_months'
  if (normalized === 'intermediate' || normalized === 'advanced') return 'within_3_months'
  return null
}

function mapJobActivityToLifeContext(jobActivity: JobActivity | null): string[] {
  switch (jobActivity) {
    case 'mostly_sitting':
      return ['desk_job', 'high_sitting_time']
    case 'mixed':
      return ['mixed_workday']
    case 'mostly_standing':
      return ['on_feet_often']
    case 'physically_active':
      return ['physically_active_work']
    default:
      return []
  }
}

function mapJobActivityToActivityLevel(jobActivity: JobActivity | null): 'sedentary' | 'light' | 'moderate' | 'active' | null {
  switch (jobActivity) {
    case 'mostly_sitting':
      return 'sedentary'
    case 'mixed':
      return 'light'
    case 'mostly_standing':
      return 'moderate'
    case 'physically_active':
      return 'active'
    default:
      return null
  }
}

function defaultSessionDuration(entryPath: 'guided_beginner' | 'standard_training', phase: string | null): number {
  if (entryPath !== 'guided_beginner') return 45
  if (phase === 'phase_0_familiarization') return 20
  if (phase === 'phase_1_adaptation') return 25
  return 30
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const data = parsed.data
  const ageYears =
    data.age_years ??
    (data.birth_date ? new Date().getFullYear() - parseInt(data.birth_date.slice(0, 4), 10) : null)

  if (ageYears != null && ageYears < 18) {
    await supabase.from('user_safety_flags').insert({
      user_id: user.id,
      flag: 'underage',
      severity: 'critical',
      status: 'active',
      source: 'onboarding',
    })
    return NextResponse.json({ blocked: true, reason: 'underage' }, { status: 200 })
  }

  const trainingBackground =
    data.training_background ?? mapExperienceToBackground(data.experience_level)
  const recentActivityWindow =
    data.recent_activity_window ?? mapExperienceToRecentActivity(data.experience_level)
  const healthConstraints = data.health_constraints ?? []

  const qualification = qualifyEntryPath({
    ageYears,
    heightCm: data.height_cm ?? null,
    currentWeightKg: data.current_weight_kg ?? null,
    recentActivityWindow,
    trainingBackground,
    healthConstraints,
  })

  const ageBucket = calculateAgeBucket(data.birth_date ?? null) ?? calculateAgeBucketFromAge(ageYears)
  const lifeContext = [...new Set([...(data.life_context ?? []), ...mapJobActivityToLifeContext(data.job_activity ?? null)])]

  const profileInput: ProfileInput = {
    age_years: ageYears,
    primary_goal: data.primary_goal ?? null,
    birth_date: data.birth_date ?? null,
    gender: data.gender ?? null,
    height_cm: data.height_cm ?? null,
    current_weight_kg: data.current_weight_kg ?? null,
    days_per_week: data.days_per_week ?? null,
    equipment_location: data.equipment_location ?? null,
    equipment_list: data.equipment_list ?? [],
    experience_level: qualification.experienceLevel,
    health_constraints: healthConstraints,
    entry_path: qualification.entryPath,
    adaptation_phase: qualification.adaptationPhase,
    needs_guided_mode: qualification.needsGuidedMode,
    nutrition_mode: qualification.nutritionMode,
    dietary_constraints: data.dietary_constraints ?? null,
    life_context: lifeContext,
    recent_activity_window: recentActivityWindow,
    last_regular_activity: recentActivityWindow,
    training_background: trainingBackground,
    job_activity: data.job_activity ?? null,
    is_pregnant: null,
  }

  const facts = generateFactsFromOnboarding(profileInput)
  const factsWithUser = facts.map((fact) => ({
    ...fact,
    user_id: user.id,
    value_json: fact.value_json as Json | null,
  }))

  const { error: factsError } = await supabase.from('user_profile_facts').insert(factsWithUser)
  if (factsError) {
    return NextResponse.json({ error: 'Failed to save facts' }, { status: 500 })
  }

  if (qualification.requiresSafetyScreening) {
    const inserts: TablesInsert<'user_safety_flags'>[] = healthConstraints
      .filter((constraint) => constraint !== 'none')
      .map((constraint) => ({
        user_id: user.id,
        flag:
          constraint === 'medication_affecting_exertion'
            ? 'medication_interaction'
            : constraint === 'medical_condition'
              ? 'medical_condition'
              : 'injury_reported',
        severity: 'warning' as const,
        status: 'active' as const,
        source: 'onboarding',
        notes: constraint,
      }))

    if (inserts.length > 0) {
      await supabase.from('user_safety_flags').insert(inserts)
    }
  }

  const segmentResult = classifySegment({
    experience_level: qualification.experienceLevel,
    primary_goal: data.primary_goal ?? null,
    gender: data.gender ?? null,
    age_bucket: ageBucket,
    life_context: lifeContext,
  })

  const profileUpdate: Record<string, unknown> = {
    onboarding_layer_1_done: true,
    onboarding_completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    experience_level: qualification.experienceLevel,
    primary_goal: data.primary_goal ?? null,
    tone_preset: qualification.tonePreset,
    nutrition_mode: qualification.nutritionMode,
    entry_path: qualification.entryPath,
    adaptation_phase: qualification.adaptationPhase,
    needs_guided_mode: qualification.needsGuidedMode,
    inferred_beginner_status: qualification.inferredBeginnerStatus,
    inferred_beginner_reason_codes: qualification.inferredBeginnerReasonCodes,
    dietary_constraints: data.dietary_constraints ?? null,
    life_context: lifeContext,
    age_bucket: ageBucket,
    ...(data.display_name ? { display_name: data.display_name } : {}),
    ...(data.birth_date ? { birth_date: data.birth_date } : {}),
    ...(data.gender ? { gender: data.gender } : {}),
    ...(data.height_cm ? { height_cm: data.height_cm } : {}),
    ...(data.current_weight_kg ? { current_weight_kg: data.current_weight_kg } : {}),
  }

  const { error: profileError } = await supabase
    .from('user_profile')
    .upsert({ user_id: user.id, ...profileUpdate })

  if (profileError) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }

  if (data.equipment_location) {
    const equipment = equipmentFromOnboarding(
      data.equipment_location as LocationType,
      data.equipment_list ?? [],
    )
    await supabase.from('user_equipment').upsert({
      user_id: user.id,
      ...equipment,
      updated_at: new Date().toISOString(),
    })
  }

  await supabase.from('user_training_preferences').upsert({
    user_id: user.id,
    days_per_week: data.days_per_week ?? null,
    session_duration_min: defaultSessionDuration(
      qualification.entryPath,
      qualification.adaptationPhase,
    ),
    preferred_location: data.equipment_location ?? null,
    prefers_guided_mode: qualification.needsGuidedMode,
    updated_at: new Date().toISOString(),
  })

  await supabase.from('user_nutrition_preferences').upsert({
    user_id: user.id,
    nutrition_mode: qualification.nutritionMode,
    prioritize_regular_meals: true,
    prioritize_protein: true,
    prioritize_hydration: true,
    updated_at: new Date().toISOString(),
  })

  const healthWithoutNone = healthConstraints.filter((constraint) => constraint !== 'none')
  await supabase.from('user_health').upsert({
    user_id: user.id,
    injuries: healthWithoutNone.filter((constraint) => constraint === 'pain_or_injury'),
    medical_conditions: healthWithoutNone.filter((constraint) =>
      ['medical_condition', 'medication_affecting_exertion', 'other_contraindication'].includes(constraint),
    ),
    activity_level: mapJobActivityToActivityLevel(data.job_activity ?? null),
    notes: healthWithoutNone.length > 0 ? healthWithoutNone.join(', ') : null,
    updated_at: new Date().toISOString(),
  })

  if (data.primary_goal) {
    await supabase
      .from('user_goals')
      .update({ is_current: false, ended_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_current', true)

    await supabase.from('user_goals').insert({
      user_id: user.id,
      goal_type: data.primary_goal,
      is_current: true,
      started_at: new Date().toISOString(),
    })
  }

  await supabase.from('user_segment_snapshots').insert({
    user_id: user.id,
    ...segmentResult,
    entry_path: qualification.entryPath,
    adaptation_phase: qualification.adaptationPhase,
    computed_at: new Date().toISOString(),
  })

  return NextResponse.json({
    success: true,
    segment_key: segmentResult.segment_key,
    experience_level: qualification.experienceLevel,
    entry_path: qualification.entryPath,
    adaptation_phase: qualification.adaptationPhase,
    guided_mode: qualification.guidedMode,
    inferred_beginner_status: qualification.inferredBeginnerStatus,
  })
}
