import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, getUser } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { PageHero } from '@/components/layout/PageHero'
import { ProfileSettings } from './ProfileSettings'
import { ProfileData } from './ProfileData'
import { applyProfileFallbacks } from '@/lib/profile/profileFallbacks'

export const metadata: Metadata = { title: 'Profil — Nudge' }

export default async function ProfilePage() {
  const user = await getUser()
  if (!user) redirect('/signin')

  const supabase = await createClient()

  const [usersResult, profileResult, factsResult] = await Promise.all([
    supabase.from('users').select('timezone, locale').eq('id', user.id).single(),
    supabase
      .from('user_profile')
      .select(
        'display_name, birth_date, gender, height_cm, current_weight_kg, experience_level, primary_goal, nutrition_mode, dietary_constraints, life_context, onboarding_layer_1_done',
      )
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('user_profile_facts')
      .select('field_key, value_text, value_numeric, value_json')
      .eq('user_id', user.id)
      .in('field_key', [
        'display_name',
        'birth_date',
        'gender',
        'height_cm',
        'current_weight_kg',
        'experience_level',
        'primary_goal',
        'nutrition_mode',
        'dietary_constraints',
        'life_context',
      ])
      .order('observed_at', { ascending: false }),
  ])

  const profileWithFallbacks = profileResult.data
    ? applyProfileFallbacks(profileResult.data, factsResult.data ?? [])
    : null
  const locale = usersResult.data?.locale ?? 'pl-PL'

  return (
    <div className="flex flex-col gap-12">
      <PageHero
        eyebrow="Ty"
        titleEmphasis="Twój"
        titleMain="profil."
        lede="Tutaj zarządzasz swoimi danymi, preferencjami i ustawieniami konta."
      />

      {profileWithFallbacks?.onboarding_layer_1_done ? (
        <ProfileData profile={profileWithFallbacks} locale={locale} />
      ) : (
        <Card variant="outline" padding="md">
          <p className="font-editorial text-body-m leading-[var(--leading-relaxed)] text-[var(--fg-secondary)]">
            Nie ukończyłeś/aś jeszcze onboardingu.{' '}
            <Link href="/onboarding" className="font-semibold text-[var(--fg-primary)] underline-offset-4 hover:underline">
              Skonfiguruj profil →
            </Link>
          </p>
        </Card>
      )}

      <ProfileSettings
        user={user}
        timezone={usersResult.data?.timezone ?? 'Europe/Warsaw'}
        locale={locale}
      />
    </div>
  )
}
