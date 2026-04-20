'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, AlertCircle, TrendingUp, Loader2, ArrowRight } from 'lucide-react'
import { PageBackLink, PageHero, PageSection } from '@/components/layout/PageHero'
import { Button } from '@/components/ui/button'
import { Card, CardEyebrow } from '@/components/ui/card'

interface CheckinResult {
  id: string
  week_of: string
  verdict: 'on_track' | 'needs_adjustment' | 'plan_change_recommended' | null
  verdict_summary: string | null
  recommended_action: string | null
  plan_change_needed: boolean
  plan_change_details: { area: string; suggestion: string } | null
}

const VERDICT_CONFIG = {
  on_track: {
    icon: CheckCircle,
    label: 'Na dobrej drodze',
    tone: 'success' as const,
  },
  needs_adjustment: {
    icon: AlertCircle,
    label: 'Drobna korekta',
    tone: 'warning' as const,
  },
  plan_change_recommended: {
    icon: TrendingUp,
    label: 'Czas zaktualizować plan',
    tone: 'brand' as const,
  },
}

function toneClasses(tone: 'success' | 'warning' | 'brand'): { ring: string; text: string; iconBg: string } {
  if (tone === 'success') {
    return {
      ring: 'ring-success/20',
      text: 'text-success',
      iconBg: 'bg-success/10 text-success',
    }
  }
  if (tone === 'warning') {
    return {
      ring: 'ring-warning/20',
      text: 'text-warning',
      iconBg: 'bg-warning/10 text-warning',
    }
  }
  return {
    ring: 'ring-brand/20',
    text: 'text-brand',
    iconBg: 'bg-brand-muted text-brand',
  }
}

export default function CheckinResultPage() {
  const router = useRouter()
  const [result, setResult] = useState<CheckinResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/checkin/current')
      .then((r) => r.json())
      .then((data: { session: CheckinResult | null }) => {
        if (!data.session?.verdict) {
          router.replace('/app/checkin')
          return
        }
        setResult(data.session)
      })
      .catch(() => router.replace('/app/checkin'))
      .finally(() => setLoading(false))
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    )
  }

  if (!result?.verdict) return null

  const config = VERDICT_CONFIG[result.verdict]
  const Icon = config.icon
  const tones = toneClasses(config.tone)

  return (
    <div className="flex flex-col gap-12">
      <PageBackLink href="/app" label="Dziś" />

      <PageHero
        eyebrow="Werdykt"
        titleEmphasis="Twój"
        titleMain="tydzień."
        lede="Podsumowanie pokazuje, czy plan działa dobrze, czy warto go teraz skorygować."
        meta={[
          {
            label: 'Tydzień od',
            value: <span className="font-mono tabular-nums">{result.week_of}</span>,
          },
        ]}
      />

      <PageSection
        number="01 — Ocena"
        title="Werdykt tygodnia"
        description="Najkrótsze podsumowanie tego, jak wyglądał ostatni tydzień."
      >
        <Card variant="default" padding="md" className={`ring-1 ring-inset ${tones.ring}`}>
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tones.iconBg}`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-0.5">
            <CardEyebrow>Werdykt</CardEyebrow>
            <p className={`text-display-m font-display italic ${tones.text}`}>{config.label}</p>
          </div>
        </div>
        {result.verdict_summary && (
          <p className="mt-4 text-body-m leading-relaxed text-foreground">{result.verdict_summary}</p>
        )}
        </Card>
      </PageSection>

      {result.recommended_action && (
        <PageSection
          number="02 — Rekomendacja"
          title="Co warto zrobić dalej"
          description="Najbliższy krok na kolejny tydzień."
        >
          <Card variant="recessed" padding="md">
            <CardEyebrow>Rekomendacja</CardEyebrow>
            <p className="mt-2 text-body-m leading-relaxed text-foreground">
              {result.recommended_action}
            </p>
          </Card>
        </PageSection>
      )}

      {result.plan_change_needed && result.plan_change_details && (
        <PageSection
          number="03 — Zmiana planu"
          title="Plan wymaga aktualizacji"
          description="Ta rekomendacja wpłynie na kolejny układ treningu lub regeneracji."
        >
          <Card variant="default" padding="md" className="ring-1 ring-inset ring-brand/20">
            <CardEyebrow className="text-brand">Zmiana planu</CardEyebrow>
            <p className="mt-1 text-label uppercase text-muted-foreground">
              Obszar ·{' '}
              <span className="text-foreground">
                {result.plan_change_details.area === 'training'
                  ? 'Trening'
                  : result.plan_change_details.area === 'nutrition'
                    ? 'Żywienie'
                    : 'Regeneracja'}
              </span>
            </p>
            <p className="mt-3 text-body-m leading-relaxed">{result.plan_change_details.suggestion}</p>
            <Button
              type="button"
              size="hero"
              onClick={() => router.push('/app/plan')}
              className="mt-5 w-full gap-2"
            >
              Zobacz nowy plan
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Card>
        </PageSection>
      )}

      <Button
        variant="outline"
        size="lg"
        className="w-full"
        onClick={() => router.push('/app')}
      >
        Wróć do aplikacji
      </Button>
    </div>
  )
}
