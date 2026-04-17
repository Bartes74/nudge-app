import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ExerciseHistoryChart } from './ExerciseHistoryChart'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  return { title: `Historia: ${slug.replace(/_/g, ' ')}` }
}

export default async function ExerciseHistoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: exercise } = await supabase
    .from('exercises')
    .select('id, name_pl, slug')
    .eq('slug', slug)
    .eq('deprecated', false)
    .single()

  if (!exercise) notFound()

  const { data: logExercises } = await supabase
    .from('workout_log_exercises')
    .select(`
      id,
      workout_log:workout_logs!workout_log_exercises_workout_log_id_fkey (
        id, started_at, ended_at
      ),
      sets:workout_log_sets ( weight_kg, reps, rir, set_number )
    `)
    .eq('exercise_id', exercise.id)
    .order('id', { ascending: false })
    .limit(50)

  type LogExercise = {
    id: string
    workout_log: { id: string; started_at: string; ended_at: string | null } | null
    sets: Array<{ weight_kg: number | null; reps: number | null; rir: number | null; set_number: number }>
  }

  const sessions = (logExercises as LogExercise[] ?? [])
    .filter((le) => le.workout_log != null)
    .map((le) => ({
      workout_log_id: le.workout_log!.id,
      started_at: le.workout_log!.started_at,
      max_weight_kg: le.sets.reduce(
        (max, s) => (s.weight_kg != null && s.weight_kg > max ? s.weight_kg : max),
        0,
      ) || null,
      total_sets: le.sets.length,
      sets: le.sets.sort((a, b) => a.set_number - b.set_number),
    }))
    .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime())

  return (
    <div className="flex flex-col gap-5 p-4 pb-8">
      <div className="flex items-center gap-2">
        <Link
          href={`/app/plan/exercise/${slug}`}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          {exercise.name_pl}
        </Link>
      </div>

      <h1 className="text-xl font-bold">Historia: {exercise.name_pl}</h1>

      {sessions.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Brak historii dla tego ćwiczenia.
        </p>
      ) : (
        <>
          <ExerciseHistoryChart sessions={sessions} />

          <div className="flex flex-col gap-3">
            {[...sessions].reverse().map((session) => (
              <div key={session.workout_log_id} className="rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    {new Date(session.started_at).toLocaleDateString('pl-PL', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    {session.max_weight_kg != null && (
                      <span>max {session.max_weight_kg} kg</span>
                    )}
                    <span>{session.total_sets} serii</span>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {session.sets.map((s, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-muted px-2 py-0.5 text-xs tabular-nums"
                    >
                      {s.weight_kg != null ? `${s.weight_kg}kg` : '—'}
                      {' × '}
                      {s.reps != null ? s.reps : '—'}
                      {s.rir != null ? ` @${s.rir}` : ''}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
