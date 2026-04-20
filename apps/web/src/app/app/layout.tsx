import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/layout/AppSidebar'
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
    <div className="ds-shell">
      <AppSidebar user={user} role={role} />
      <div className="flex min-w-0 justify-center">
        <main className="ds-main">
          {access.status === 'trial' && access.trialDaysLeft !== undefined && (
            <div className="pb-8">
              <TrialBanner daysLeft={access.trialDaysLeft} />
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}
