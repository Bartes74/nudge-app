import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Target } from 'lucide-react'
import { PageHero, PageSection } from '@/components/layout/PageHero'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

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
    <div className="mx-auto flex min-h-svh w-full max-w-[var(--content-max)] flex-col justify-center gap-12 px-6 py-16">
      <div className="flex h-16 w-16 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--bg-inset)] text-[var(--copper-500)]">
          <Target className="h-7 w-7" aria-hidden="true" />
        </div>

      <PageHero
        eyebrow="Profil gotowy"
        titleEmphasis="Czas"
        titleMain="zadziałać."
        lede={(
          <>
            {goalLabel ? (
              <>
                Cel: <span className="font-medium text-[var(--fg-primary)]">{goalLabel}</span>.{' '}
              </>
            ) : null}
            Mamy już wszystko, żeby przygotować Twój pierwszy plan.
          </>
        )}
      />

      {(goalLabel || experienceLabel) && (
        <PageSection
          number="01 — Profil"
          title="Twoje ustawienia startowe"
          description="Na tych informacjach oprzemy pierwszy plan i sposób prowadzenia w aplikacji."
        >
          <Card variant="default" padding="md" className="flex flex-wrap items-center gap-2">
            {goalLabel && <Badge variant="brand">{goalLabel}</Badge>}
            {experienceLabel && <Badge variant="outline-warm">{experienceLabel}</Badge>}
          </Card>
        </PageSection>
      )}

      <PageSection
        number="02 — Dalej"
        title="Co dalej"
        description="Możesz od razu wejść do aplikacji albo jeszcze raz sprawdzić swój profil."
      >
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
      </PageSection>
    </div>
  )
}
