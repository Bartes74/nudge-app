import { test, expect } from '@playwright/test'

// Requires local Supabase + seeded user.
// Run with: pnpm e2e

const TEST_EMAIL = 'e2e-plan@nudge.test'
const TEST_PASSWORD = 'TestPassword123!'

test.describe('Weight logging & progress chart — Iteration 6', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signin')
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/hasło|password/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /zaloguj|sign in/i }).click()
    await page.waitForURL('**/app**', { timeout: 10_000 })
  })

  test('user logs weight 3 times on different days and chart shows data', async ({ page }) => {
    const weights = [74.5, 74.2, 73.8]
    const dates = [
      new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      new Date().toISOString(),
    ]

    // Log 3 weight measurements via API directly (simulates 3 days)
    for (let i = 0; i < weights.length; i++) {
      await page.request.post('/api/measurements/weight', {
        data: { weight_kg: weights[i], measured_at: dates[i] },
      })
    }

    // Navigate to progress page
    await page.goto('/app/progress')
    await page.waitForLoadState('networkidle')

    // Current weight is shown
    const currentWeight = weights[weights.length - 1]!
    await expect(
      page.getByText(new RegExp(currentWeight.toFixed(1).replace('.', '[.,]'))),
    ).toBeVisible({ timeout: 5_000 })

    // Chart is rendered (Recharts renders SVG)
    const svg = page.locator('svg').first()
    await expect(svg).toBeVisible({ timeout: 5_000 })

    // Trend indicator is shown (we logged 3 points)
    const trendContainer = page.locator('[class*="rounded-lg"]').filter({
      hasText: /kg/,
    })
    await expect(trendContainer.first()).toBeVisible({ timeout: 3_000 })
  })

  test('log weight form validates input', async ({ page }) => {
    await page.goto('/app/nutrition/log-weight')
    await page.waitForLoadState('networkidle')

    // Submit with empty field — button should be disabled
    const submitBtn = page.getByRole('button', { name: /zapisz pomiar/i })
    await expect(submitBtn).toBeDisabled()

    // Enter invalid (too low) weight
    const input = page.getByLabel(/waga ciała/i)
    await input.fill('10')

    // Submit
    await submitBtn.click()

    // Should show error
    await expect(page.getByText(/prawidłową wagę/i)).toBeVisible({ timeout: 3_000 })
  })

  test('log weight form with circumferences', async ({ page }) => {
    await page.goto('/app/nutrition/log-weight')
    await page.waitForLoadState('networkidle')

    // Enter weight
    const weightInput = page.getByLabel(/waga ciała/i)
    await weightInput.fill('75.0')

    // Expand circumferences
    await page.getByText(/dodaj obwody/i).click()

    // Fill waist
    const waistInput = page.getByLabel(/talia/i)
    await waistInput.fill('82')

    // Submit
    const submitBtn = page.getByRole('button', { name: /zapisz pomiar/i })
    await expect(submitBtn).toBeEnabled()
    await submitBtn.click()

    // Should redirect to progress page
    await page.waitForURL('**/progress/weight', { timeout: 10_000 })
  })
})
