import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const bodySchema = z.object({
  exercise_id: z.string().uuid(),
  plan_exercise_id: z.string().uuid().optional(),
  order_num: z.number().int().min(1),
  set_number: z.number().int().min(1),
  weight_kg: z.number().min(0).max(1000).nullable(),
  reps: z.number().int().min(0).max(999).nullable(),
  rir: z.number().min(0).max(10).nullable(),
  to_failure: z.boolean().default(false),
  duration_sec: z.number().int().min(0).nullable().optional(),
  workout_log_exercise_id: z.string().uuid().optional(),
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

  // Verify ownership
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

  const {
    exercise_id,
    plan_exercise_id,
    order_num,
    set_number,
    weight_kg,
    reps,
    rir,
    to_failure,
    duration_sec,
    workout_log_exercise_id,
  } = parsed.data

  // Upsert workout_log_exercise (idempotent by workout_log_id + plan_exercise_id + exercise_id)
  let logExerciseId = workout_log_exercise_id
  if (!logExerciseId) {
    const { data: existing } = await supabase
      .from('workout_log_exercises')
      .select('id')
      .eq('workout_log_id', workoutLogId)
      .eq('exercise_id', exercise_id)
      .maybeSingle()

    if (existing) {
      logExerciseId = existing.id
    } else {
      const { data: inserted, error: exErr } = await supabase
        .from('workout_log_exercises')
        .insert({
          workout_log_id: workoutLogId,
          exercise_id,
          plan_exercise_id: plan_exercise_id ?? null,
          order_num,
        })
        .select('id')
        .single()

      if (exErr || !inserted) {
        return NextResponse.json({ error: exErr?.message ?? 'Insert failed' }, { status: 500 })
      }
      logExerciseId = inserted.id
    }
  }

  const { data: setRow, error: setErr } = await supabase
    .from('workout_log_sets')
    .insert({
      workout_log_exercise_id: logExerciseId,
      set_number,
      weight_kg: weight_kg ?? null,
      reps: reps ?? null,
      rir: rir ?? null,
      to_failure,
      duration_sec: duration_sec ?? null,
    })
    .select('id')
    .single()

  if (setErr || !setRow) {
    return NextResponse.json({ error: setErr?.message ?? 'Insert failed' }, { status: 500 })
  }

  return NextResponse.json(
    { set_id: setRow.id, workout_log_exercise_id: logExerciseId },
    { status: 201 },
  )
}
