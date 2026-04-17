import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'

export const metadata = {
  title: 'Skonfiguruj swój profil — Nudge',
}

export default async function OnboardingPage() {
  const user = await getUser()
  if (!user) redirect('/signin?redirectTo=/onboarding')

  // If they already completed layer 1 send them to the app
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('user_profile')
    .select('onboarding_layer_1_done')
    .eq('user_id', user.id)
    .single()

  if (profile?.onboarding_layer_1_done) {
    redirect('/app')
  }

  return <OnboardingWizard />
}
