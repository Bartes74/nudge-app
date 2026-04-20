import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PageBackLink, PageHero, PageSection } from '@/components/layout/PageHero'
import { HistoryList } from './HistoryList'

export const metadata: Metadata = { title: 'Historia treningów' }

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: initialLogs } = await supabase
    .from('workout_logs')
    .select(`
      id, started_at, ended_at, duration_min, overall_rating, pre_mood,
      plan_workout:plan_workouts!workout_logs_plan_workout_id_fkey ( name, day_label ),
      exercises:workout_log_exercises (
        id, order_num, was_substituted,
        exercise:exercises!workout_log_exercises_exercise_id_fkey ( name_pl, slug ),
        sets:workout_log_sets ( id, weight_kg, reps )
      )
    `)
    .eq('user_id', user!.id)
    .order('started_at', { ascending: false })
    .limit(21)

  const hasMore = (initialLogs?.length ?? 0) > 20
  const items = hasMore ? initialLogs!.slice(0, 20) : (initialLogs ?? [])
  const nextCursor = hasMore ? items[items.length - 1]?.started_at : null

  return (
    <div className="flex flex-col gap-12">
      <PageBackLink href="/app/progress" label="Postępy" />

      <PageHero
        eyebrow="Log"
        titleEmphasis="Twoja"
        titleMain="historia."
        lede="Tutaj zobaczysz ostatnie treningi, oceny i szczegóły wykonanych sesji."
      />

      <PageSection
        number="01 — Ostatnie sesje"
        title="Historia treningów"
        description="Najświeższe wpisy są na górze. Możesz przewijać w dół, żeby zobaczyć starsze sesje."
      >
        <HistoryList
          initialItems={items as Parameters<typeof HistoryList>[0]['initialItems']}
          initialNextCursor={nextCursor ?? null}
        />
      </PageSection>
    </div>
  )
}
