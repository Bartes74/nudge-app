import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserRole } from '@/lib/auth/roles'
import { createAdminClient, ensureBootstrapAdminMetadata } from '@/lib/supabase/admin'
import { AdminDashboard } from './AdminDashboard'

export const metadata: Metadata = { title: 'Admin — Nudge' }

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/signin?redirectTo=/admin')

  const role = getUserRole({
    email: user.email,
    app_metadata: user.app_metadata as Record<string, unknown> | undefined,
  })
  if (role !== 'admin') redirect('/app')

  await ensureBootstrapAdminMetadata({
    id: user.id,
    email: user.email,
    app_metadata: user.app_metadata as Record<string, unknown> | undefined,
  })

  const admin = createAdminClient()

  // ── Metrics queries ──────────────────────────────────────────────────────

  const now = new Date()
  const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`

  const [
    { data: statusCounts },
    { data: mrr },
    { data: aiUsage },
    { data: topUsers },
    { data: publicUsers },
    { data: profiles },
    { data: subscriptions },
    { data: authUsersPage },
  ] = await Promise.all([
    // Count by subscription status
    admin.rpc('admin_subscription_counts'),
    // MRR calculation
    admin.rpc('admin_mrr'),
    // AI usage this month for cost per user
    admin
      .from('user_ai_usage')
      .select('user_id, cost_usd_total')
      .eq('month_key', currentMonth),
    // Top AI consumers last 30d
    admin
      .from('user_ai_usage')
      .select('user_id, cost_usd_total, llm_calls_count, photo_analysis_count')
      .eq('month_key', currentMonth)
      .order('cost_usd_total', { ascending: false })
      .limit(10),
    admin
      .from('users')
      .select('id, email, created_at, last_active_at, deleted_at')
      .order('created_at', { ascending: false })
      .limit(100),
    admin
      .from('user_profile')
      .select('user_id, onboarding_layer_1_done, experience_level, entry_path, adaptation_phase')
      .limit(100),
    admin
      .from('subscriptions')
      .select('user_id, status, trial_ends_at')
      .limit(100),
    admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
  ])

  // Active subscribers count (active + trial + paused)
  const active =
    (statusCounts as Array<{ status: string; count: number }> | null)?.find(
      (r) => r.status === 'active',
    )?.count ?? 0
  const trial =
    (statusCounts as Array<{ status: string; count: number }> | null)?.find(
      (r) => r.status === 'trial',
    )?.count ?? 0
  const paused =
    (statusCounts as Array<{ status: string; count: number }> | null)?.find(
      (r) => r.status === 'paused',
    )?.count ?? 0
  const cancelled =
    (statusCounts as Array<{ status: string; count: number }> | null)?.find(
      (r) => r.status === 'cancelled',
    )?.count ?? 0

  const totalActiveForCost = (aiUsage?.length ?? 0) || 1
  const totalCost = aiUsage?.reduce((s, r) => s + Number(r.cost_usd_total), 0) ?? 0
  const costPerUser = totalCost / totalActiveForCost
  const authUsersById = new Map(
    (authUsersPage?.users ?? []).map((authUser) => [authUser.id, authUser]),
  )
  const profilesById = new Map(
    (profiles ?? []).map((profile) => [profile.user_id, profile]),
  )
  const subscriptionsById = new Map(
    (subscriptions ?? []).map((subscription) => [subscription.user_id, subscription]),
  )
  const users =
    publicUsers?.map((publicUser) => {
      const authUser = authUsersById.get(publicUser.id)
      const profile = profilesById.get(publicUser.id)
      const subscription = subscriptionsById.get(publicUser.id)

      return {
        id: publicUser.id,
        email: publicUser.email,
        role: getUserRole({
          email: publicUser.email,
          app_metadata: authUser?.app_metadata as Record<string, unknown> | undefined,
        }),
        createdAt: publicUser.created_at,
        lastActiveAt: publicUser.last_active_at,
        emailConfirmedAt: authUser?.email_confirmed_at ?? null,
        onboardingDone: profile?.onboarding_layer_1_done ?? false,
        experienceLevel: profile?.experience_level ?? null,
        entryPath: profile?.entry_path ?? null,
        adaptationPhase: profile?.adaptation_phase ?? null,
        subscriptionStatus: subscription?.status ?? null,
        trialEndsAt: subscription?.trial_ends_at ?? null,
        deletedAt: publicUser.deleted_at,
      }
    }) ?? []

  return (
    <AdminDashboard
      statusCounts={{ active, trial, paused, cancelled }}
      mrrPln={Number(mrr ?? 0)}
      costPerUser={costPerUser}
      topUsers={topUsers ?? []}
      users={users}
    />
  )
}
