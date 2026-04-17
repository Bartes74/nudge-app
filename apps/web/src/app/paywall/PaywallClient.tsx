'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Zap, Shield, TrendingUp } from 'lucide-react'

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
      alert('Płatności nie są jeszcze skonfigurowane na tym środowisku.')
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
      const msg = err instanceof Error ? err.message : 'Nieznany błąd'
      alert(msg)
      setLoading(null)
    }
  }

  return (
    <div className="min-h-svh bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Kontynuuj z Nudge</h1>
          <p className="text-muted-foreground">
            Twoje dane i postępy są zachowane. Wybierz plan i wróć do coachingu.
          </p>
        </div>

        {/* Feature list */}
        <ul className="space-y-2">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        {/* Plans */}
        <div className="grid gap-4">
          {!billingEnabled && (
            <div className="rounded-2xl border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
              Płatności nie są jeszcze skonfigurowane na tym środowisku. Możesz
              testować logowanie, onboarding i aplikację, a checkout uruchomi się po
              dodaniu konfiguracji Stripe.
            </div>
          )}

          {/* Yearly — highlighted */}
          <div className="relative rounded-2xl border-2 border-primary bg-primary/5 p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">Plan roczny</span>
                  <Badge variant="default" className="text-xs">Najlepsza cena</Badge>
                </div>
                <p className="text-muted-foreground text-sm mt-0.5">
                  <span className="text-foreground font-bold text-2xl">349 PLN</span>
                  {' '}/rok
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  ~29 PLN/miesiąc — oszczędzasz 41%
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-primary mt-1" />
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={() => handleCheckout('yearly')}
              disabled={loading !== null || !billingEnabled}
            >
              {loading === 'yearly' ? 'Przekierowuję…' : 'Wybieram plan roczny'}
            </Button>
          </div>

          {/* Monthly */}
          <div className="rounded-2xl border bg-card p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-semibold text-lg">Plan miesięczny</span>
                <p className="text-muted-foreground text-sm mt-0.5">
                  <span className="text-foreground font-bold text-2xl">49 PLN</span>
                  {' '}/miesiąc
                </p>
              </div>
              <Zap className="h-6 w-6 text-muted-foreground mt-1" />
            </div>
            <Button
              className="w-full"
              variant="outline"
              size="lg"
              onClick={() => handleCheckout('monthly')}
              disabled={loading !== null || !billingEnabled}
            >
              {loading === 'monthly' ? 'Przekierowuję…' : 'Wybieram plan miesięczny'}
            </Button>
          </div>
        </div>

        {/* Trust signals */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Shield className="h-3.5 w-3.5" />
            Bezpieczna płatność Stripe
          </span>
          <span>•</span>
          <span>Anuluj kiedy chcesz</span>
          <span>•</span>
          <span>Dane zachowane zawsze</span>
        </div>
      </div>
    </div>
  )
}
