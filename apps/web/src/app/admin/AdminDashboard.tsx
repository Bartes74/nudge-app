'use client'

import type { ReactNode } from 'react'
import { useFormState } from 'react-dom'
import Link from 'next/link'
import { Users, TrendingUp, DollarSign, Zap, AlertTriangle, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardEyebrow } from '@/components/ui/card'
import { createUserAction, type CreateUserActionState } from './actions'

export interface AdminUserRow {
  id: string
  email: string
  role: 'admin' | 'tester' | 'user'
  createdAt: string | null
  lastActiveAt: string | null
  emailConfirmedAt: string | null
  onboardingDone: boolean
  experienceLevel: string | null
  entryPath: string | null
  adaptationPhase: string | null
  subscriptionStatus: string | null
  trialEndsAt: string | null
  deletedAt: string | null
}

interface AdminDashboardProps {
  statusCounts: { active: number; trial: number; paused: number; cancelled: number }
  mrrPln: number
  costPerUser: number
  topUsers: Array<{
    user_id: string
    cost_usd_total: number
    llm_calls_count: number
    photo_analysis_count: number
  }>
  users: AdminUserRow[]
}

const COST_ALERT_USD = 3.0

export function AdminDashboard({
  statusCounts,
  mrrPln,
  costPerUser,
  topUsers,
  users,
}: AdminDashboardProps) {
  const { active, trial, paused, cancelled } = statusCounts
  const totalPaying = active + paused
  const churnRate =
    totalPaying + cancelled > 0
      ? ((cancelled / (totalPaying + cancelled)) * 100).toFixed(1)
      : '—'

  const costAlert = costPerUser > COST_ALERT_USD

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-5 pt-8 pb-24 animate-stagger">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-label uppercase text-muted-foreground">Wewnętrzne · Admin</p>
          <h1 className="text-display-l font-display leading-[1.05] tracking-tight">
            <span className="font-display italic text-muted-foreground">Panel</span>{' '}
            <span className="font-sans font-semibold">administratora.</span>
          </h1>
          <p className="text-body-m text-muted-foreground">
            Metryki biznesowe, kosztów AI i użytkownicy testowi.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/app">Otwórz aplikację</Link>
          </Button>
          <Badge variant="outline-warm">Internal</Badge>
        </div>
      </header>

      <CreateUserForm />

      <section className="flex flex-col gap-3">
        <CardEyebrow>KPI</CardEyebrow>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={<Users className="h-4 w-4" />}
            label="Aktywni"
            value={active}
            sub="Active"
            tone="success"
          />
          <StatCard
            icon={<Zap className="h-4 w-4" />}
            label="Trial"
            value={trial}
            sub="Aktywne triale"
            tone="brand"
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="MRR"
            value={`${mrrPln.toFixed(0)}`}
            suffix="PLN"
            sub="Szacunkowy"
            tone="neutral"
          />
          <StatCard
            icon={<DollarSign className="h-4 w-4" />}
            label="Koszt / user"
            value={`$${costPerUser.toFixed(2)}`}
            sub="Bieżący miesiąc"
            tone={costAlert ? 'destructive' : 'success'}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <CardEyebrow>Sub-metryki</CardEyebrow>
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<Users className="h-4 w-4" />}
            label="Paused"
            value={paused}
            sub=""
            tone="neutral"
          />
          <StatCard
            icon={<Users className="h-4 w-4" />}
            label="Churned"
            value={cancelled}
            sub=""
            tone="destructive"
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Churn rate"
            value={`${churnRate}%`}
            sub="Lifetime"
            tone="neutral"
          />
        </div>
      </section>

      {costAlert && (
        <Card variant="default" padding="md" className="ring-1 ring-inset ring-destructive/30">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-body-m font-semibold text-destructive">
                Koszt powyżej progu ${COST_ALERT_USD}/user
              </p>
              <p className="text-body-s leading-relaxed text-muted-foreground">
                Sprawdź top consumers poniżej. Rozważ: kompresję zdjęć, cache promptów, przegląd rate limitów.
              </p>
            </div>
          </div>
        </Card>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <CardEyebrow>Top consumers · bieżący miesiąc</CardEyebrow>
          <span className="font-mono text-label uppercase tabular-nums text-muted-foreground">
            Top {topUsers.length}
          </span>
        </div>
        <Card variant="default" padding="none" className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="px-4 py-3 text-left text-label uppercase text-muted-foreground">
                  User ID
                </th>
                <th className="px-4 py-3 text-right text-label uppercase text-muted-foreground">
                  Koszt (USD)
                </th>
                <th className="px-4 py-3 text-right text-label uppercase text-muted-foreground">
                  LLM calls
                </th>
                <th className="px-4 py-3 text-right text-label uppercase text-muted-foreground">
                  Zdjęcia
                </th>
              </tr>
            </thead>
            <tbody>
              {topUsers.map((u, i) => (
                <tr
                  key={u.user_id}
                  className={`border-b border-border/40 last:border-b-0 ${
                    i % 2 === 0 ? 'bg-surface-1' : 'bg-surface-2/30'
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-body-s text-muted-foreground">
                    {u.user_id.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-body-s font-semibold tabular-nums">
                    ${Number(u.cost_usd_total).toFixed(3)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-body-s tabular-nums">
                    {u.llm_calls_count}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-body-s tabular-nums">
                    {u.photo_analysis_count}
                  </td>
                </tr>
              ))}
              {topUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-body-s text-muted-foreground"
                  >
                    Brak danych za bieżący miesiąc
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardEyebrow>Użytkownicy</CardEyebrow>
            <p className="text-body-s text-muted-foreground">
              Konta utworzone w Supabase. Nowe konta z tego panelu są od razu potwierdzone i dostają trial.
            </p>
          </div>
          <Badge variant="secondary">{users.length} kont</Badge>
        </div>

        <Card variant="default" padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  <th className="px-4 py-3 text-left text-label uppercase text-muted-foreground">
                    Użytkownik
                  </th>
                  <th className="px-4 py-3 text-left text-label uppercase text-muted-foreground">
                    Rola
                  </th>
                  <th className="px-4 py-3 text-left text-label uppercase text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-label uppercase text-muted-foreground">
                    Onboarding
                  </th>
                  <th className="px-4 py-3 text-left text-label uppercase text-muted-foreground">
                    Tryb
                  </th>
                  <th className="px-4 py-3 text-left text-label uppercase text-muted-foreground">
                    Utworzono
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr
                    key={user.id}
                    className={`border-b border-border/40 last:border-b-0 ${
                      index % 2 === 0 ? 'bg-surface-1' : 'bg-surface-2/30'
                    }`}
                  >
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col gap-0.5">
                        <p className="text-body-s font-semibold">{user.email}</p>
                        <p className="font-mono text-label uppercase tabular-nums text-muted-foreground">
                          {user.id.slice(0, 8)}…
                        </p>
                        {user.deletedAt && (
                          <p className="text-label uppercase text-destructive">Soft deleted</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col gap-1">
                        <p className="text-body-s">
                          {formatSubscriptionStatus(user.subscriptionStatus)}
                        </p>
                        {user.trialEndsAt && (
                          <p className="font-mono text-label uppercase tabular-nums text-muted-foreground">
                            Trial do {formatDate(user.trialEndsAt)}
                          </p>
                        )}
                        {!user.emailConfirmedAt && (
                          <p className="text-label uppercase text-warning">
                            E-mail niepotwierdzony
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-body-s">
                      {user.onboardingDone ? 'Gotowy' : 'Do przejścia'}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col gap-1">
                        <p className="text-body-s">{formatEntryPath(user.entryPath)}</p>
                        {user.adaptationPhase && (
                          <p className="text-label uppercase text-muted-foreground">
                            {formatAdaptationPhase(user.adaptationPhase)}
                          </p>
                        )}
                        {user.experienceLevel && (
                          <p className="text-label uppercase text-muted-foreground">
                            {user.experienceLevel}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col gap-1">
                        <p className="font-mono text-body-s tabular-nums">
                          {formatDate(user.createdAt)}
                        </p>
                        {user.lastActiveAt && (
                          <p className="font-mono text-label uppercase tabular-nums text-muted-foreground">
                            Ostatnia {formatDate(user.lastActiveAt)}
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-body-s text-muted-foreground"
                    >
                      Brak użytkowników do wyświetlenia
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  )
}

function CreateUserForm() {
  const [state, formAction] = useFormState<CreateUserActionState, FormData>(
    createUserAction,
    null,
  )

  return (
    <Card variant="default" padding="lg">
      <div className="flex flex-col gap-1">
        <CardEyebrow>Dodaj użytkownika</CardEyebrow>
        <p className="text-body-s leading-relaxed text-muted-foreground">
          Konto zostanie utworzone od razu z potwierdzonym e-mailem. Nowy user dostanie
          automatycznie trial i będzie mógł od razu się zalogować.
        </p>
      </div>

      <form action={formAction} className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="admin-email" className="text-label uppercase text-muted-foreground">
            E-mail
          </Label>
          <Input
            id="admin-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="nowy@dajer.pl"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="admin-password"
            className="text-label uppercase text-muted-foreground"
          >
            Hasło
          </Label>
          <Input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Minimum 8 znaków"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="admin-full-name"
            className="text-label uppercase text-muted-foreground"
          >
            Imię i nazwisko
          </Label>
          <Input
            id="admin-full-name"
            name="fullName"
            type="text"
            placeholder="Opcjonalnie"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="admin-role" className="text-label uppercase text-muted-foreground">
            Rola
          </Label>
          <select
            id="admin-role"
            name="role"
            defaultValue="user"
            className="flex h-11 w-full rounded-xl border border-input bg-surface-1 px-3 py-2 text-body-m ring-offset-background transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="user">Zwykły użytkownik</option>
            <option value="tester">Tester</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="flex items-center justify-between gap-3 md:col-span-2">
          <div className="flex-1">
            {state?.error && (
              <div
                className="flex items-start gap-2 text-body-s text-destructive"
                role="alert"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{state.error}</span>
              </div>
            )}
            {state?.success && (
              <div
                className="flex items-start gap-2 text-body-s text-success"
                role="status"
              >
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{state.success}</span>
              </div>
            )}
          </div>

          <Button type="submit">Utwórz użytkownika</Button>
        </div>
      </form>
    </Card>
  )
}

function RoleBadge({ role }: { role: AdminUserRow['role'] }) {
  if (role === 'admin') {
    return <Badge variant="brand">Admin</Badge>
  }

  if (role === 'tester') {
    return <Badge variant="secondary">Tester</Badge>
  }

  return <Badge variant="outline">User</Badge>
}

function formatSubscriptionStatus(status: string | null): string {
  switch (status) {
    case 'trial':
      return 'Trial'
    case 'active':
      return 'Active'
    case 'paused':
      return 'Paused'
    case 'past_due':
      return 'Grace period'
    case 'cancelled':
      return 'Cancelled'
    case 'expired':
      return 'Expired'
    default:
      return 'Brak'
  }
}

function formatEntryPath(entryPath: string | null): string {
  if (entryPath === 'guided_beginner') return 'Guided beginner'
  if (entryPath === 'standard_training') return 'Standard training'
  return '—'
}

function formatAdaptationPhase(adaptationPhase: string): string {
  switch (adaptationPhase) {
    case 'phase_0_familiarization':
      return 'Faza 0 — oswojenie'
    case 'phase_1_adaptation':
      return 'Faza 1 — adaptacja'
    case 'phase_2_foundations':
      return 'Faza 2 — podstawy'
    default:
      return adaptationPhase
  }
}

function formatDate(value: string | null): string {
  if (!value) return '—'

  return new Date(value).toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function toneStyles(tone: 'success' | 'brand' | 'destructive' | 'neutral'): {
  iconBg: string
  valueText: string
  ring: string
} {
  if (tone === 'success') {
    return {
      iconBg: 'bg-success/10 text-success',
      valueText: 'text-foreground',
      ring: '',
    }
  }
  if (tone === 'brand') {
    return {
      iconBg: 'bg-brand-muted text-brand',
      valueText: 'text-foreground',
      ring: '',
    }
  }
  if (tone === 'destructive') {
    return {
      iconBg: 'bg-destructive/10 text-destructive',
      valueText: 'text-destructive',
      ring: 'ring-1 ring-inset ring-destructive/20',
    }
  }
  return {
    iconBg: 'bg-surface-2 text-muted-foreground',
    valueText: 'text-foreground',
    ring: '',
  }
}

function StatCard({
  icon,
  label,
  value,
  sub,
  suffix,
  tone = 'neutral',
}: {
  icon: ReactNode
  label: string
  value: string | number
  sub: string
  suffix?: string
  tone?: 'success' | 'brand' | 'destructive' | 'neutral'
}) {
  const tones = toneStyles(tone)

  return (
    <Card variant="default" padding="md" className={tones.ring}>
      <div className="flex items-center justify-between">
        <CardEyebrow>{label}</CardEyebrow>
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${tones.iconBg}`}>
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-1.5 font-mono tabular-nums">
        <span className={`text-data-l font-semibold ${tones.valueText}`}>{value}</span>
        {suffix && <span className="text-label uppercase text-muted-foreground">{suffix}</span>}
      </div>
      {sub && <p className="mt-1 text-label uppercase text-muted-foreground">{sub}</p>}
    </Card>
  )
}
