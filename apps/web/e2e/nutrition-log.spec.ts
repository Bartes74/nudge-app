import { test, expect } from '@playwright/test'

// Requires local Supabase + seeded user.
// Run with: pnpm e2e

const TEST_EMAIL = 'e2e-nutrition@nudge.test'
const TEST_PASSWORD = 'TestPassword123!'

test.describe('Meal logging — Iteration 10', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signin')
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/hasło|password/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /zaloguj|sign in/i }).click()
    await page.waitForURL('**/app**', { timeout: 10_000 })
  })

  // Scenario A — 3 ręczne wpisy → today totals
  test('dodanie 3 posiłków ręcznie aktualizuje dzienne totals', async ({ page }) => {
    const meals = [
      { kcal: '400', protein: '30', carbs: '40', fat: '10', label: 'Owsianka z owocami' },
      { kcal: '600', protein: '45', carbs: '50', fat: '15', label: 'Kurczak z ryżem' },
      { kcal: '300', protein: '20', carbs: '30', fat: '8', label: 'Twarożek z warzywami' },
    ]

    for (const meal of meals) {
      await page.goto('/app/nutrition/log')
      await page.getByRole('link', { name: /Ręcznie/i }).click()
      await page.waitForURL('**/nutrition/log/manual')

      await page.getByPlaceholder(/Nazwa/i).fill(meal.label)
      await page.getByLabel(/Kalorie/i).fill(meal.kcal)
      await page.getByLabel(/Białko/i).fill(meal.protein)
      await page.getByLabel(/Węgle/i).fill(meal.carbs)
      await page.getByLabel(/Tłuszcze/i).fill(meal.fat)
      await page.getByRole('button', { name: /Zapisz posiłek/i }).click()

      // Should redirect to meal result
      await page.waitForURL('**/nutrition/log/**', { timeout: 5_000 })
    }

    // Check today totals
    await page.goto('/app/nutrition/today')
    await expect(page.getByText('Posiłki (3)')).toBeVisible({ timeout: 5_000 })

    // Total kcal should be 1300 (400+600+300)
    // We use tabular-nums so look for the value
    const kcalText = page.locator('text=/1300|1 300/').first()
    await expect(kcalText).toBeVisible({ timeout: 5_000 })
  })

  // Scenario B — log page shows 3 CTAs
  test('strona log pokazuje 3 opcje dodania', async ({ page }) => {
    await page.goto('/app/nutrition/log')
    await expect(page.getByRole('link', { name: /Zdjęcie$/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Zdjęcie \+ notatka/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Ręcznie/i })).toBeVisible()
  })

  // Scenario C — rate limit message
  test('przekroczenie limitu zdjęć wyświetla komunikat', async ({ page }) => {
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
    await page.locator('button:has(svg)').first().click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles({
      name: 'test.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data'),
    })

    await page.getByRole('button', { name: /Analizuj posiłek/i }).click()

    await expect(
      page.getByText(/Możesz dodać maksymalnie 6 zdjęć dziennie/i),
    ).toBeVisible({ timeout: 5_000 })
  })
})
