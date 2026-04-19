import { test, expect } from '@playwright/test'
import {
  completeBasicOnboardingForUser,
  createConfirmedTestUser,
  deleteTestUser,
  signInAs,
} from './helpers/auth'

// Requires local Supabase + seeded user.
// Run with: pnpm e2e

const TEST_EMAIL = 'e2e-nutrition@nudge.test'
const TEST_PASSWORD = 'TestPassword123!'
const ONE_PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+s8i8AAAAASUVORK5CYII=',
  'base64',
)

test.describe('Meal logging — Iteration 10', () => {
  // Scenario A — 3 ręczne wpisy → today totals
  test('dodanie 3 posiłków ręcznie aktualizuje dzienne totals', async ({ page }) => {
    const email = `e2e-nutrition-log-${Date.now()}@test.nudge`
    const password = 'Test1234!'
    await createConfirmedTestUser(email, password)
    await completeBasicOnboardingForUser(email)

    const meals = [
      { kcal: '400', protein: '30', carbs: '40', fat: '10', label: 'Owsianka z owocami' },
      { kcal: '600', protein: '45', carbs: '50', fat: '15', label: 'Kurczak z ryżem' },
      { kcal: '300', protein: '20', carbs: '30', fat: '8', label: 'Twarożek z warzywami' },
    ]

    try {
      await signInAs(page, email, password)

      for (const meal of meals) {
        await page.goto('/app/nutrition/log')
        await page.getByRole('link', { name: /Ręcznie/i }).click()
        await page.waitForURL('**/nutrition/log/manual')

        await page.getByPlaceholder(/Nazwa/i).fill(meal.label)
        await page.getByLabel(/^Kalorie/i).fill(meal.kcal)
        await page.getByLabel(/^Białko/i).fill(meal.protein)
        await page.getByLabel(/^Węgle/i).fill(meal.carbs)
        await page.getByLabel(/^Tłuszcze/i).fill(meal.fat)
        await page.getByRole('button', { name: /Zapisz posiłek/i }).click()

        // Should redirect to meal result
        await page.waitForURL('**/nutrition/log/**', { timeout: 5_000 })
      }

      // Check nutrition summary
      await page.goto('/app/nutrition')
      await expect(page.getByText(/3 posiłki/i)).toBeVisible({ timeout: 5_000 })

      // Total kcal should be 1300 (400+600+300)
      // We use tabular-nums so look for the value
      const kcalText = page.locator('text=/1300|1 300/').first()
      await expect(kcalText).toBeVisible({ timeout: 5_000 })
    } finally {
      await deleteTestUser(email)
    }
  })

  // Scenario B — log page shows 3 CTAs
  test('strona log pokazuje 3 opcje dodania', async ({ page }) => {
    await signInAs(page, TEST_EMAIL, TEST_PASSWORD)
    await page.goto('/app/nutrition/log')
    await expect(page.locator('a[href="/app/nutrition/log/photo"]')).toBeVisible()
    await expect(page.locator('a[href="/app/nutrition/log/photo?note=1"]')).toBeVisible()
    await expect(page.locator('a[href="/app/nutrition/log/manual"]')).toBeVisible()
  })

  // Scenario C — rate limit message
  test('przekroczenie limitu zdjęć wyświetla komunikat', async ({ page }) => {
    await signInAs(page, TEST_EMAIL, TEST_PASSWORD)
    // Mock the /api/meal/photo endpoint to return 429
    await page.route('/api/meal/photo', (route) =>
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Możesz dodać maksymalnie 6 zdjęć dziennie. Skorzystaj z opcji ręcznego wpisu.',
        }),
      }),
    )

    await page.goto('/app/nutrition/log/photo')

    // Attach a fake file
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByRole('button', { name: /dotknij, aby zrobić zdjęcie/i }).click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: ONE_PIXEL_PNG,
    })

    await page.getByRole('button', { name: /Analizuj posiłek/i }).click()

    await expect(
      page.getByRole('alert').getByText(/Możesz dodać maksymalnie 6 zdjęć dziennie/i),
    ).toBeVisible({ timeout: 5_000 })
  })
})
