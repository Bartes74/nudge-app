import { test, expect } from '@playwright/test'
import { signInAs } from './helpers/auth'

// Requires local Supabase + seeded data.
// Run with: pnpm e2e

const TEST_EMAIL = 'e2e-coach@nudge.test'
const TEST_PASSWORD = 'TestPassword123!'

test.describe('AI Coach — Iteration 8', () => {
  test.beforeEach(async ({ page }) => {
    await signInAs(page, TEST_EMAIL, TEST_PASSWORD)
  })

  // Scenario A — Ania (pain signal → referral)
  test('Ania: pain message triggers referral response', async ({ page }) => {
    // Open chat via bubble
    await page.goto('/app')
    const bubble = page.getByRole('button', { name: /coach/i })
    await expect(bubble).toBeVisible({ timeout: 5_000 })
    await bubble.click()

    // Should land on conversation page
    await page.waitForURL('**/app/coach/**', { timeout: 10_000 })

    // Type pain message
    const textarea = page.getByPlaceholder(/napisz wiadomość/i)
    await expect(textarea).toBeVisible()
    await textarea.fill('Boli mnie kolano podczas przysiadu. Co robić?')
    await textarea.press('Enter')

    await expect(page.locator('text=/fizjoterapeut/i').first()).toBeVisible({
      timeout: 10_000,
    })
  })

  // Scenario B — Kuba (technical exercise question)
  test('Kuba: exercise page has "Spytaj o technikę" button', async ({ page }) => {
    await page.goto('/app/plan/exercise/deadlift')
    await expect(
      page.getByRole('button', { name: /spytaj o technikę/i }),
    ).toBeVisible({ timeout: 5_000 })

    // Click and verify navigation to coach
    await page.getByRole('button', { name: /spytaj o technikę/i }).click()
    await page.waitForURL('**/app/coach/**', { timeout: 10_000 })

    // Prefilled message should be auto-sent
    await expect(page.locator('text=/martwy ciąg|martwy-ciąg/i').first()).toBeVisible({
      timeout: 5_000,
    })
  })

  // Scenario C — Marta (diet question from nutrition page)
  test('Marta: nutrition page still gives access to coach flow', async ({ page }) => {
    await page.goto('/app/nutrition')
    await expect(page.getByRole('link', { name: /dodaj posiłek/i })).toBeVisible()

    const bubble = page.getByRole('button', { name: /coach/i })
    await expect(bubble).toBeVisible({ timeout: 5_000 })
    await bubble.click()
    await page.waitForURL('**/app/coach/**', { timeout: 10_000 })

    // Should be on coach screen
    await expect(page.getByPlaceholder(/napisz wiadomość/i)).toBeVisible()
  })
})
