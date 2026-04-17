'use client'

import type { ReactNode } from 'react'
import { useFormState } from 'react-dom'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Users, TrendingUp, DollarSign, Zap, AlertTriangle } from 'lucide-react'
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
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Zarządzanie metrykami i użytkownikami testowymi.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/app">
            <Button variant="outline" size="sm">
              Otwórz aplikację
            </Button>
          </Link>
          <Badge variant="outline">Internal</Badge>
        </div>
      </div>

      <CreateUserForm />

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Aktywni"
          value={active}
          sub="active"
        />
        <StatCard
          icon={<Zap className="h-4 w-4 text-yellow-500" />}
          label="Trial"
          value={trial}
          sub="aktywnych triali"
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4 text-blue-500" />}
          label="MRR"
          value={`${mrrPln.toFixed(0)} PLN`}
          sub="szacunkowy"
        />
        <StatCard
          icon={<DollarSign className={`h-4 w-4 ${costAlert ? 'text-destructive' : 'text-green-600'}`} />}
          label="Koszt/user"
          value={`$${costPerUser.toFixed(2)}`}
          sub="bieżący miesiąc"
          alert={costAlert}
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard icon={<Users className="h-4 w-4" />} label="Paused" value={paused} sub="" />
        <StatCard icon={<Users className="h-4 w-4 text-destructive" />} label="Churned" value={cancelled} sub="" />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Churn rate" value={`${churnRate}%`} sub="lifetime" />
      </div>

      {/* Cost alert */}
      {costAlert && (
        <div className="flex items-start gap-3 rounded-lg bg-destructive/10 border border-destructive/30 p-4 text-sm">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-destructive">
              Koszt powyżej progu ${COST_ALERT_USD}/user
            </p>
            <p className="text-muted-foreground mt-1">
              Sprawdź top consumers poniżej. Rozważ: kompresję zdjęć, cache promptów, przegląd rate limitów.
            </p>
          </div>
        </div>
      )}

      {/* Top AI consumers */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Top consumers (bieżący miesiąc)</h2>
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">User ID</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground">Koszt (USD)</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground">LLM calls</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground">Zdjęcia</th>
              </tr>
            </thead>
            <tbody>
              {topUsers.map((u, i) => (
                <tr key={u.user_id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                  <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                    {u.user_id.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-2 text-right font-medium">
                    ${Number(u.cost_usd_total).toFixed(3)}
                  </td>
                  <td className="px-4 py-2 text-right">{u.llm_calls_count}</td>
                  <td className="px-4 py-2 text-right">{u.photo_analysis_count}</td>
                </tr>
              ))}
              {topUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                    Brak danych za bieżący miesiąc
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Użytkownicy</h2>
            <p className="text-sm text-muted-foreground">
              Konta utworzone w Supabase. Nowe konta z tego panelu są od razu potwierdzone i dostają trial.
            </p>
          </div>
          <Badge variant="secondary">{users.length} kont</Badge>
        </div>

        <div className="rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Użytkownik</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Rola</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Onboarding</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Tryb</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Utworzono</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr
                    key={user.id}
                    className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
                  >
                    <td className="px-4 py-3 align-top">
                      <div className="space-y-0.5">
                        <p className="font-medium">{user.email}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {user.id.slice(0, 8)}…
                        </p>
                        {user.deletedAt && (
                          <p className="text-xs text-destructive">Soft deleted</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="space-y-1">
                        <p>{formatSubscriptionStatus(user.subscriptionStatus)}</p>
                        {user.trialEndsAt && (
                          <p className="text-xs text-muted-foreground">
                            Trial do {formatDate(user.trialEndsAt)}
                          </p>
                        )}
                        {!user.emailConfirmedAt && (
                          <p className="text-xs text-amber-600">E-mail niepotwierdzony</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      {user.onboardingDone ? 'Gotowy' : 'Do przejścia'}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="space-y-1">
                        <p>{formatEntryPath(user.entryPath)}</p>
                        {user.adaptationPhase && (
                          <p className="text-xs text-muted-foreground">
                            {formatAdaptationPhase(user.adaptationPhase)}
                          </p>
                        )}
                        {user.experienceLevel && (
                          <p className="text-xs text-muted-foreground">
                            {user.experienceLevel}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="space-y-1">
                        <p>{formatDate(user.createdAt)}</p>
                        {user.lastActiveAt && (
                          <p className="text-xs text-muted-foreground">
                            Ostatnia aktywność: {formatDate(user.lastActiveAt)}
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                      Brak użytkowników do wyświetlenia
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function CreateUserForm() {
  const [state, formAction] =
    useFormState<CreateUserActionState, FormData>(createUserAction, null)

  return (
    <section className="rounded-2xl border bg-card p-5 space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Dodaj użytkownika</h2>
        <p className="text-sm text-muted-foreground">
          Konto zostanie utworzone od razu z potwierdzonym e-mailem. Nowy user dostanie automatycznie trial i będzie mógł od razu się zalogować.
        </p>
      </div>

      <form action={formAction} className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="admin-email">E-mail</Label>
          <Input
            id="admin-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="nowy@dajer.pl"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="admin-password">Hasło</Label>
          <Input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Minimum 8 znaków"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="admin-full-name">Imię i nazwisko</Label>
          <Input
            id="admin-full-name"
            name="fullName"
            type="text"
            placeholder="Opcjonalnie"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="admin-role">Rola</Label>
          <select
            id="admin-role"
            name="role"
            defaultValue="user"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="user">Zwykły użytkownik</option>
            <option value="tester">Tester</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="md:col-span-2 flex items-center justify-between gap-3">
          <div className="space-y-1">
            {state?.error && (
              <p className="text-sm text-destructive" role="alert">
                {state.error}
              </p>
            )}
            {state?.success && (
              <p className="text-sm text-green-700" role="status">
                {state.success}
              </p>
            )}
          </div>

          <Button type="submit">Utwórz użytkownika</Button>
        </div>
      </form>
    </section>
  )
}

function RoleBadge({ role }: { role: AdminUserRow['role'] }) {
  if (role === 'admin') {
    return <Badge>Admin</Badge>
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

function StatCard({
  icon,
  label,
  value,
  sub,
  alert,
}: {
  icon: ReactNode
  label: string
  value: string | number
  sub: string
  alert?: boolean
}) {
  return (
    <div
      className={`rounded-xl border p-4 space-y-1 ${alert ? 'border-destructive/50 bg-destructive/5' : 'bg-card'}`}
    >
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className={`text-2xl font-bold ${alert ? 'text-destructive' : ''}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}
