import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { inngest } from '@/inngest/client'

const bodySchema = z.object({
  overall_rating: z.number().int().min(1).max(5),
  went_well: z.string().max(500).optional(),
  went_poorly: z.string().max(500).optional(),
  what_to_improve: z.string().max(500).optional(),
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
    .select('id, started_at')
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

  const endedAt = new Date()
  const startedAt = new Date(log.started_at as string)
  const durationMin = Math.round((endedAt.getTime() - startedAt.getTime()) / 60000)

  const { error: updateErr } = await supabase
    .from('workout_logs')
    .update({
      ended_at: endedAt.toISOString(),
      duration_min: durationMin,
      overall_rating: parsed.data.overall_rating,
      went_well: parsed.data.went_well ?? null,
      went_poorly: parsed.data.went_poorly ?? null,
      what_to_improve: parsed.data.what_to_improve ?? null,
    })
    .eq('id', workoutLogId)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  await inngest.send({
    name: 'nudge/workout.finished',
    data: { user_id: user.id, workout_log_id: workoutLogId },
  })

  return NextResponse.json({ ok: true })
}
