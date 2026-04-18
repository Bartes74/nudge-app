import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function CoachPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/signin')

  // Find or create default conversation
  const { data: existing } = await supabase
    .from('coach_conversations')
    .select('id')
    .eq('user_id', user.id)
    .eq('closed', false)
    .eq('entry_point', 'global_bubble')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) {
    redirect(`/app/coach/${existing.id}`)
  }

  const { data: created } = await supabase
    .from('coach_conversations')
    .insert({ user_id: user.id, entry_point: 'global_bubble' })
    .select('id')
    .single()

  if (created) {
    redirect(`/app/coach/${created.id}`)
  }

  redirect('/app')
}
