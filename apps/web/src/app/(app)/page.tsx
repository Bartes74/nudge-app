import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { TodayCard } from './TodayCard'

export const metadata: Metadata = { title: 'Dziś' }

export default async function TodayPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const firstName =
    (user?.user_metadata?.['full_name'] as string | undefined)?.split(' ')[0] ??
    'tam'

  // Load today's workout from active plan
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase() // mon, tue, ...

  const { data: plan } = await supabase
    .from('training_plans')
    .select(`
      id,
      current_version:training_plan_versions!training_plans_current_version_fk (
        id, week_structure,
        workouts:plan_workouts (
          id, day_label, order_in_week, name, duration_min_estimated,
          exercises:plan_exercises (
            id, order_num, sets, reps_min, reps_max, rir_target, rest_seconds, technique_notes,
            exercise:exercises!plan_exercises_exercise_id_fkey (
              id, slug, name_pl, category, is_compound
            )
          )
        )
      )
    `)
    .eq('user_id', user!.id)
    .eq('is_active', true)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Check if onboarding is done
  const { data: profile } = await supabase
    .from('user_profile')
    .select('onboarding_layer_1_done')
    .eq('user_id', user!.id)
    .maybeSingle()

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold">
          Dzień dobry, {firstName}!
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {new Date().toLocaleDateString('pl-PL', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </p>
      </div>

      <TodayCard
        plan={plan as Parameters<typeof TodayCard>[0]['plan']}
        todayDayLabel={today}
        onboardingDone={profile?.onboarding_layer_1_done ?? false}
      />
    </div>
  )
}
