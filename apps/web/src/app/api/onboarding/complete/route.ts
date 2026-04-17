import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { classifySegment } from '@nudge/core/rules/classifySegment'
import { calculateAgeBucket } from '@nudge/core/rules/calculateAgeBucket'
import { generateFactsFromOnboarding, equipmentFromOnboarding } from '@nudge/core/rules/generateFactsFromOnboarding'
import type { ProfileInput, LocationType } from '@nudge/core/domain/profile'
import type { Json } from '@nudge/core/types/db'

const bodySchema = z.object({
  primary_goal: z.enum(['weight_loss', 'muscle_building', 'strength_performance', 'general_health']).nullable().optional(),
  birth_date: z.string().nullable().optional(),
  gender: z.enum(['female', 'male', 'other', 'prefer_not_to_say']).nullable().optional(),
  height_cm: z.number().nullable().optional(),
  current_weight_kg: z.number().nullable().optional(),
  days_per_week: z.number().int().min(1).max(7).nullable().optional(),
  equipment_location: z.enum(['home', 'gym', 'mixed']).nullable().optional(),
  equipment_list: z.array(z.string()).nullable().optional(),
  experience_level: z.enum(['zero', 'beginner', 'amateur', 'advanced']).nullable().optional(),
  health_constraints: z.array(z.string()).nullable().optional(),
  is_pregnant: z.boolean().nullable().optional(),
  nutrition_mode: z.enum(['simple', 'ranges', 'exact']).nullable().optional(),
  dietary_constraints: z.array(z.string()).nullable().optional(),
  life_context: z.array(z.string()).nullable().optional(),
  display_name: z.string().nullable().optional(),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
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
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data

  // --- Guardrails ---

  // Underage check
  if (data.birth_date) {
    const yearStr = data.birth_date.slice(0, 4)
    const birthYear = parseInt(yearStr, 10)
    const age = new Date().getFullYear() - birthYear
    if (!isNaN(age) && age < 18) {
      await supabase.from('user_safety_flags').insert({
        user_id: user.id,
        flag: 'underage',
        severity: 'critical',
        status: 'active',
        source: 'onboarding',
      })
      return NextResponse.json({ blocked: true, reason: 'underage' }, { status: 200 })
    }
  }

  // Pregnancy check
  if (data.is_pregnant === true) {
    await supabase.from('user_safety_flags').insert({
      user_id: user.id,
      flag: 'pregnancy',
      severity: 'critical',
      status: 'active',
      source: 'onboarding',
    })
    return NextResponse.json({ blocked: true, reason: 'pregnancy' }, { status: 200 })
  }

  const profileInput: ProfileInput = {
    primary_goal: data.primary_goal ?? null,
    birth_date: data.birth_date ?? null,
    gender: data.gender ?? null,
    height_cm: data.height_cm ?? null,
    current_weight_kg: data.current_weight_kg ?? null,
    days_per_week: data.days_per_week ?? null,
    equipment_location: data.equipment_location ?? null,
    experience_level: data.experience_level ?? null,
    health_constraints: data.health_constraints ?? null,
    is_pregnant: data.is_pregnant ?? null,
    nutrition_mode: data.nutrition_mode ?? null,
    dietary_constraints: data.dietary_constraints ?? null,
    life_context: data.life_context ?? null,
  }

  // --- Generate facts ---
  const facts = generateFactsFromOnboarding(profileInput)

  // --- Batch insert facts ---
  const factsWithUser = facts.map((f) => ({
    ...f,
    user_id: user.id,
    value_json: f.value_json as Json | null,
  }))
  const { error: factsError } = await supabase.from('user_profile_facts').insert(factsWithUser)
  if (factsError) {
    return NextResponse.json({ error: 'Failed to save facts' }, { status: 500 })
  }

  // --- Classify segment ---
  const ageBucket = calculateAgeBucket(data.birth_date ?? null)
  const segmentResult = classifySegment({
    experience_level: data.experience_level ?? null,
    primary_goal: data.primary_goal ?? null,
    gender: data.gender ?? null,
    age_bucket: ageBucket,
    life_context: data.life_context ?? null,
  })

  // --- Upsert user_profile ---
  const profileUpdate: Record<string, unknown> = {
    onboarding_layer_1_done: true,
    onboarding_completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...(data.display_name ? { display_name: data.display_name } : {}),
    ...(data.birth_date ? { birth_date: data.birth_date } : {}),
    ...(ageBucket ? { age_bucket: ageBucket } : {}),
    ...(data.gender ? { gender: data.gender } : {}),
    ...(data.height_cm ? { height_cm: data.height_cm } : {}),
    ...(data.current_weight_kg ? { current_weight_kg: data.current_weight_kg } : {}),
    ...(data.experience_level ? { experience_level: data.experience_level } : {}),
    ...(data.primary_goal ? { primary_goal: data.primary_goal } : {}),
    ...(data.nutrition_mode ? { nutrition_mode: data.nutrition_mode } : {}),
    ...(data.dietary_constraints ? { dietary_constraints: data.dietary_constraints } : {}),
    ...(data.life_context ? { life_context: data.life_context } : {}),
  }

  const { error: profileError } = await supabase
    .from('user_profile')
    .upsert({ user_id: user.id, ...profileUpdate })

  if (profileError) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }

  // --- Upsert user_equipment ---
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

  // --- Save health constraints to user_health ---
  if (data.health_constraints !== undefined) {
    const constraintsWithoutNone = (data.health_constraints ?? []).filter((c) => c !== 'none')
    await supabase.from('user_health').upsert({
      user_id: user.id,
      injuries: constraintsWithoutNone,
      updated_at: new Date().toISOString(),
    })
  }

  // --- Save goal ---
  if (data.primary_goal) {
    // Close existing current goals
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

  // --- Save segment snapshot ---
  await supabase.from('user_segment_snapshots').insert({
    user_id: user.id,
    ...segmentResult,
    computed_at: new Date().toISOString(),
  })

  return NextResponse.json({
    success: true,
    segment_key: segmentResult.segment_key,
  })
}
