import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
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
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-5 pt-6 pb-24 animate-stagger">
      <Link
        href="/app/progress"
        className="inline-flex w-fit items-center gap-1.5 text-label uppercase text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Postępy
      </Link>

      <header className="flex flex-col gap-2">
        <p className="text-label uppercase text-muted-foreground">Log</p>
        <h1 className="text-display-l font-display leading-[1.05] tracking-tight text-balance">
          <span className="font-display italic text-muted-foreground">Twoja</span>
          <br />
          <span className="font-sans font-semibold">historia.</span>
        </h1>
      </header>

      <HistoryList
        initialItems={items as Parameters<typeof HistoryList>[0]['initialItems']}
        initialNextCursor={nextCursor ?? null}
      />
    </div>
  )
}
