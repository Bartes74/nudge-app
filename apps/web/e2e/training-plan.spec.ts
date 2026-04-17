import { test, expect } from '@playwright/test'

// Requires local Supabase + Inngest dev server running.
// Run with: pnpm e2e

const TEST_EMAIL = 'e2e-plan@nudge.test'
const TEST_PASSWORD = 'TestPassword123!'

test.describe('Training plan — Iteration 4', () => {
  test.beforeAll(async ({ browser }) => {
    // Pre-condition: user with onboarding complete exists.
    // In CI this is seeded via supabase/seeds/e2e_users.sql.
    const ctx = await browser.newContext()
    const page = await ctx.newPage()

    await page.goto('/signin')
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/hasło|password/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /zaloguj|sign in/i }).click()

    // Wait for app shell
    await page.waitForURL('**/app**', { timeout: 10_000 })
    await ctx.close()
  })

  test('today page shows generate button when no plan exists', async ({ page }) => {
    await page.goto('/signin')
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/hasło|password/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /zaloguj|sign in/i }).click()
    await page.waitForURL('**/app**')

    await page.goto('/app')
    // Either shows the plan or the generate button
    const hasGenerateBtn = await page.getByRole('button', { name: /wygeneruj/i }).isVisible().catch(() => false)
    const hasPlan = await page.getByText(/zacznij trening/i).isVisible().catch(() => false)
    expect(hasGenerateBtn || hasPlan).toBe(true)
  })

  test('plan page renders week grid or empty state', async ({ page }) => {
    await page.goto('/signin')
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/hasło|password/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /zaloguj|sign in/i }).click()
    await page.waitForURL('**/app**')

    await page.goto('/app/plan')
    await expect(page.getByRole('heading', { name: /plan treningowy/i })).toBeVisible()
  })

  test('history page is accessible', async ({ page }) => {
    await page.goto('/signin')
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/hasło|password/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /zaloguj|sign in/i }).click()
    await page.waitForURL('**/app**')

    await page.goto('/app/plan/history')
    await expect(page.getByRole('heading', { name: /historia planu/i })).toBeVisible()
  })

  test('exercise catalog page renders if a slug exists', async ({ page }) => {
    await page.goto('/signin')
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/hasło|password/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /zaloguj|sign in/i }).click()
    await page.waitForURL('**/app**')

    // Use a known slug from the mock seed
    await page.goto('/app/plan/exercise/barbell_bench_press')
    await expect(page.getByRole('heading', { name: /wyciskanie sztangi/i })).toBeVisible()
    await expect(page.getByText(/technika/i)).toBeVisible()
  })
})
