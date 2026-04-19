import { test, expect } from '@playwright/test'
import { signInAs } from './helpers/auth'

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

    await signInAs(page, TEST_EMAIL, TEST_PASSWORD)
    await ctx.close()
  })

  test('today page shows a plan CTA when no plan exists or plan is ready', async ({ page }) => {
    await signInAs(page, TEST_EMAIL, TEST_PASSWORD)

    await page.goto('/app')
    // Either shows the plan or the generate button
    const hasGenerateBtn = await page
      .getByRole('button', { name: /przygotuj mój plan|wygeneruj plan/i })
      .isVisible()
      .catch(() => false)
    const hasPlan = await page
      .getByRole('button', { name: /zacznij trening|otwórz dzisiejszy spokojny trening/i })
      .isVisible()
      .catch(() => false)
    expect(hasGenerateBtn || hasPlan).toBe(true)
  })

  test('plan page renders week grid or empty state', async ({ page }) => {
    await signInAs(page, TEST_EMAIL, TEST_PASSWORD)

    await page.goto('/app/plan')
    await expect(page.getByRole('heading', { name: /tydzień treningowy|plan treningowy/i })).toBeVisible()
  })

  test('history page is accessible', async ({ page }) => {
    await signInAs(page, TEST_EMAIL, TEST_PASSWORD)

    await page.goto('/app/plan/history')
    await expect(page.getByRole('heading', { name: /historia|ewolucja planu/i })).toBeVisible()
  })

  test('exercise catalog page renders if a slug exists', async ({ page }) => {
    await signInAs(page, TEST_EMAIL, TEST_PASSWORD)

    // Use a known slug from the mock seed
    await page.goto('/app/plan/exercise/barbell_bench_press')
    await expect(page.getByRole('heading', { name: /wyciskanie sztangi/i })).toBeVisible()
    await expect(page.getByText(/technika/i)).toBeVisible()
  })
})
