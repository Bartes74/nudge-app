import { redirect } from 'next/navigation'
import { TopBar } from '@/components/layout/TopBar'
import { BottomNav } from '@/components/layout/BottomNav'
import { CoachBubble } from '@/components/layout/CoachBubble'
import { getUser } from '@/lib/supabase/server'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  // Middleware handles the redirect, but this is a defence-in-depth check.
  if (!user) {
    redirect('/signin')
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <TopBar user={user} />

      {/* Main content — padded so it clears the bottom nav */}
      <main className="flex-1 pb-[var(--bottom-nav-height)]">
        {children}
      </main>

      <BottomNav />
      <CoachBubble />
    </div>
  )
}
