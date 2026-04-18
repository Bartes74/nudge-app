import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
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
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-5 pt-6 pb-24 animate-stagger">
      <Link
        href={`/app/plan/exercise/${slug}`}
        className="inline-flex w-fit items-center gap-1.5 text-label uppercase text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {exercise.name_pl}
      </Link>

      <header className="flex flex-col gap-2">
        <p className="text-label uppercase text-muted-foreground">Historia</p>
        <h1 className="text-display-l font-display leading-[1.05] tracking-tight text-balance">
          <span className="font-display italic text-muted-foreground">Twoje sesje —</span>
          <br />
          <span className="font-sans font-semibold">{exercise.name_pl}.</span>
        </h1>
      </header>

      {sessions.length === 0 ? (
        <Card variant="outline" padding="xl" className="text-center">
          <p className="text-body-m text-muted-foreground">
            Brak historii dla tego ćwiczenia.
          </p>
        </Card>
      ) : (
        <>
          <ExerciseHistoryChart sessions={sessions} />

          <section className="flex flex-col gap-2.5">
            {[...sessions].reverse().map((session) => (
              <Card key={session.workout_log_id} variant="default" padding="sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-body-m font-semibold tracking-tight">
                    {new Date(session.started_at).toLocaleDateString('pl-PL', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                  <div className="flex shrink-0 gap-3 font-mono text-body-s tabular-nums text-muted-foreground">
                    {session.max_weight_kg != null && (
                      <span>
                        max <span className="text-foreground">{session.max_weight_kg}</span> kg
                      </span>
                    )}
                    <span>
                      <span className="text-foreground">{session.total_sets}</span> serii
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {session.sets.map((s, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-surface-2 px-2 py-0.5 font-mono text-body-s tabular-nums text-foreground"
                    >
                      {s.weight_kg != null ? `${s.weight_kg}kg` : '—'}
                      <span className="mx-1 opacity-40">×</span>
                      {s.reps != null ? s.reps : '—'}
                      {s.rir != null ? (
                        <span className="ml-1 text-muted-foreground">@{s.rir}</span>
                      ) : null}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </section>
        </>
      )}
    </div>
  )
}
