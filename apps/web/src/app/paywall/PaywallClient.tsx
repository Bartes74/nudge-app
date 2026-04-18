'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, Zap, Shield, TrendingUp, ArrowRight, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardEyebrow } from '@/components/ui/card'

const FEATURES = [
  'Spersonalizowany plan treningowy i żywieniowy',
  'Analiza zdjęć posiłków (AI Vision)',
  'Tygodniowe check-iny z adaptacją planu',
  'Coach AI — pytaj o wszystko, 24/7',
  'Historia treningów i postępów',
]

interface PaywallClientProps {
  billingEnabled: boolean
  apiUrl: string | null
  monthlyPriceId: string | null
  yearlyPriceId: string | null
}

export function PaywallClient({
  billingEnabled,
  apiUrl,
  monthlyPriceId,
  yearlyPriceId,
}: PaywallClientProps) {
  const [loading, setLoading] = useState<'monthly' | 'yearly' | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleCheckout(plan: 'monthly' | 'yearly') {
    if (!billingEnabled || !apiUrl || !monthlyPriceId || !yearlyPriceId) {
      toast.error('Płatności nie są jeszcze skonfigurowane na tym środowisku.')
      return
    }

    setLoading(plan)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/signin?redirectTo=/paywall')
        return
      }

      const priceId = plan === 'monthly' ? monthlyPriceId : yearlyPriceId

      const res = await fetch(`${apiUrl}/stripe/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          userId: user.id,
          userEmail: user.email,
          successUrl: `${window.location.origin}/app/billing?success=1`,
          cancelUrl: `${window.location.origin}/paywall`,
        }),
      })

      if (!res.ok) {
        throw new Error('Nie udało się rozpocząć płatności. Spróbuj ponownie.')
      }

      const { url } = (await res.json()) as { url: string }
      window.location.href = url
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Nieznany błąd')
      setLoading(null)
    }
  }

  return (
    <div className="min-h-svh bg-background px-5 py-12">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-8 animate-stagger">
        <header className="flex flex-col gap-2 text-center">
          <p className="text-label uppercase text-muted-foreground">Subskrypcja</p>
          <h1 className="text-display-l font-display leading-[1.05] tracking-tight text-balance">
            <span className="font-display italic text-muted-foreground">Kontynuuj</span>
            <br />
            <span className="font-sans font-semibold">z Nudge.</span>
          </h1>
          <p className="text-body-m leading-relaxed text-muted-foreground">
            Twoje dane i postępy są zachowane. Wybierz plan i wróć do coachingu.
          </p>
        </header>

        <Card variant="recessed" padding="md">
          <CardEyebrow>Co dostajesz</CardEyebrow>
          <ul className="mt-3 flex flex-col gap-2.5">
            {FEATURES.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2.5 text-body-m leading-relaxed text-foreground"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </Card>

        {!billingEnabled && (
          <Card
            variant="default"
            padding="md"
            className="ring-1 ring-inset ring-warning/20 border-dashed"
          >
            <p className="text-body-s leading-relaxed text-muted-foreground">
              Płatności nie są jeszcze skonfigurowane na tym środowisku. Możesz testować
              logowanie, onboarding i aplikację, a checkout uruchomi się po dodaniu
              konfiguracji Stripe.
            </p>
          </Card>
        )}

        <div className="flex flex-col gap-4">
          <Card
            variant="default"
            padding="lg"
            className="relative ring-1 ring-inset ring-brand/30"
          >
            <div className="absolute -top-3 left-5">
              <Badge variant="brand">Najlepsza cena</Badge>
            </div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <CardEyebrow>Plan roczny</CardEyebrow>
                <p className="mt-1 flex items-baseline gap-1.5 font-mono tabular-nums">
                  <span className="text-data-l font-semibold text-foreground">349</span>
                  <span className="text-label uppercase text-muted-foreground">PLN / rok</span>
                </p>
                <p className="text-body-s text-muted-foreground">
                  ~29 PLN/miesiąc — oszczędzasz 41%
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-muted text-brand">
                <TrendingUp className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
            <Button
              size="hero"
              className="mt-5 w-full gap-2"
              onClick={() => handleCheckout('yearly')}
              disabled={loading !== null || !billingEnabled}
            >
              {loading === 'yearly' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Przekierowuję…
                </>
              ) : (
                <>
                  Wybieram plan roczny
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </Card>

          <Card variant="default" padding="lg">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <CardEyebrow>Plan miesięczny</CardEyebrow>
                <p className="mt-1 flex items-baseline gap-1.5 font-mono tabular-nums">
                  <span className="text-data-l font-semibold text-foreground">49</span>
                  <span className="text-label uppercase text-muted-foreground">PLN / miesiąc</span>
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-muted-foreground">
                <Zap className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
            <Button
              variant="outline"
              size="lg"
              className="mt-5 w-full"
              onClick={() => handleCheckout('monthly')}
              disabled={loading !== null || !billingEnabled}
            >
              {loading === 'monthly' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Przekierowuję…
                </>
              ) : (
                'Wybieram plan miesięczny'
              )}
            </Button>
          </Card>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-label uppercase text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Shield className="h-3 w-3" />
            Płatność Stripe
          </span>
          <span aria-hidden="true">·</span>
          <span>Anuluj kiedy chcesz</span>
          <span aria-hidden="true">·</span>
          <span>Dane zachowane</span>
        </div>
      </div>
    </div>
  )
}
