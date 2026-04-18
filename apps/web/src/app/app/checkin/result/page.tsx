'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, AlertCircle, TrendingUp, Loader2, ArrowLeft, ArrowRight } from 'lucide-react'
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
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-5 pt-6 pb-24 animate-stagger">
      <Link
        href="/app"
        className="inline-flex w-fit items-center gap-1.5 text-label uppercase text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Dzisiaj
      </Link>

      <header className="flex flex-col gap-2">
        <p className="text-label uppercase text-muted-foreground">Werdykt</p>
        <h1 className="text-display-l font-display leading-[1.05] tracking-tight text-balance">
          <span className="font-display italic text-muted-foreground">Twój</span>
          <br />
          <span className="font-sans font-semibold">tydzień.</span>
        </h1>
        <p className="font-mono text-body-s tabular-nums text-muted-foreground">
          Tydzień od {result.week_of}
        </p>
      </header>

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

      {result.recommended_action && (
        <Card variant="recessed" padding="md">
          <CardEyebrow>Rekomendacja</CardEyebrow>
          <p className="mt-2 text-body-m leading-relaxed text-foreground">
            {result.recommended_action}
          </p>
        </Card>
      )}

      {result.plan_change_needed && result.plan_change_details && (
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
