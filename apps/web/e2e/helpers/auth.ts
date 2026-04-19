import { createHmac } from 'node:crypto'
import { expect, type Page } from '@playwright/test'

const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54341'
const LOCAL_SUPABASE_JWT_SECRET = 'super-secret-jwt-token-with-at-least-32-characters-long'
const LOCAL_SUPABASE_JWT_EXP = 1983812996

function encodeBase64Url(value: string): string {
  return Buffer.from(value).toString('base64url')
}

function createLocalRoleKey(role: 'anon' | 'service_role'): string {
  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = encodeBase64Url(
    JSON.stringify({
      iss: 'supabase-demo',
      role,
      exp: LOCAL_SUPABASE_JWT_EXP,
    }),
  )
  const signature = createHmac('sha256', LOCAL_SUPABASE_JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url')

  return `${header}.${payload}.${signature}`
}

export const localSupabaseUrl =
  process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? LOCAL_SUPABASE_URL

export const localSupabaseAnonKey =
  process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? createLocalRoleKey('anon')

export const localSupabaseServiceRoleKey =
  process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? createLocalRoleKey('service_role')

async function getUserIdByEmail(email: string): Promise<string | null> {
  const listRes = await fetch(
    `${localSupabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
    {
      headers: {
        apikey: localSupabaseServiceRoleKey,
        Authorization: `Bearer ${localSupabaseServiceRoleKey}`,
      },
    },
  )

  if (!listRes.ok) return null

  const data = (await listRes.json()) as { users?: { id: string }[] }
  return data.users?.[0]?.id ?? null
}

export async function signInAs(
  page: Page,
  email: string,
  password: string,
  redirectPattern: string = '**/app**',
): Promise<void> {
  const redirectTo = redirectPattern.replaceAll('**', '') || '/app'
  const loginError = page.locator('form').first().locator('[role="alert"]')

  await page.goto(`/signin?redirectTo=${encodeURIComponent(redirectTo)}`)
  await expect(page.getByRole('heading', { name: /witaj z powrotem/i })).toBeVisible()
  await page.getByLabel(/^E-mail$/).fill(email)
  await page.getByLabel(/^Hasło$/).fill(password)
  await page.getByRole('button', { name: /^Zaloguj się$/ }).click()

  const navigationResult = await Promise.race([
    page.waitForURL(redirectPattern, { timeout: 10_000 }).then(() => 'redirected' as const),
    loginError.waitFor({ state: 'visible', timeout: 10_000 }).then(() => 'error' as const),
  ])

  if (navigationResult === 'error') {
    const errorText = (await loginError.textContent())?.trim() || 'Unknown login error'
    throw new Error(`Failed to sign in as ${email}: ${errorText}`)
  }
}

export async function createConfirmedTestUser(
  email: string,
  password: string,
): Promise<void> {
  const res = await fetch(`${localSupabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: localSupabaseServiceRoleKey,
      Authorization: `Bearer ${localSupabaseServiceRoleKey}`,
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Failed to create test user: ${body}`)
  }
}

export async function completeBasicOnboardingForUser(email: string): Promise<void> {
  const userId = await getUserIdByEmail(email)
  if (!userId) {
    throw new Error(`Failed to find user id for ${email}`)
  }

  const res = await fetch(
    `${localSupabaseUrl}/rest/v1/user_profile`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: localSupabaseServiceRoleKey,
        Authorization: `Bearer ${localSupabaseServiceRoleKey}`,
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({
        user_id: userId,
        primary_goal: 'general_health',
        gender: 'male',
        birth_date: '1992-05-15',
        current_weight_kg: 80,
        height_cm: 178,
        experience_level: 'beginner',
        nutrition_mode: 'ranges',
        onboarding_layer_1_done: true,
        onboarding_layer_2_done: false,
        onboarding_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    },
  )

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Failed to complete onboarding for ${email}: ${body}`)
  }
}

export async function deleteTestUser(email: string): Promise<void> {
  const userId = await getUserIdByEmail(email)
  if (!userId) return

  await fetch(`${localSupabaseUrl}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      apikey: localSupabaseServiceRoleKey,
      Authorization: `Bearer ${localSupabaseServiceRoleKey}`,
    },
  })
}
