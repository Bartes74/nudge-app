import { test, expect } from '@playwright/test'

/**
 * Onboarding E2E specs.
 *
 * These tests assume a running local Supabase instance with the migration applied.
 * Each test creates a unique test user, runs onboarding, and verifies the outcome.
 *
 * Run with: pnpm e2e --project=chromium
 */

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

// Helper: register + confirm a test user via Supabase admin API
async function createTestUser(email: string, password: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321'
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
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

async function deleteTestUser(email: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321'
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

  // Find user by email
  const listRes = await fetch(
    `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    },
  )
  if (!listRes.ok) return

  const data = (await listRes.json()) as { users?: { id: string }[] }
  const userId = data.users?.[0]?.id
  if (!userId) return

  await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  })
}

async function signIn(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto(`${BASE}/signin`)
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')
  // Should redirect to /onboarding
  await page.waitForURL(`${BASE}/onboarding`, { timeout: 10_000 })
}

// ---- Persona: Ania (zero × general_health × female) ----

test('Ania completes onboarding: zero × general_health × female', async ({ page }) => {
  const email = `e2e-ania-${Date.now()}@test.nudge`
  const password = 'Test1234!'
  await createTestUser(email, password)

  try {
    await signIn(page, email, password)

    // Step 0: Goal
    await expect(page.getByText('Jaki jest Twój główny cel?')).toBeVisible()
    await page.click('label:has(#goal_general_health)')
    await page.click('button:has-text("Dalej")')

    // Step 1: Birth date (skippable)
    await page.fill('input[type="date"]', '1990-03-15')
    await page.click('button:has-text("Dalej")')

    // Step 2: Gender
    await page.click('label:has(#gender_female)')
    await page.click('button:has-text("Dalej")')

    // Step 3: Height (skip)
    await page.click('button:has-text("Pomiń")')

    // Step 4: Weight (skip)
    await page.click('button:has-text("Pomiń")')

    // Step 5: Days/week (required)
    await page.click('label:has(#days_3)')
    await page.click('button:has-text("Dalej")')

    // Step 6: Location (required)
    await page.click('label:has(#loc_home)')
    await page.click('button:has-text("Dalej")')

    // Step 7: Equipment (skip)
    await page.click('button:has-text("Pomiń")')

    // Step 8: Experience
    await page.click('label:has(#exp_zero)')
    await page.click('button:has-text("Dalej")')

    // Step 9: Health (select "none")
    await page.click('label:has(#hc_none)')
    await page.click('button:has-text("Dalej")')

    // Step 10: Pregnancy + nutrition
    await page.click('label:has(#preg_false)')
    await page.click('label:has(#nm_simple)')
    await page.click('button:has-text("Gotowe")')

    // Should end up on /onboarding/done
    await page.waitForURL(`${BASE}/onboarding/done`, { timeout: 15_000 })
    await expect(page.getByText('Twój profil jest gotowy!')).toBeVisible()
    await expect(page.getByText('Zdrowy styl życia')).toBeVisible()
  } finally {
    await deleteTestUser(email)
  }
})

// ---- Persona: Kuba (beginner × muscle_building × male) ----

test('Kuba completes onboarding: beginner × muscle_building × male', async ({ page }) => {
  const email = `e2e-kuba-${Date.now()}@test.nudge`
  const password = 'Test1234!'
  await createTestUser(email, password)

  try {
    await signIn(page, email, password)

    await page.click('label:has(#goal_muscle_building)')
    await page.click('button:has-text("Dalej")')

    await page.fill('input[type="date"]', '1998-07-20')
    await page.click('button:has-text("Dalej")')

    await page.click('label:has(#gender_male)')
    await page.click('button:has-text("Dalej")')

    await page.fill('input[type="number"]', '178')
    await page.click('button:has-text("Dalej")')

    await page.fill('input[type="number"]', '78')
    await page.click('button:has-text("Dalej")')

    await page.click('label:has(#days_4)')
    await page.click('button:has-text("Dalej")')

    await page.click('label:has(#loc_gym)')
    await page.click('button:has-text("Dalej")')

    await page.click('label:has(#eq_has_barbell)')
    await page.click('label:has(#eq_has_dumbbells)')
    await page.click('label:has(#eq_has_machines)')
    await page.click('button:has-text("Pomiń")')

    await page.click('label:has(#exp_beginner)')
    await page.click('button:has-text("Dalej")')

    await page.click('label:has(#hc_none)')
    await page.click('button:has-text("Dalej")')

    await page.click('label:has(#preg_false)')
    await page.click('label:has(#nm_ranges)')
    await page.click('button:has-text("Gotowe")')

    await page.waitForURL(`${BASE}/onboarding/done`, { timeout: 15_000 })
    await expect(page.getByText('Masa mięśniowa')).toBeVisible()
  } finally {
    await deleteTestUser(email)
  }
})

// ---- Persona: Marta (amateur × weight_loss × female) ----

test('Marta completes onboarding: amateur × weight_loss × female', async ({ page }) => {
  const email = `e2e-marta-${Date.now()}@test.nudge`
  const password = 'Test1234!'
  await createTestUser(email, password)

  try {
    await signIn(page, email, password)

    await page.click('label:has(#goal_weight_loss)')
    await page.click('button:has-text("Dalej")')

    await page.fill('input[type="date"]', '1984-11-08')
    await page.click('button:has-text("Dalej")')

    await page.click('label:has(#gender_female)')
    await page.click('button:has-text("Dalej")')

    await page.fill('input[type="number"]', '165')
    await page.click('button:has-text("Dalej")')

    await page.fill('input[type="number"]', '72')
    await page.click('button:has-text("Dalej")')

    await page.click('label:has(#days_3)')
    await page.click('button:has-text("Dalej")')

    await page.click('label:has(#loc_home)')
    await page.click('button:has-text("Dalej")')

    await page.click('label:has(#eq_has_dumbbells)')
    await page.click('button:has-text("Pomiń")')

    await page.click('label:has(#exp_amateur)')
    await page.click('button:has-text("Dalej")')

    await page.click('label:has(#hc_none)')
    await page.click('button:has-text("Dalej")')

    await page.click('label:has(#preg_false)')
    await page.click('label:has(#nm_simple)')
    await page.click('button:has-text("Gotowe")')

    await page.waitForURL(`${BASE}/onboarding/done`, { timeout: 15_000 })
    await expect(page.getByText('Redukcja')).toBeVisible()
  } finally {
    await deleteTestUser(email)
  }
})

// ---- Skip flow ----

test('User can skip optional fields and still complete onboarding', async ({ page }) => {
  const email = `e2e-skip-${Date.now()}@test.nudge`
  const password = 'Test1234!'
  await createTestUser(email, password)

  try {
    await signIn(page, email, password)

    // Only answer required fields (goal, days, location)
    await page.click('label:has(#goal_general_health)')
    await page.click('button:has-text("Dalej")')

    // Skip birth date
    await page.click('button:has-text("Pomiń")')
    // Skip gender
    await page.click('button:has-text("Pomiń")')
    // Skip height
    await page.click('button:has-text("Pomiń")')
    // Skip weight
    await page.click('button:has-text("Pomiń")')

    // Required: days/week
    await page.click('label:has(#days_2)')
    await page.click('button:has-text("Dalej")')

    // Required: location
    await page.click('label:has(#loc_home)')
    await page.click('button:has-text("Dalej")')

    // Skip equipment
    await page.click('button:has-text("Pomiń")')
    // Skip experience
    await page.click('button:has-text("Pomiń")')
    // Answer health (required to proceed)
    await page.click('label:has(#hc_none)')
    await page.click('button:has-text("Dalej")')

    // Last step
    await page.click('label:has(#preg_false)')
    await page.click('button:has-text("Gotowe")')

    await page.waitForURL(`${BASE}/onboarding/done`, { timeout: 15_000 })
    await expect(page.getByText('Twój profil jest gotowy!')).toBeVisible()
  } finally {
    await deleteTestUser(email)
  }
})
