import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PageHero } from '@/components/layout/PageHero'
import { TodayCard } from './TodayCard'

export const metadata: Metadata = { title: 'Dziś' }

const POLAND_TIME_ZONE = 'Europe/Warsaw'

export default async function TodayPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const now = new Date()
  const today = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: POLAND_TIME_ZONE,
  }).format(now).toLowerCase() // mon, tue, ...

  const { data: plan } = await supabase
    .from('training_plans')
    .select(`
      id,
      current_version:training_plan_versions!training_plans_current_version_fk (
        id, week_structure, guided_mode, adaptation_phase, view_mode,
        workouts:plan_workouts (
          id, day_label, order_in_week, name, duration_min_estimated, confidence_goal,
          steps:plan_workout_steps (
            id, step_type, order_num, title, duration_min, instruction_text,
            setup_instructions, tempo_hint, breathing_hint, machine_settings
          ),
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
    .select('display_name, onboarding_layer_1_done, entry_path, adaptation_phase')
    .eq('user_id', user!.id)
    .maybeSingle()

  const firstName =
    profile?.display_name?.trim() ||
    (user?.user_metadata?.['full_name'] as string | undefined)?.split(' ')[0] ||
    null

  const { data: lastWorkout } = await supabase
    .from('workout_logs')
    .select(`
      ended_at,
      plan_workout:plan_workouts!workout_logs_plan_workout_id_fkey ( name )
    `)
    .eq('user_id', user!.id)
    .not('ended_at', 'is', null)
    .order('ended_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const hour = Number(
    new Intl.DateTimeFormat('en-GB', {
      hour: 'numeric',
      hourCycle: 'h23',
      timeZone: POLAND_TIME_ZONE,
    }).format(now),
  )
  const greetingPrefix =
    hour < 11 ? 'Dzień dobry'
    : hour < 18 ? 'Cześć'
    : 'Dobry wieczór'

  const dateLabel = new Intl.DateTimeFormat('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: POLAND_TIME_ZONE,
  }).format(now)

  return (
    <div className="flex flex-col gap-12">
      <PageHero
        eyebrow={<span suppressHydrationWarning className="tabular-nums">{dateLabel}</span>}
        titleEmphasis={<span suppressHydrationWarning>{`${greetingPrefix},`}</span>}
        titleMain={profile?.onboarding_layer_1_done && firstName ? `${firstName}.` : 'Dziś.'}
      />

      <TodayCard
        plan={plan as Parameters<typeof TodayCard>[0]['plan']}
        todayDayLabel={today}
        onboardingDone={profile?.onboarding_layer_1_done ?? false}
        entryPath={profile?.entry_path ?? null}
        adaptationPhase={profile?.adaptation_phase ?? null}
        lastCompletedWorkoutName={
          (lastWorkout?.plan_workout as { name: string | null } | null)?.name ?? null
        }
      />
    </div>
  )
}
