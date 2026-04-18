import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, getUser } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
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
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-5 pt-6 pb-24 animate-stagger">
      <header className="flex flex-col gap-2">
        <p className="text-label uppercase text-muted-foreground">Ty</p>
        <h1 className="text-display-l font-display leading-[1.05] tracking-tight text-balance">
          <span className="font-display italic text-muted-foreground">Twój</span>
          <br />
          <span className="font-sans font-semibold">profil.</span>
        </h1>
      </header>

      {profileResult.data?.onboarding_layer_1_done ? (
        <ProfileData profile={profileResult.data} />
      ) : (
        <Card variant="outline" padding="md">
          <p className="text-body-m text-muted-foreground">
            Nie ukończyłeś/aś jeszcze onboardingu.{' '}
            <Link href="/onboarding" className="font-semibold text-brand underline-offset-4 hover:underline">
              Skonfiguruj profil →
            </Link>
          </p>
        </Card>
      )}

      <ProfileSettings
        user={user}
        timezone={usersResult.data?.timezone ?? 'Europe/Warsaw'}
        locale={usersResult.data?.locale ?? 'pl-PL'}
      />
    </div>
  )
}
