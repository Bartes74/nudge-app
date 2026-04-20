import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, ChevronRight, Dumbbell, RefreshCw, History } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardEyebrow } from '@/components/ui/card'
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

  const altSlugs = (exercise.alternatives_slugs as string[]) ?? []
  const { data: alternatives } = altSlugs.length > 0
    ? await supabase
        .from('exercises')
        .select('id, slug, name_pl, category, equipment_required, difficulty')
        .in('slug', altSlugs)
        .eq('deprecated', false)
    : { data: [] }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-5 pt-6 pb-24 animate-stagger">
      <Link
        href="/app/plan"
        className="inline-flex w-fit items-center gap-1.5 text-label uppercase text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Plan
      </Link>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {exercise.category && (
            <Badge variant="outline-warm">
              {CATEGORY_LABELS[exercise.category as string] ?? exercise.category}
            </Badge>
          )}
          {exercise.difficulty && (
            <Badge variant="outline">
              {DIFFICULTY_LABELS[exercise.difficulty as string] ?? exercise.difficulty}
            </Badge>
          )}
          {exercise.is_compound && <Badge variant="brand">Wielostawowe</Badge>}
        </div>
        <h1 className="text-display-l font-display leading-[1.05] tracking-tight text-balance">
          <span className="font-sans font-semibold">{exercise.name_pl}</span>
        </h1>
        {exercise.name_en && (
          <p className="font-display text-body-l italic text-muted-foreground">
            {exercise.name_en}
          </p>
        )}
      </header>

      <Link
        href={`/app/plan/exercise/${slug}/history`}
        className="group"
      >
        <Card
          variant="default"
          padding="sm"
          className="flex items-center justify-between gap-4 transition-[border-color,background-color] hover:border-foreground/30 hover:bg-surface-2/60"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2">
              <History className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </div>
            <div>
              <p className="text-body-m font-semibold tracking-tight">Historia</p>
              <p className="text-body-s text-muted-foreground">Twoje poprzednie sesje</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 ease-premium group-hover:translate-x-0.5" />
        </Card>
      </Link>

      {((exercise.primary_muscles as string[])?.length > 0 || (exercise.secondary_muscles as string[])?.length > 0) && (
        <Card variant="recessed" padding="md">
          <CardEyebrow>Mięśnie</CardEyebrow>
          <div className="mt-3 flex flex-col gap-2">
            {(exercise.primary_muscles as string[])?.length > 0 && (
              <div className="flex items-start gap-3">
                <span className="min-w-[80px] pt-0.5 text-label uppercase text-muted-foreground">
                  Główne
                </span>
                <p className="flex-1 text-body-m text-foreground">
                  {(exercise.primary_muscles as string[]).join(', ')}
                </p>
              </div>
            )}
            {(exercise.secondary_muscles as string[])?.length > 0 && (
              <div className="flex items-start gap-3 border-t border-border/60 pt-2">
                <span className="min-w-[80px] pt-0.5 text-label uppercase text-muted-foreground">
                  Pomocnicze
                </span>
                <p className="flex-1 text-body-m text-muted-foreground">
                  {(exercise.secondary_muscles as string[]).join(', ')}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {exercise.technique_notes && (
        <Card variant="default" padding="md">
          <CardEyebrow>Technika</CardEyebrow>
          <p className="mt-3 text-body-m leading-relaxed text-foreground">
            {exercise.technique_notes}
          </p>
        </Card>
      )}

      {exercise.common_mistakes && (
        <Accordion type="single" collapsible>
          <AccordionItem value="mistakes" className="rounded-xl border border-border bg-surface-1 px-5">
            <AccordionTrigger className="text-body-m font-semibold tracking-tight">
              Częste błędy
            </AccordionTrigger>
            <AccordionContent className="text-body-m leading-relaxed text-muted-foreground">
              {exercise.common_mistakes}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {(exercise.equipment_required as string[])?.length > 0 && (
        <div className="flex items-center gap-2 text-body-s text-muted-foreground">
          <Dumbbell className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="font-mono">
            {(exercise.equipment_required as string[]).join(' · ')}
          </span>
        </div>
      )}

      {alternatives && alternatives.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            <p className="text-label uppercase text-muted-foreground">Zamienniki</p>
          </div>
          <div className="flex flex-col gap-2">
            {alternatives.map((alt) => (
              <Link
                key={alt.id}
                href={`/app/plan/exercise/${alt.slug}`}
                className="group"
              >
                <Card
                  variant="default"
                  padding="sm"
                  className="flex items-center justify-between gap-4 transition-[border-color,background-color] hover:border-foreground/30 hover:bg-surface-2/60"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body-m font-semibold tracking-tight">
                      {alt.name_pl}
                    </p>
                    <p className="mt-0.5 text-body-s text-muted-foreground">
                      {DIFFICULTY_LABELS[alt.difficulty as string] ?? alt.difficulty}
                      {(alt.equipment_required as string[])?.length > 0 &&
                        ` · ${(alt.equipment_required as string[]).join(', ')}`}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-premium group-hover:translate-x-0.5" />
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <SubstituteButton exerciseSlug={slug} exerciseName={exercise.name_pl} />
    </div>
  )
}
