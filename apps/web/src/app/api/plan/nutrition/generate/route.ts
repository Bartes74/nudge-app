import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { inngest } from '@/inngest/client'

export async function POST(): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profile')
    .select('onboarding_layer_1_done, primary_goal, current_weight_kg')
    .eq('user_id', user.id)
    .single()

  if (!profile?.onboarding_layer_1_done) {
    return NextResponse.json({ error: 'Onboarding not complete' }, { status: 400 })
  }

  if (!profile.primary_goal || !profile.current_weight_kg) {
    return NextResponse.json({ error: 'Insufficient profile data' }, { status: 400 })
  }

  const { data: flags } = await supabase
    .from('user_safety_flags')
    .select('flag, severity')
    .eq('user_id', user.id)
    .eq('status', 'active')

  const criticalFlags = (flags ?? []).filter((f) => f.severity === 'critical')
  if (criticalFlags.length > 0) {
    return NextResponse.json(
      { error: 'blocked_by_guardrails', flags: criticalFlags.map((f) => f.flag) },
      { status: 422 },
    )
  }

  await supabase
    .from('ai_tasks')
    .update({ status: 'cancelled' })
    .eq('user_id', user.id)
    .eq('task_type', 'generate_nutrition_plan')
    .eq('status', 'queued')

  const { data: task, error: taskError } = await supabase
    .from('ai_tasks')
    .insert({
      user_id: user.id,
      task_type: 'generate_nutrition_plan',
      status: 'queued',
    })
    .select('id')
    .single()

  if (taskError || !task) {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }

  await inngest.send({
    name: 'nudge/plan.nutrition.generate',
    data: { task_id: task.id, user_id: user.id },
  })

  return NextResponse.json({ task_id: task.id }, { status: 202 })
}
