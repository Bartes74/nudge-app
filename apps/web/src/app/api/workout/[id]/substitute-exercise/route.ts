import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const bodySchema = z.object({
  workout_log_exercise_id: z.string().uuid(),
  new_exercise_id: z.string().uuid(),
  original_exercise_id: z.string().uuid(),
  order_num: z.number().int().min(1),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: workoutLogId } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: log } = await supabase
    .from('workout_logs')
    .select('id')
    .eq('id', workoutLogId)
    .eq('user_id', user.id)
    .single()

  if (!log) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { workout_log_exercise_id, new_exercise_id, original_exercise_id, order_num } = parsed.data

  // Mark existing log_exercise as substituted
  const { error: updateErr } = await supabase
    .from('workout_log_exercises')
    .update({
      was_substituted: true,
      original_exercise_id,
    })
    .eq('id', workout_log_exercise_id)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  // Insert new log_exercise for the substitute
  const { data: newEx, error: insertErr } = await supabase
    .from('workout_log_exercises')
    .insert({
      workout_log_id: workoutLogId,
      exercise_id: new_exercise_id,
      order_num,
      was_substituted: false,
    })
    .select('id')
    .single()

  if (insertErr || !newEx) {
    return NextResponse.json({ error: insertErr?.message ?? 'Insert failed' }, { status: 500 })
  }

  return NextResponse.json({ new_workout_log_exercise_id: newEx.id }, { status: 201 })
}
