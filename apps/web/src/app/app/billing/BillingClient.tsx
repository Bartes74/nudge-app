'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import type { AccessResult } from '@nudge/core/billing'
import {
  ArrowLeft,
  CreditCard,
  PauseCircle,
  XCircle,
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardEyebrow } from '@/components/ui/card'

interface BillingClientProps {
  access: AccessResult
  userId: string
  userEmail: string
  billingEnabled: boolean
  apiUrl: string | null
}

const STATUS_LABELS: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'brand' | 'success' | 'outline-warm' | 'label' }
> = {
  full: { label: 'Aktywna', variant: 'success' },
  trial: { label: 'Trial', variant: 'brand' },
  paused: { label: 'Wstrzymana', variant: 'outline-warm' },
  paywall: { label: 'Nieaktywna', variant: 'destructive' },
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function BillingClient({
  access,
  userId,
  billingEnabled,
  apiUrl,
}: BillingClientProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const sub = access.subscription
  const statusMeta = STATUS_LABELS[access.status] ?? STATUS_LABELS['paywall']!

  async function openPortal() {
    if (!billingEnabled || !apiUrl) {
      toast.error('Portal płatności nie jest jeszcze skonfigurowany na tym środowisku.')
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
      toast.error(err instanceof Error ? err.message : 'Błąd')
      setLoading(false)
    }
  }

  const planLabel =
    sub?.plan === 'yearly'
      ? 'Plan roczny (349 PLN/rok)'
      : sub?.plan === 'monthly'
        ? 'Plan miesięczny (49 PLN/mc)'
        : '—'

  const periodEnd = sub?.current_period_end ? formatDate(sub.current_period_end) : null
  const trialEnd = sub?.trial_ends_at ? formatDate(sub.trial_ends_at) : null

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-5 pt-6 pb-24 animate-stagger">
      <Link
        href="/app/profile"
        className="inline-flex w-fit items-center gap-1.5 text-label uppercase text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Profil
      </Link>

      <header className="flex flex-col gap-2">
        <p className="text-label uppercase text-muted-foreground">Konto</p>
        <h1 className="text-display-l font-display leading-[1.05] tracking-tight text-balance">
          <span className="font-display italic text-muted-foreground">Twoja</span>
          <br />
          <span className="font-sans font-semibold">subskrypcja.</span>
        </h1>
      </header>

      <Card variant="default" padding="md">
        <CardEyebrow>Status</CardEyebrow>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-body-m text-muted-foreground">Aktualny plan</span>
          <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
        </div>

        {sub?.plan && (
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <span className="text-body-m text-muted-foreground">Plan</span>
            <span className="text-body-m font-medium">{planLabel}</span>
          </div>
        )}

        {access.status === 'trial' && trialEnd && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-brand-muted/50 p-3 ring-1 ring-inset ring-brand/20">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
            <p className="text-body-s leading-relaxed text-foreground">
              Trial kończy się <strong className="font-semibold">{trialEnd}</strong> — zostało{' '}
              <strong className="font-semibold">{access.trialDaysLeft ?? 0} dni</strong>.
            </p>
          </div>
        )}

        {access.status === 'paused' && access.pausedUntil && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-surface-2 p-3 ring-1 ring-inset ring-warning/20">
            <PauseCircle
              className="mt-0.5 h-4 w-4 shrink-0 text-warning"
              aria-hidden="true"
            />
            <p className="text-body-s leading-relaxed text-foreground">
              Subskrypcja wstrzymana do{' '}
              <strong className="font-semibold">{formatDate(access.pausedUntil)}</strong>.
            </p>
          </div>
        )}

        {access.status === 'full' && periodEnd && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-surface-2 p-3 ring-1 ring-inset ring-success/20">
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0 text-success"
              aria-hidden="true"
            />
            <p className="text-body-s leading-relaxed text-foreground">
              Następne odnowienie:{' '}
              <strong className="font-semibold">{periodEnd}</strong>.
            </p>
          </div>
        )}
      </Card>

      {!billingEnabled && (
        <Card
          variant="default"
          padding="md"
          className="ring-1 ring-inset ring-warning/20 border-dashed"
        >
          <p className="text-body-s leading-relaxed text-muted-foreground">
            Płatności i portal Stripe nie są jeszcze skonfigurowane na tym środowisku.
            Możesz dalej testować aplikację, a obsługa subskrypcji pojawi się po uzupełnieniu
            envów billingowych.
          </p>
        </Card>
      )}

      <div className="flex flex-col gap-2">
        {(access.status === 'full' || access.status === 'paused') &&
          sub?.provider_customer_id && (
            <>
              <Button
                size="hero"
                variant="outline"
                className="w-full gap-2"
                onClick={openPortal}
                disabled={loading || !billingEnabled}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Przekierowuję…
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Zarządzaj subskrypcją
                  </>
                )}
              </Button>
              <p className="text-center text-label uppercase text-muted-foreground">
                Zmień plan · Zaktualizuj kartę · Pobierz faktury · Wstrzymaj
              </p>
            </>
          )}

        {access.status === 'trial' && (
          <Button
            size="hero"
            className="w-full"
            disabled={!billingEnabled}
            onClick={() => router.push('/paywall')}
          >
            {billingEnabled ? 'Aktywuj plan przed końcem trialu' : 'Płatności wkrótce'}
          </Button>
        )}

        {access.status === 'paywall' && (
          <Button
            size="hero"
            className="w-full"
            disabled={!billingEnabled}
            onClick={() => router.push('/paywall')}
          >
            {billingEnabled ? 'Wybierz plan' : 'Płatności wkrótce'}
          </Button>
        )}
      </div>

      {(access.status === 'paywall' || access.status === 'paused') && (
        <Card variant="recessed" padding="md">
          <div className="flex items-start gap-2.5">
            <XCircle
              className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="text-body-s leading-relaxed text-muted-foreground">
              Twoje dane treningowe i profil są bezpiecznie zachowane. Wróć kiedy chcesz.
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
