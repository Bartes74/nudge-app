'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Star, AlertTriangle, Pencil } from 'lucide-react'
import { PageBackLink, PageHero, PageSection } from '@/components/layout/PageHero'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardEyebrow } from '@/components/ui/card'

interface MealLogItem {
  id: string
  label: string
  portion_estimate: string | null
  grams_estimate: number | null
  kcal_estimate: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  is_user_corrected: boolean
}

interface MealLog {
  id: string
  status: 'pending_analysis' | 'analyzed' | 'failed' | 'manual'
  meal_type: string | null
  note: string | null
  kcal_estimate_min: number | null
  kcal_estimate_max: number | null
  protein_g_min: number | null
  protein_g_max: number | null
  carbs_g_min: number | null
  carbs_g_max: number | null
  fat_g_min: number | null
  fat_g_max: number | null
  confidence_score: number | null
  user_warnings: string[] | null
  meal_log_items: MealLogItem[]
}

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Śniadanie',
  lunch: 'Obiad',
  dinner: 'Kolacja',
  snack: 'Przekąska',
  drink: 'Napój',
  dessert: 'Deser',
}

function ConfidenceStars({ score }: { score: number }) {
  const stars = Math.round(score * 5)
  return (
    <div className="flex items-center gap-0.5" aria-label={`Pewność: ${stars}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < stars ? 'fill-brand text-brand' : 'fill-transparent text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  )
}

function MacroRange({
  label,
  min,
  max,
  unit,
}: {
  label: string
  min: number | null
  max: number | null
  unit: string
}) {
  if (min == null || max == null) return null

  const roundedMin = Math.round(min)
  const roundedMax = Math.round(max)
  const showSingleValue = roundedMin === roundedMax

  return (
    <div className="flex flex-col gap-1 rounded-xl bg-surface-2 px-3 py-3">
      <span className="text-label uppercase text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-display-m tabular-nums tracking-tight text-foreground">
          {showSingleValue ? (
            roundedMin
          ) : (
            <>
              {roundedMin}
              <span className="text-muted-foreground">–</span>
              {roundedMax}
            </>
          )}
        </span>
        <span className="text-body-s text-muted-foreground">{unit}</span>
      </div>
    </div>
  )
}

export default function MealLogResultPage() {
  const { mealLogId } = useParams<{ mealLogId: string }>()
  const [mealLog, setMealLog] = useState<MealLog | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let intervalId: ReturnType<typeof setInterval> | null = null

    async function fetchLog() {
      try {
        const res = await fetch(`/api/meal/${mealLogId}`)
        if (!res.ok) {
          setError('Nie znaleziono wpisu')
          return
        }
        const { mealLog: data } = await res.json() as { mealLog: MealLog }
        if (!cancelled) {
          setMealLog(data)
          if (data.status !== 'pending_analysis' && intervalId) {
            clearInterval(intervalId)
          }
        }
      } catch {
        if (!cancelled) setError('Błąd wczytywania')
      }
    }

    void fetchLog()

    intervalId = setInterval(() => {
      if (mealLog?.status !== 'pending_analysis') {
        if (intervalId) clearInterval(intervalId)
        return
      }
      void fetchLog()
    }, 3000)

    return () => {
      cancelled = true
      if (intervalId) clearInterval(intervalId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mealLogId])

  if (error) {
    return (
      <div className="flex flex-col gap-12">
        <PageBackLink href="/app/nutrition/log" label="Jedzenie" />
        <PageHero
          eyebrow="Posiłek"
          titleMain={error}
          lede="Nie udało się wczytać tego wpisu."
        />
        <Card variant="destructive" padding="md" className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
          <p className="text-body-m text-foreground">Wróć do listy wpisów i spróbuj ponownie.</p>
        </Card>
        <Button asChild variant="outline">
          <Link href="/app/nutrition/log">Wróć do jedzenia</Link>
        </Button>
      </div>
    )
  }

  if (!mealLog || mealLog.status === 'pending_analysis') {
    return (
      <div className="flex flex-col gap-12">
        <PageBackLink href="/app/nutrition/log" label="Jedzenie" />
        <PageHero
          eyebrow="Analiza"
          titleEmphasis="Analizuję"
          titleMain="posiłek."
          lede="Zazwyczaj zajmuje to kilka sekund."
        />
        <Card variant="default" padding="md" className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--copper-500)]" />
          <p className="text-body-m text-[var(--fg-secondary)]">
            Sprawdzam składniki i próbuję oszacować wartości odżywcze.
          </p>
        </Card>
      </div>
    )
  }

  if (mealLog.status === 'failed') {
    return (
      <div className="flex flex-col gap-12">
        <PageBackLink href="/app/nutrition/log" label="Jedzenie" />
        <PageHero
          eyebrow="Analiza"
          titleMain="Nie udało się przeanalizować."
          lede="Możesz dodać ten posiłek ręcznie."
        />
        <Card variant="destructive" padding="md" className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
          <p className="text-body-m text-foreground">
            Spróbuj jeszcze raz ze zdjęciem albo przejdź do ręcznego wpisu.
          </p>
        </Card>
        <Button asChild size="lg">
          <Link href="/app/nutrition/log/manual">Dodaj ręcznie</Link>
        </Button>
      </div>
    )
  }

  const items = mealLog.meal_log_items
  const hasMacroSummary =
    mealLog.kcal_estimate_min != null
    || mealLog.kcal_estimate_max != null
    || mealLog.protein_g_min != null
    || mealLog.protein_g_max != null
    || mealLog.carbs_g_min != null
    || mealLog.carbs_g_max != null
    || mealLog.fat_g_min != null
    || mealLog.fat_g_max != null

  return (
    <div className="flex flex-col gap-12">
      <PageBackLink href="/app/nutrition" label="Jedzenie" />

      <PageHero
        eyebrow="Posiłek"
        titleMain={mealLog.meal_type ? (MEAL_TYPE_LABELS[mealLog.meal_type] ?? mealLog.meal_type) : 'Posiłek'}
        lede={mealLog.status === 'manual' ? 'To jest wpis ręczny.' : 'To jest zapis z analizy zdjęcia lub ręcznej korekty.'}
      />

      <PageSection
        number="01 — Akcje"
        title="Zarządzaj wpisem"
        description="Możesz poprawić składniki i wartości, jeśli chcesz doprecyzować zapis posiłku."
      >
        <Button asChild variant="outline" size="sm" className="gap-1.5 w-full sm:w-auto">
          <Link href={`/app/nutrition/log/${mealLogId}/edit`}>
            <Pencil className="h-3.5 w-3.5" />
            Edytuj posiłek
          </Link>
        </Button>
      </PageSection>

      {mealLog.confidence_score != null && (
        <PageSection
          number="02 — Pewność"
          title="Pewność analizy"
          description="To tylko wskazówka, jak bardzo pewnie aplikacja rozpoznała składniki."
        >
          <Card variant="default" padding="md" className="flex items-center justify-between gap-4">
            <ConfidenceStars score={mealLog.confidence_score} />
            <span className="text-body-s text-[var(--fg-secondary)]">pewność analizy</span>
          </Card>
        </PageSection>
      )}

      {hasMacroSummary && (
        <PageSection
          number="03 — Wartości"
          title={mealLog.status === 'manual' ? 'Wartości wpisu' : 'Szacowane wartości'}
          description={mealLog.status === 'manual' ? 'To są wartości zapisane w ręcznym wpisie.' : 'Zakres pokazuje przybliżone wartości z analizy.'}
        >
          <Card variant="default" padding="md">
            <div className="grid grid-cols-2 gap-2">
              <MacroRange
                label="Kalorie"
                min={mealLog.kcal_estimate_min}
                max={mealLog.kcal_estimate_max}
                unit="kcal"
              />
              <MacroRange
                label="Białko"
                min={mealLog.protein_g_min}
                max={mealLog.protein_g_max}
                unit="g"
              />
              <MacroRange
                label="Węgle"
                min={mealLog.carbs_g_min}
                max={mealLog.carbs_g_max}
                unit="g"
              />
              <MacroRange
                label="Tłuszcze"
                min={mealLog.fat_g_min}
                max={mealLog.fat_g_max}
                unit="g"
              />
            </div>
          </Card>
        </PageSection>
      )}

      {mealLog.user_warnings && mealLog.user_warnings.length > 0 && (
        <PageSection
          number="04 — Uwagi"
          title="Na co zwrócić uwagę"
          description="To sygnały, że warto jeszcze raz spojrzeć na rozpoznanie albo ręcznie doprecyzować wpis."
        >
          <Card variant="destructive" padding="md">
            <CardEyebrow className="text-destructive">Uwagi</CardEyebrow>
            <ul className="mt-3 flex flex-col gap-2">
              {mealLog.user_warnings.map((w, i) => (
                <li key={i} className="flex items-start gap-2.5 text-body-m text-foreground">
                  <AlertTriangle className="mt-1 h-3.5 w-3.5 shrink-0 text-destructive" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </Card>
        </PageSection>
      )}

      {items.length > 0 && (
        <PageSection
          number="05 — Składniki"
          title="Rozpoznane składniki"
          description="Tutaj zobaczysz listę produktów rozpoznanych lub wpisanych przy tym posiłku."
        >
          <Card variant="default" padding="md">
            <div className="flex flex-col divide-y divide-border/60">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-body-m font-medium tracking-tight">{item.label}</span>
                      {item.is_user_corrected && (
                        <Badge variant="label" className="px-0 text-[10px]">
                          edytowano
                        </Badge>
                      )}
                    </div>
                    {item.portion_estimate && (
                      <span className="mt-0.5 font-mono text-body-s tabular-nums text-muted-foreground">
                        {item.portion_estimate}
                      </span>
                    )}
                  </div>
                  {item.kcal_estimate != null && (
                    <span className="shrink-0 font-mono text-body-m tabular-nums text-foreground">
                      ~{item.kcal_estimate}
                      <span className="ml-1 text-body-s text-muted-foreground">kcal</span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </PageSection>
      )}

      {mealLog.note && (
        <PageSection
          number="06 — Notatka"
          title="Dodatkowy kontekst"
          description="To notatka dodana przy zapisywaniu posiłku."
        >
          <Card variant="recessed" padding="md">
            <CardEyebrow>Notatka</CardEyebrow>
            <p className="mt-2 text-body-m leading-relaxed text-foreground">{mealLog.note}</p>
          </Card>
        </PageSection>
      )}

      <Button asChild variant="outline" className="w-full sm:w-auto">
        <Link href="/app/nutrition">Zobacz podsumowanie jedzenia</Link>
      </Button>
    </div>
  )
}
