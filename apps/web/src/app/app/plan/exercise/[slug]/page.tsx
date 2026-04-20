import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChevronRight, Dumbbell, RefreshCw, History } from 'lucide-react'
import { PageBackLink, PageHero, PageSection } from '@/components/layout/PageHero'
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
    <div className="flex flex-col gap-12">
      <PageBackLink href="/app/plan" label="Plan" />

      <PageHero
        eyebrow="Ćwiczenie"
        titleMain={exercise.name_pl}
        lede={exercise.name_en ? <span className="font-[var(--font-editorial)] italic">{exercise.name_en}</span> : undefined}
        meta={[
          ...(exercise.category
            ? [{
                label: 'Kategoria',
                value: CATEGORY_LABELS[exercise.category as string] ?? exercise.category,
              }]
            : []),
          ...(exercise.difficulty
            ? [{
                label: 'Poziom',
                value: DIFFICULTY_LABELS[exercise.difficulty as string] ?? exercise.difficulty,
              }]
            : []),
          ...(exercise.is_compound ? [{ label: 'Typ', value: 'Wielostawowe' }] : []),
        ]}
      />

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
        <PageSection
          number="01 — Mięśnie"
          title="Za co odpowiada to ćwiczenie"
          description="Najważniejsze partie, które pracują w tym ruchu."
        >
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
        </PageSection>
      )}

      {exercise.technique_notes && (
        <PageSection
          number="02 — Technika"
          title="Najważniejsza wskazówka"
          description="Krótki opis, na czym najbardziej warto się skupić."
        >
          <Card variant="default" padding="md">
            <CardEyebrow>Technika</CardEyebrow>
            <p className="mt-3 text-body-m leading-relaxed text-foreground">
              {exercise.technique_notes}
            </p>
          </Card>
        </PageSection>
      )}

      {exercise.common_mistakes && (
        <PageSection
          number="03 — Uważaj"
          title="Najczęstsze błędy"
          description="Te pomyłki najczęściej psują technikę albo odbierają kontrolę nad ruchem."
        >
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
        </PageSection>
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
        <PageSection
          number="04 — Zamienniki"
          title="Podobne ćwiczenia"
          description="Jeśli chcesz zmienić ruch, zacznij od tych wariantów."
          className="gap-4"
        >
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
        </PageSection>
      )}

      <SubstituteButton exerciseSlug={slug} exerciseName={exercise.name_pl} />
    </div>
  )
}
