import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const bodySchema = z.object({
  trainer_feedback_notes: z.string().min(1),
  recommended_exercises: z.array(z.string()).optional(),
  avoid_exercises: z.array(z.string()).optional(),
  change_plan: z.boolean().optional(),
})

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
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const now = new Date().toISOString()

  const { error: profileError } = await supabase
    .from('user_profile')
    .update({
      trainer_feedback_notes: parsed.data.trainer_feedback_notes,
      trainer_consultation_completed_at: now,
    })
    .eq('user_id', user.id)

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  if (parsed.data.avoid_exercises && parsed.data.avoid_exercises.length > 0) {
    const { data: existingPreferences } = await supabase
      .from('user_training_preferences')
      .select('avoid_exercises')
      .eq('user_id', user.id)
      .maybeSingle()

    const nextAvoidExercises = [
      ...new Set([
        ...((existingPreferences?.avoid_exercises as string[] | null) ?? []),
        ...parsed.data.avoid_exercises,
      ]),
    ]

    await supabase.from('user_training_preferences').upsert({
      user_id: user.id,
      avoid_exercises: nextAvoidExercises,
      updated_at: now,
    })
  }

  await supabase.from('product_events').insert({
    user_id: user.id,
    event_name: 'trainer_consultation_completed',
    properties: {
      recommended_exercises: parsed.data.recommended_exercises ?? [],
      avoid_exercises: parsed.data.avoid_exercises ?? [],
      change_plan: parsed.data.change_plan ?? false,
    },
  })

  return NextResponse.json({ ok: true })
}
