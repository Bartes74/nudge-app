import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const bodySchema = z.object({
  plan_workout_id: z.string().uuid().optional(),
  pre_mood: z.enum(['bad', 'ok', 'good', 'great']).optional(),
  pre_energy: z.enum(['low', 'moderate', 'high', 'variable']).optional(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { plan_workout_id, pre_mood, pre_energy } = parsed.data

  const { data: log, error } = await supabase
    .from('workout_logs')
    .insert({
      user_id: user.id,
      plan_workout_id: plan_workout_id ?? null,
      pre_mood: pre_mood ?? null,
      pre_energy: pre_energy ?? null,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error || !log) {
    return NextResponse.json({ error: error?.message ?? 'Insert failed' }, { status: 500 })
  }

  return NextResponse.json({ workout_log_id: log.id }, { status: 201 })
}
