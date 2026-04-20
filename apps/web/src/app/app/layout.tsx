import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopBar } from '@/components/layout/TopBar'
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
    <>
      <div className="hidden min-[961px]:grid ds-shell">
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

      <div className="flex min-h-svh flex-col bg-[var(--bg-canvas)] min-[961px]:hidden">
        <TopBar user={user} role={role} />
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 pt-6 pb-32">
          {access.status === 'trial' && access.trialDaysLeft !== undefined && (
            <div className="pb-6">
              <TrialBanner daysLeft={access.trialDaysLeft} />
            </div>
          )}
          {children}
        </main>
        <BottomNav />
      </div>
    </>
  )
}
