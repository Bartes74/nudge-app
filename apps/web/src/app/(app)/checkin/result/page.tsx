'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, AlertCircle, TrendingUp } from 'lucide-react'

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
    color: 'text-green-600',
    bg: 'bg-green-50 border-green-200',
    label: 'Na dobrej drodze',
    emoji: '✅',
  },
  needs_adjustment: {
    icon: AlertCircle,
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
    label: 'Drobna korekta',
    emoji: '⚡',
  },
  plan_change_recommended: {
    icon: TrendingUp,
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
    label: 'Czas zaktualizować plan',
    emoji: '🔄',
  },
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
      <div className="flex min-h-[100dvh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Ładowanie...</p>
      </div>
    )
  }

  if (!result?.verdict) return null

  const config = VERDICT_CONFIG[result.verdict]
  const Icon = config.icon

  return (
    <div className="flex min-h-[100dvh] flex-col p-6 pb-24">
      <button
        type="button"
        onClick={() => router.push('/app/today')}
        className="mb-4 self-start text-sm text-muted-foreground"
      >
        ← Wróć do dziś
      </button>

      <h1 className="text-2xl font-bold">Werdykt tygodniowy</h1>
      <p className="mt-1 text-sm text-muted-foreground">Tydzień od {result.week_of}</p>

      {/* Verdict card */}
      <div className={`mt-6 rounded-2xl border p-5 ${config.bg}`}>
        <div className="flex items-center gap-3">
          <Icon className={`h-7 w-7 ${config.color}`} />
          <span className={`text-lg font-bold ${config.color}`}>
            {config.emoji} {config.label}
          </span>
        </div>
        {result.verdict_summary && (
          <p className="mt-3 text-sm leading-relaxed text-foreground">{result.verdict_summary}</p>
        )}
      </div>

      {/* Recommended action */}
      {result.recommended_action && (
        <section className="mt-6">
          <h2 className="mb-2 text-base font-semibold">💡 Rekomendacja</h2>
          <p className="rounded-xl border bg-muted/30 p-4 text-sm leading-relaxed">
            {result.recommended_action}
          </p>
        </section>
      )}

      {/* Plan change */}
      {result.plan_change_needed && result.plan_change_details && (
        <section className="mt-6">
          <h2 className="mb-2 text-base font-semibold">🔄 Zmiana planu</h2>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
              Obszar: {result.plan_change_details.area === 'training' ? 'Trening' : result.plan_change_details.area === 'nutrition' ? 'Żywienie' : 'Regeneracja'}
            </p>
            <p className="mt-2 text-sm leading-relaxed">{result.plan_change_details.suggestion}</p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/app/plan')}
            className="mt-4 w-full rounded-xl bg-blue-600 py-4 text-base font-semibold text-white active:bg-blue-700"
          >
            Zobacz nowy plan →
          </button>
        </section>
      )}

      <div className="mt-auto pt-8">
        <button
          type="button"
          onClick={() => router.push('/app/today')}
          className="w-full rounded-xl border py-4 text-base font-semibold active:bg-muted"
        >
          Wróć do aplikacji
        </button>
      </div>
    </div>
  )
}
