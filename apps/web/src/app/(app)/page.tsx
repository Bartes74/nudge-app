import type { Metadata } from 'next'
import { getUser } from '@/lib/supabase/server'
import { CalendarDays } from 'lucide-react'

export const metadata: Metadata = { title: 'Dziś' }

export default async function TodayPage() {
  const user = await getUser()
  const firstName =
    (user?.user_metadata?.['full_name'] as string | undefined)?.split(' ')[0] ??
    'tam'

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold">
          Dzień dobry, {firstName}!
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {new Date().toLocaleDateString('pl-PL', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </p>
      </div>

      {/* Plan placeholder — will be filled in Iteration 4 */}
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/40 p-8 text-center">
        <CalendarDays className="h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm font-medium text-muted-foreground">
          Twój plan treningowy pojawi się tutaj po ukończeniu onboardingu.
        </p>
      </div>
    </div>
  )
}
