import type { Metadata } from 'next'
import { Dumbbell } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { GeneratePlanButton } from './GeneratePlanButton'
import { PlanWeekBoard } from './PlanWeekBoard'

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

  if (!version) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-8 px-5 pt-6 pb-24 animate-stagger">
        <header className="flex flex-col gap-2">
          <p className="text-label uppercase text-muted-foreground">Plan</p>
          <h1 className="text-display-l font-display leading-[1.05] tracking-tight text-balance">
            <span className="font-sans font-semibold">Twój plan treningowy</span>
          </h1>
        </header>

        <Card variant="hero" padding="xl" className="animate-rise-in">
          <div className="flex flex-col items-start gap-5">
            <Dumbbell className="h-8 w-8 text-brand" aria-hidden="true" />
            <div className="flex flex-col gap-2">
              <p className="text-label uppercase text-muted-foreground">Brak aktywnego planu</p>
              <p className="text-display-m font-display text-balance">
                <span className="font-sans font-semibold">Jeszcze nie masz planu.</span>
              </p>
              <p className="text-body-m text-muted-foreground">
                Wróć do zakładki <span className="font-medium text-foreground">Dziś</span> i wygeneruj go
                {' '}— dopasujemy ćwiczenia do Twojego celu.
              </p>
            </div>
            <GeneratePlanButton />
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-5 pt-6 pb-24 animate-stagger">
      <PlanWeekBoard version={version} />
    </div>
  )
}
