import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient, getUser } from '@/lib/supabase/server'
import { ProfileSettings } from './ProfileSettings'
import { ProfileData } from './ProfileData'

export const metadata: Metadata = { title: 'Profil — Nudge' }

export default async function ProfilePage() {
  const user = await getUser()
  if (!user) redirect('/signin')

  const supabase = await createClient()

  const [usersResult, profileResult] = await Promise.all([
    supabase.from('users').select('timezone, locale').eq('id', user.id).single(),
    supabase
      .from('user_profile')
      .select(
        'display_name, birth_date, gender, height_cm, current_weight_kg, experience_level, primary_goal, nutrition_mode, dietary_constraints, life_context, onboarding_layer_1_done',
      )
      .eq('user_id', user.id)
      .single(),
  ])

  return (
    <div className="flex flex-col gap-6 p-4 pb-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold">Profil</h1>

      {profileResult.data?.onboarding_layer_1_done ? (
        <ProfileData profile={profileResult.data} />
      ) : (
        <div className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
          Nie ukończyłeś/aś jeszcze onboardingu.{' '}
          <a href="/onboarding" className="text-primary underline">
            Skonfiguruj profil →
          </a>
        </div>
      )}

      <ProfileSettings
        user={user}
        timezone={usersResult.data?.timezone ?? 'Europe/Warsaw'}
        locale={usersResult.data?.locale ?? 'pl-PL'}
      />
    </div>
  )
}
