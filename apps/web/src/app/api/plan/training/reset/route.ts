import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cancelTrainingPlanTasks } from '@/lib/aiTasks.server'

export async function POST(): Promise<NextResponse> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await cancelTrainingPlanTasks({
      userId: user.id,
      statuses: ['queued', 'running'],
      reason: 'Bieżący plan został usunięty przez użytkownika.',
    })
  } catch {
    return NextResponse.json(
      { error: 'Nie udało się zatrzymać trwającego generowania planu.' },
      { status: 500 },
    )
  }

  const { data: archivedPlans, error } = await supabase
    .from('training_plans')
    .update({
      is_active: false,
      ended_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .eq('is_active', true)
    .select('id')

  if (error) {
    return NextResponse.json({ error: 'Nie udało się usunąć aktywnego planu.' }, { status: 500 })
  }

  if (!archivedPlans || archivedPlans.length === 0) {
    return NextResponse.json({ error: 'Nie masz teraz aktywnego planu.' }, { status: 404 })
  }

  revalidatePath('/app')
  revalidatePath('/app/plan')

  return NextResponse.json({ ok: true })
}
