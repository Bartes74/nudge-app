import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChevronLeft, Dumbbell, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { SubstituteButton } from './SubstituteButton'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  return { title: slug.replace(/_/g, ' ') }
}

const CATEGORY_LABELS: Record<string, string> = {
  push: 'Pchanie',
  pull: 'Ciąganie',
  legs: 'Nogi',
  core: 'Core',
  cardio: 'Cardio',
  mobility: 'Mobilność',
  full_body: 'Full body',
}

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: 'Początkujący',
  intermediate: 'Średniozaawansowany',
  advanced: 'Zaawansowany',
}

export default async function ExercisePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: exercise } = await supabase
    .from('exercises')
    .select('*')
    .eq('slug', slug)
    .eq('deprecated', false)
    .single()

  if (!exercise) notFound()

  // Load alternatives
  const altSlugs = (exercise.alternatives_slugs as string[]) ?? []
  const { data: alternatives } = altSlugs.length > 0
    ? await supabase
        .from('exercises')
        .select('id, slug, name_pl, category, equipment_required, difficulty')
        .in('slug', altSlugs)
        .eq('deprecated', false)
    : { data: [] }

  return (
    <div className="flex flex-col gap-5 p-4 pb-8">
      <div className="flex items-center gap-2">
        <button onClick={() => history.back()} className="flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
          Wstecz
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold">{exercise.name_pl}</h1>
        {exercise.name_en && (
          <p className="text-sm text-muted-foreground">{exercise.name_en}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          {exercise.category && (
            <Badge variant="secondary">{CATEGORY_LABELS[exercise.category as string] ?? exercise.category}</Badge>
          )}
          {exercise.difficulty && (
            <Badge variant="outline">{DIFFICULTY_LABELS[exercise.difficulty as string] ?? exercise.difficulty}</Badge>
          )}
          {exercise.is_compound && <Badge>Wielostawowe</Badge>}
        </div>
      </div>

      {/* Muscles */}
      {((exercise.primary_muscles as string[])?.length > 0 || (exercise.secondary_muscles as string[])?.length > 0) && (
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mięśnie</p>
          {(exercise.primary_muscles as string[])?.length > 0 && (
            <p className="mt-2 text-sm">
              <span className="font-medium">Główne: </span>
              {(exercise.primary_muscles as string[]).join(', ')}
            </p>
          )}
          {(exercise.secondary_muscles as string[])?.length > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-medium">Pomocnicze: </span>
              {(exercise.secondary_muscles as string[]).join(', ')}
            </p>
          )}
        </div>
      )}

      {/* Technique */}
      {exercise.technique_notes && (
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Technika</p>
          <p className="mt-2 text-sm leading-relaxed">{exercise.technique_notes}</p>
        </div>
      )}

      {/* Common mistakes accordion */}
      {exercise.common_mistakes && (
        <Accordion type="single" collapsible>
          <AccordionItem value="mistakes" className="rounded-xl border bg-card px-4">
            <AccordionTrigger className="text-sm font-medium">Częste błędy</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              {exercise.common_mistakes}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Equipment */}
      {(exercise.equipment_required as string[])?.length > 0 && (
        <div className="flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {(exercise.equipment_required as string[]).join(', ')}
          </p>
        </div>
      )}

      {/* Alternatives */}
      {alternatives && alternatives.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-semibold">Zamienniki</p>
          </div>
          <div className="flex flex-col gap-2">
            {alternatives.map((alt) => (
              <Link
                key={alt.id}
                href={`/app/plan/exercise/${alt.slug}`}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{alt.name_pl}</p>
                  <p className="text-xs text-muted-foreground">
                    {DIFFICULTY_LABELS[alt.difficulty as string] ?? alt.difficulty}
                    {(alt.equipment_required as string[])?.length > 0 &&
                      ` · ${(alt.equipment_required as string[]).join(', ')}`}
                  </p>
                </div>
                <ChevronLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      )}

      <SubstituteButton exerciseSlug={slug} exerciseName={exercise.name_pl} />
    </div>
  )
}
