import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageBackLink, PageHero, PageSection } from '@/components/layout/PageHero'
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
  const {
    data: { user },
  } = await supabase.auth.getUser()
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
    sets: Array<{
      weight_kg: number | null
      reps: number | null
      rir: number | null
      set_number: number
    }>
  }

  const sessions = ((logExercises as LogExercise[] | null) ?? [])
    .filter((le) => le.workout_log != null)
    .map((le) => ({
      workout_log_id: le.workout_log!.id,
      started_at: le.workout_log!.started_at,
      max_weight_kg:
        le.sets.reduce(
          (max, s) => (s.weight_kg != null && s.weight_kg > max ? s.weight_kg : max),
          0,
        ) || null,
      total_sets: le.sets.length,
      sets: le.sets.sort((a, b) => a.set_number - b.set_number),
    }))
    .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime())

  return (
    <div className="flex flex-col gap-12">
      <PageBackLink href={`/app/plan/exercise/${slug}`} label={exercise.name_pl} />

      <PageHero
        eyebrow="Historia"
        titleEmphasis="Twoje sesje —"
        titleMain={`${exercise.name_pl}.`}
        lede="Wykres i lista poniżej pokazują, jak zmieniały się serie, ciężar i liczba powtórzeń."
      />

      {sessions.length === 0 ? (
        <Card variant="outline" padding="xl" className="text-center">
          <p className="text-body-m text-muted-foreground">
            Brak historii dla tego ćwiczenia.
          </p>
        </Card>
      ) : (
        <>
          <PageSection
            number="01 — Wykres"
            title="Przebieg w czasie"
            description="Najpierw zobaczysz ogólny trend, a niżej dokładne sesje."
          >
            <ExerciseHistoryChart sessions={sessions} />
          </PageSection>

          <PageSection
            number="02 — Sesje"
            title="Szczegóły wykonania"
            description="Każdy wpis pokazuje serię po serii, jak wyglądało to ćwiczenie."
            className="gap-4"
          >
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
                  {session.sets.map((setItem, index) => (
                    <span
                      key={`${session.workout_log_id}-${index}`}
                      className="rounded-[var(--radius-sm)] bg-[var(--bg-inset)] px-2 py-1 font-mono text-body-s tabular-nums text-foreground"
                    >
                      {setItem.weight_kg != null ? `${setItem.weight_kg}kg` : '—'}
                      <span className="mx-1 opacity-40">×</span>
                      {setItem.reps != null ? setItem.reps : '—'}
                      {setItem.rir != null ? (
                        <span className="ml-1 text-muted-foreground">@{setItem.rir}</span>
                      ) : null}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </PageSection>
        </>
      )}
    </div>
  )
}
