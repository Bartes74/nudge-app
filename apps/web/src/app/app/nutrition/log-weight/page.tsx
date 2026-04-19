import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
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
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-5 pt-6 pb-24 animate-stagger">
      <Link
        href="/app/nutrition"
        className="inline-flex w-fit items-center gap-1.5 text-label uppercase text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Wróć
      </Link>

      <header className="flex flex-col gap-2">
        <p className="text-label uppercase text-muted-foreground">Pomiar</p>
        <h1 className="text-display-l font-display leading-[1.05] tracking-tight text-balance">
          <span className="font-display italic text-muted-foreground">Zapisz</span>
          <br />
          <span className="font-sans font-semibold">wagę.</span>
        </h1>
      </header>

      {fallbackWeight && (
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
      )}

      <LogWeightForm />
    </div>
  )
}
