import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { queueAiTask } from '@/lib/aiTasks.server'

const START_ERROR_MESSAGE =
  'Nie udało się uruchomić generowania planu treningowego. Spróbuj ponownie za chwilę.'

export async function POST(): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check profile is complete enough
  const { data: profile } = await supabase
    .from('user_profile')
    .select('experience_level, primary_goal, onboarding_layer_1_done')
    .eq('user_id', user.id)
    .single()

  if (!profile?.onboarding_layer_1_done) {
    return NextResponse.json({ error: 'Onboarding not complete' }, { status: 400 })
  }

  // Check for active critical safety flags
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

  try {
    const { taskId } = await queueAiTask({
      supabase,
      userId: user.id,
      taskType: 'generate_training_plan',
      eventName: 'nudge/plan.training.generate',
      taskFailureMessage: START_ERROR_MESSAGE,
    })

    return NextResponse.json({ task_id: taskId }, { status: 202 })
  } catch {
    return NextResponse.json({ error: START_ERROR_MESSAGE }, { status: 503 })
  }
}
