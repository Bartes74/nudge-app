import { redirect } from 'next/navigation'
import { TopBar } from '@/components/layout/TopBar'
import { BottomNav } from '@/components/layout/BottomNav'
import { TrialBanner } from '@/components/layout/TrialBanner'
import { createClient } from '@/lib/supabase/server'
import { getServerAccess } from '@/lib/access'
import { getUserRole } from '@/lib/auth/roles'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Middleware handles the redirect, but this is a defence-in-depth check.
  if (!user) {
    redirect('/signin')
  }

  const access = await getServerAccess(
    supabase,
    user.id,
    user.app_metadata as Record<string, unknown> | undefined,
    user.email,
  )
  const role = getUserRole({
    email: user.email,
    app_metadata: user.app_metadata as Record<string, unknown> | undefined,
  })

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {access.status === 'trial' && access.trialDaysLeft !== undefined && (
        <TrialBanner daysLeft={access.trialDaysLeft} />
      )}

      <TopBar user={user} role={role} />

      {/* Main content — padded so it clears the bottom nav */}
      <main className="flex-1 pb-[var(--bottom-nav-height)]">
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
