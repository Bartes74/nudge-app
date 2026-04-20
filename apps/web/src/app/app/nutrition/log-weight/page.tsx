import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PageBackLink, PageHero, PageSection } from '@/components/layout/PageHero'
import { Card, CardEyebrow } from '@/components/ui/card'
import { LogWeightForm } from './LogWeightForm'

export const metadata: Metadata = { title: 'Zapisz wagę' }

export default async function LogWeightPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [lastMeasurementResult, profileResult] = await Promise.all([
    supabase
      .from('body_measurements')
      .select('weight_kg, measured_at')
      .eq('user_id', user!.id)
      .not('weight_kg', 'is', null)
      .order('measured_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('user_profile')
      .select('current_weight_kg, updated_at, onboarding_completed_at')
      .eq('user_id', user!.id)
      .maybeSingle(),
  ])

  const lastMeasurement = lastMeasurementResult.data
  const profileWeight = profileResult.data?.current_weight_kg
  const profileDate =
    profileResult.data?.updated_at ?? profileResult.data?.onboarding_completed_at ?? null
  const fallbackWeight =
    lastMeasurement ?
      {
        weight_kg: lastMeasurement.weight_kg,
        measured_at: lastMeasurement.measured_at,
        label: 'Poprzedni pomiar',
      }
    : profileWeight != null ?
      {
        weight_kg: profileWeight,
        measured_at: profileDate,
        label: 'Aktualna waga z profilu',
      }
    : null

  return (
    <div className="flex flex-col gap-12">
      <PageBackLink href="/app/nutrition" label="Wróć" />

      <PageHero
        eyebrow="Pomiar"
        titleEmphasis="Zapisz"
        titleMain="wagę."
        lede="Nowy pomiar od razu aktualizuje trend i pomaga lepiej ocenić postępy w czasie."
      />

      {fallbackWeight && (
        <PageSection
          number="01 — Ostatni wpis"
          title="Poprzednia wartość"
          description="To ostatni zapisany pomiar albo bieżąca wartość z profilu."
        >
          <Card variant="recessed" padding="sm">
            <CardEyebrow>{fallbackWeight.label}</CardEyebrow>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-display-m tabular-nums tracking-tight text-foreground">
                {Number(fallbackWeight.weight_kg).toFixed(1)}
              </span>
              <span className="text-body-s text-muted-foreground">kg</span>
              {fallbackWeight.measured_at && (
                <span className="ml-auto font-mono text-body-s tabular-nums text-muted-foreground">
                  {new Date(fallbackWeight.measured_at as string).toLocaleDateString('pl-PL', {
                    day: 'numeric',
                    month: 'long',
                  })}
                </span>
              )}
            </div>
          </Card>
        </PageSection>
      )}

      <PageSection
        number={fallbackWeight ? '02 — Nowy pomiar' : '01 — Nowy pomiar'}
        title="Zapisz nową wagę"
        description="Dodaj wartość i datę pomiaru, a aplikacja uwzględni ją w trendzie."
      >
        <LogWeightForm />
      </PageSection>
    </div>
  )
}
