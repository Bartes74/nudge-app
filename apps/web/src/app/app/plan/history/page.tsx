import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChevronLeft, History } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = { title: 'Historia planu' }

export default async function PlanHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: plans } = await supabase
    .from('training_plans')
    .select('id')
    .eq('user_id', user!.id)

  const planIds = (plans ?? []).map((p) => p.id)

  const versions = planIds.length > 0
    ? await supabase
        .from('training_plan_versions')
        .select('id, plan_id, version_number, change_reason, created_at, week_structure')
        .in('plan_id', planIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  type Version = {
    id: string
    plan_id: string
    version_number: number
    change_reason: string | null
    created_at: string
    week_structure: Record<string, string> | null
  }

  const versionList = (versions.data ?? []) as Version[]

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Link href="/app/plan" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
          Plan
        </Link>
      </div>

      <h1 className="text-2xl font-semibold">Historia planu</h1>

      {versionList.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/40 p-8 text-center">
          <History className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Brak historii zmian planu.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {versionList.map((v, idx) => (
            <div key={v.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={idx === 0 ? 'default' : 'outline'}>
                      v{v.version_number}
                    </Badge>
                    {idx === 0 && (
                      <Badge variant="secondary">Aktualny</Badge>
                    )}
                  </div>
                  <p className="mt-2 text-sm font-medium">
                    {v.change_reason ?? 'Wygenerowano plan.'}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(v.created_at).toLocaleDateString('pl-PL', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>

              {v.week_structure && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {Object.keys(v.week_structure).map((day) => (
                    <span
                      key={day}
                      className="rounded-md bg-muted px-2 py-0.5 text-xs uppercase tracking-wide"
                    >
                      {day}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
