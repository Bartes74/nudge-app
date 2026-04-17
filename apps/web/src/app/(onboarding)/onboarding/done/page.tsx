import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

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

  const goalLabel = profile.primary_goal
    ? goalLabels[profile.primary_goal] ?? profile.primary_goal
    : null

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 text-center gap-8">
      {/* Illustration placeholder */}
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-5xl">
        🎯
      </div>

      <div className="space-y-3 max-w-sm">
        <h1 className="text-2xl font-bold">Twój profil jest gotowy!</h1>
        <p className="text-muted-foreground leading-relaxed">
          {goalLabel && (
            <>Cel: <span className="font-medium text-foreground">{goalLabel}</span>. </>
          )}
          Mamy co trzeba, żeby zbudować Twój pierwszy plan. Czas zadziałać.
        </p>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2 justify-center max-w-xs">
        {profile.primary_goal && (
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary font-medium">
            {goalLabel}
          </span>
        )}
        {profile.experience_level && (
          <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
            {profile.experience_level === 'beginner_zero' ? 'Spokojny start' :
             profile.experience_level === 'beginner' ? 'Początkujący' :
             profile.experience_level === 'intermediate' ? 'Średniozaawansowany' : 'Zaawansowany'}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button asChild size="lg" className="w-full">
          <Link href="/app">Przejdź do aplikacji →</Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href="/app/profile">Sprawdź swój profil</Link>
        </Button>
      </div>
    </div>
  )
}
