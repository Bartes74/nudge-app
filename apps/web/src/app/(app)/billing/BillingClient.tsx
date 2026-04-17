'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AccessResult } from '@nudge/core/billing'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, PauseCircle, XCircle, CheckCircle2, Clock } from 'lucide-react'

interface BillingClientProps {
  access: AccessResult
  userId: string
  userEmail: string
  billingEnabled: boolean
  apiUrl: string | null
}

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  full: { label: 'Aktywna', variant: 'default' },
  trial: { label: 'Trial', variant: 'secondary' },
  paused: { label: 'Wstrzymana', variant: 'outline' },
  paywall: { label: 'Nieaktywna', variant: 'destructive' },
}

export function BillingClient({
  access,
  userId,
  userEmail,
  billingEnabled,
  apiUrl,
}: BillingClientProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const sub = access.subscription
  const statusMeta = STATUS_LABELS[access.status] ?? STATUS_LABELS['paywall']!

  async function openPortal() {
    if (!billingEnabled || !apiUrl) {
      alert('Portal płatności nie jest jeszcze skonfigurowany na tym środowisku.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${apiUrl}/stripe/portal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          returnUrl: `${window.location.origin}/app/billing`,
        }),
      })
      if (!res.ok) throw new Error('Nie udało się otworzyć portalu.')
      const { url } = (await res.json()) as { url: string }
      window.location.href = url
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Błąd')
      setLoading(false)
    }
  }

  const planLabel =
    sub?.plan === 'yearly'
      ? 'Plan roczny (349 PLN/rok)'
      : sub?.plan === 'monthly'
        ? 'Plan miesięczny (49 PLN/mc)'
        : '—'

  const periodEnd = sub?.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString('pl-PL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  const trialEnd = sub?.trial_ends_at
    ? new Date(sub.trial_ends_at).toLocaleDateString('pl-PL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Subskrypcja</h1>

      {/* Status card */}
      <div className="rounded-2xl border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
        </div>

        {sub?.plan && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Plan</span>
            <span className="text-sm font-medium">{planLabel}</span>
          </div>
        )}

        {access.status === 'trial' && trialEnd && (
          <div className="flex items-center gap-2 rounded-lg bg-secondary p-3 text-sm">
            <Clock className="h-4 w-4 shrink-0 text-primary" />
            <span>
              Trial kończy się <strong>{trialEnd}</strong> — zostało{' '}
              <strong>{access.trialDaysLeft ?? 0} dni</strong>
            </span>
          </div>
        )}

        {access.status === 'paused' && access.pausedUntil && (
          <div className="flex items-center gap-2 rounded-lg bg-secondary p-3 text-sm">
            <PauseCircle className="h-4 w-4 shrink-0" />
            <span>
              Subskrypcja wstrzymana do{' '}
              <strong>
                {new Date(access.pausedUntil).toLocaleDateString('pl-PL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </strong>
            </span>
          </div>
        )}

        {access.status === 'full' && periodEnd && (
          <div className="flex items-center gap-2 rounded-lg bg-secondary p-3 text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
            <span>
              Następne odnowienie: <strong>{periodEnd}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {!billingEnabled && (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground text-center">
            Płatności i portal Stripe nie są jeszcze skonfigurowane na tym środowisku.
            Możesz dalej testować aplikację, a obsługa subskrypcji pojawi się po
            uzupełnieniu envów billingowych.
          </div>
        )}

        {(access.status === 'full' || access.status === 'paused') &&
          sub?.provider_customer_id && (
            <>
              <Button
                className="w-full"
                variant="outline"
                onClick={openPortal}
                disabled={loading || !billingEnabled}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {loading ? 'Przekierowuję…' : 'Zarządzaj subskrypcją'}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Zmień plan, zaktualizuj kartę, pobierz faktury lub wstrzymaj subskrypcję
              </p>
            </>
          )}

        {access.status === 'trial' && (
          <Button
            className="w-full"
            disabled={!billingEnabled}
            onClick={() => router.push('/paywall')}
          >
            {billingEnabled ? 'Aktywuj plan przed końcem trialu' : 'Płatności wkrótce'}
          </Button>
        )}

        {access.status === 'paywall' && (
          <Button
            className="w-full"
            disabled={!billingEnabled}
            onClick={() => router.push('/paywall')}
          >
            {billingEnabled ? 'Wybierz plan' : 'Płatności wkrótce'}
          </Button>
        )}
      </div>

      {/* Data retention notice */}
      {(access.status === 'paywall' || access.status === 'paused') && (
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground text-center">
          <XCircle className="h-4 w-4 mx-auto mb-1.5" />
          Twoje dane treningowe i profil są bezpiecznie zachowane. Wróć kiedy chcesz.
        </div>
      )}
    </div>
  )
}
