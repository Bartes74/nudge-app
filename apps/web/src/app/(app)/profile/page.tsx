import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient, getUser } from '@/lib/supabase/server'
import { ProfileSettings } from './ProfileSettings'

export const metadata: Metadata = { title: 'Profil' }

export default async function ProfilePage() {
  const user = await getUser()
  if (!user) redirect('/signin')

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('users')
    .select('timezone, locale')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-2xl font-semibold">Profil</h1>
      <ProfileSettings
        user={user}
        timezone={profile?.timezone ?? 'Europe/Warsaw'}
        locale={profile?.locale ?? 'pl-PL'}
      />
    </div>
  )
}
