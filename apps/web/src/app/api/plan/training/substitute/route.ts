import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { substituteExercise } from '@nudge/core/planners/training/substituteExercise'
import type { ExerciseCatalogEntry } from '@nudge/core/planners/training/types'
import type { SubstitutionReason } from '@nudge/core/planners/training/types'

const bodySchema = z.object({
  plan_exercise_id: z.string().uuid(),
  current_slug: z.string().min(1),
  reason: z.enum(['machine_busy', 'unclear', 'discomfort', 'too_hard']),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })

  const { plan_exercise_id, current_slug, reason } = parsed.data

  // Load user equipment for filtering
  const [equipmentRes, catalogRes] = await Promise.all([
    supabase.from('user_equipment').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('exercises').select('id, slug, name_pl, category, primary_muscles, equipment_required, difficulty, is_compound, alternatives_slugs, easy_substitution_slugs, machine_busy_substitution_slugs').eq('deprecated', false),
  ])

  const equipment = equipmentRes.data
  const catalog = (catalogRes.data ?? []) as ExerciseCatalogEntry[]

  const availableEquipment: string[] = []
  if (equipment?.has_barbell) availableEquipment.push('barbell')
  if (equipment?.has_dumbbells) availableEquipment.push('dumbbells')
  if (equipment?.has_machines) availableEquipment.push('machines')
  if (equipment?.has_cables) availableEquipment.push('cables')
  if (equipment?.has_pullup_bar) availableEquipment.push('pullup_bar')
  if (equipment?.has_bench) availableEquipment.push('bench')

  const sub = substituteExercise({
    currentSlug: current_slug,
    reason: reason as SubstitutionReason,
    catalog,
    availableEquipment,
  })
  if (!sub) {
    return NextResponse.json({ error: 'No suitable substitute found' }, { status: 404 })
  }

  const newExercise = catalog.find((e) => e.slug === sub.newExerciseSlug)
  if (!newExercise) return NextResponse.json({ error: 'Substitute exercise not found' }, { status: 404 })

  // Update the plan_exercise record (verify ownership via RLS chain)
  const { error: updateError } = await supabase
    .from('plan_exercises')
    .update({ exercise_id: newExercise.id })
    .eq('id', plan_exercise_id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update exercise' }, { status: 500 })
  }

  return NextResponse.json({ new_exercise: newExercise, reason: sub.reason })
}
