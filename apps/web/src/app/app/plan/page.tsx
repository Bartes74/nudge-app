import type { Metadata } from 'next'
import { Dumbbell } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { PageHero } from '@/components/layout/PageHero'
import { GeneratePlanButton } from './GeneratePlanButton'
import { PlanWeekBoard } from './PlanWeekBoard'
import { summarizeWeekWorkoutStatuses, type PlanWorkoutVisualStatus } from '@/lib/training/weekPlan'

export const metadata: Metadata = { title: 'Plan' }

export default async function PlanPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: plan } = await supabase
    .from('training_plans')
    .select(`
      id, name,
      current_version:training_plan_versions!training_plans_current_version_fk (
        id, progression_rules, guided_mode, adaptation_phase, view_mode,
        workouts:plan_workouts (
          id, day_label, order_in_week, name, duration_min_estimated,
          steps:plan_workout_steps ( id, step_type, duration_min ),
          exercises:plan_exercises ( id )
        )
      )
    `)
    .eq('user_id', user!.id)
    .eq('is_active', true)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const version = plan?.current_version as {
    id: string
    progression_rules: { method: string; add_weight_kg: number; when: string } | null
    guided_mode?: boolean | null
    adaptation_phase?: string | null
    view_mode?: 'guided_beginner_view' | 'standard_training_view' | null
    workouts: Array<{
      id: string
      day_label: string
      order_in_week: number
      name: string
      duration_min_estimated: number
      steps?: Array<{ id: string; step_type: string; duration_min: number | null }> | null
      exercises?: Array<{ id: string }> | null
    }>
  } | null

  let workoutStatusById: Record<string, PlanWorkoutVisualStatus> = {}

  if (version?.workouts.length) {
    const workoutIds = version.workouts.map((workout) => workout.id)
    const { data: workoutLogs } = await supabase
      .from('workout_logs')
      .select('plan_workout_id, ended_at, overall_rating')
      .eq('user_id', user!.id)
      .in('plan_workout_id', workoutIds)

    workoutStatusById = summarizeWeekWorkoutStatuses(
      version.workouts,
      workoutLogs ?? [],
    ).statusByWorkoutId
  }

  if (!version) {
    return (
      <div className="flex flex-col gap-12">
        <PageHero
          eyebrow="Plan"
          titleEmphasis="Twój"
          titleMain="plan treningowy."
          lede="Gdy wygenerujesz plan, ułożymy tydzień treningów na podstawie Twojego celu i dostępności."
        />

        <Card variant="elevated" padding="xl">
          <div className="flex flex-col items-start gap-5">
            <Dumbbell className="h-8 w-8 text-[var(--fg-accent-copper)]" aria-hidden="true" />
            <div className="flex flex-col gap-2">
              <p className="ds-label">Brak aktywnego planu</p>
              <p className="text-display-m font-display text-balance leading-[1.05]">
                <span className="font-sans font-semibold">Jeszcze nie masz planu.</span>
              </p>
              <p className="font-editorial text-body-m leading-[var(--leading-relaxed)] text-[var(--fg-secondary)]">
                Wygeneruj go tutaj od zera, a dopasujemy ćwiczenia do Twojego celu i tego,
                jak chcesz trenować.
              </p>
            </div>
            <GeneratePlanButton />
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-12">
      <PlanWeekBoard version={version} workoutStatusById={workoutStatusById} />
    </div>
  )
}
