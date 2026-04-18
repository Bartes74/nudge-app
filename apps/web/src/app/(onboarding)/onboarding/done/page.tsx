import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Target } from 'lucide-react'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Profil gotowy — Nudge',
}

export default async function OnboardingDonePage() {
  const user = await getUser()
  if (!user) redirect('/signin')

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('user_profile')
    .select('primary_goal, experience_level, onboarding_layer_1_done')
    .eq('user_id', user.id)
    .single()

  if (!profile?.onboarding_layer_1_done) {
    redirect('/onboarding')
  }

  const goalLabels: Record<string, string> = {
    weight_loss: 'Redukcja',
    muscle_building: 'Masa mięśniowa',
    strength_performance: 'Siła i wydolność',
    general_health: 'Zdrowy styl życia',
  }

  const experienceLabels: Record<string, string> = {
    beginner_zero: 'Spokojny start',
    beginner: 'Początkujący',
    intermediate: 'Średniozaawansowany',
    advanced: 'Zaawansowany',
  }

  const goalLabel = profile.primary_goal
    ? goalLabels[profile.primary_goal] ?? profile.primary_goal
    : null

  const experienceLabel = profile.experience_level
    ? experienceLabels[profile.experience_level] ?? profile.experience_level
    : null

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-5 py-12">
      <div className="flex w-full max-w-md flex-col items-center gap-8 text-center animate-stagger">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-muted text-brand">
          <Target className="h-7 w-7" aria-hidden="true" />
        </div>

        <header className="flex flex-col gap-2">
          <p className="text-label uppercase text-muted-foreground">Profil gotowy</p>
          <h1 className="text-display-l font-display leading-[1.05] tracking-tight text-balance">
            <span className="font-display italic text-muted-foreground">Czas</span>
            <br />
            <span className="font-sans font-semibold">zadziałać.</span>
          </h1>
          <p className="text-body-m leading-relaxed text-muted-foreground">
            {goalLabel && (
              <>
                Cel:{' '}
                <span className="font-medium text-foreground">{goalLabel}</span>.{' '}
              </>
            )}
            Mamy co trzeba, żeby zbudować Twój pierwszy plan.
          </p>
        </header>

        {(goalLabel || experienceLabel) && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {goalLabel && <Badge variant="brand">{goalLabel}</Badge>}
            {experienceLabel && <Badge variant="outline-warm">{experienceLabel}</Badge>}
          </div>
        )}

        <div className="flex w-full flex-col gap-2">
          <Button asChild size="hero" className="w-full gap-2">
            <Link href="/app">
              Przejdź do aplikacji
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/app/profile">Sprawdź swój profil</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
