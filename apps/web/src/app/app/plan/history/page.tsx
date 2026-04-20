import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { History } from 'lucide-react'
import { PageBackLink, PageHero, PageSection } from '@/components/layout/PageHero'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Historia planu' }

const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const DAY_SHORT: Record<string, string> = {
  mon: 'Pon',
  tue: 'Wt',
  wed: 'Śr',
  thu: 'Czw',
  fri: 'Pt',
  sat: 'Sb',
  sun: 'Nd',
}

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
    <div className="flex flex-col gap-12">
      <PageBackLink href="/app/plan" label="Plan" />

      <PageHero
        eyebrow="Plan"
        titleEmphasis="Historia —"
        titleMain="ewolucja planu."
        lede="Każda wersja pokazuje, kiedy plan był odświeżany i jaki był powód zmiany."
      />

      {versionList.length === 0 ? (
        <Card variant="outline" padding="xl" className="flex flex-col items-center gap-4 text-center">
          <History className="h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
          <p className="text-body-m text-muted-foreground">
            Brak historii zmian planu.
          </p>
        </Card>
      ) : (
        <PageSection
          number="01 — Wersje"
          title="Kolejne odsłony planu"
          description="Najnowsza wersja jest u góry. Starsze wersje możesz traktować jako historię zmian."
          className="gap-4"
        >
          {versionList.map((v, idx) => {
            const isCurrent = idx === 0
            const daysPresent = v.week_structure
              ? DAY_ORDER.filter((d) => v.week_structure![d])
              : []
            return (
              <Card
                key={v.id}
                variant={isCurrent ? 'default' : 'recessed'}
                padding="md"
                className={isCurrent ? 'border-foreground/30' : undefined}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={isCurrent ? 'brand' : 'outline'} className="font-mono tabular-nums">
                        v{v.version_number}
                      </Badge>
                      {isCurrent && <Badge variant="label">Aktualny</Badge>}
                    </div>
                    <p className="text-body-m font-medium leading-relaxed text-foreground">
                      {v.change_reason ?? 'Wygenerowano plan.'}
                    </p>
                  </div>
                  <p className="shrink-0 font-mono text-body-s tabular-nums text-muted-foreground">
                    {new Date(v.created_at).toLocaleDateString('pl-PL', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                {daysPresent.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {daysPresent.map((day) => (
                      <span
                        key={day}
                        className="rounded-md bg-surface-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground"
                      >
                        {DAY_SHORT[day] ?? day}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            )
          })}
        </PageSection>
      )}
    </div>
  )
}
