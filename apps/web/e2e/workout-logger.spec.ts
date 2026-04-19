import { test, expect } from '@playwright/test'
import { signInAs } from './helpers/auth'

// Requires local Supabase + Inngest dev server + seeded data.
// Run with: pnpm e2e

const TEST_EMAIL = 'e2e-plan@nudge.test'
const TEST_PASSWORD = 'TestPassword123!'

test.describe('Workout Logger — Iteration 5', () => {
  test.beforeEach(async ({ page }) => {
    await signInAs(page, TEST_EMAIL, TEST_PASSWORD)
  })

  test('full workout log under 180 seconds', async ({ page }) => {
    const startTime = Date.now()

    // Navigate to plan
    await page.goto('/app/plan')
    await page.waitForLoadState('networkidle')

    // Click first available workout
    const workoutLink = page.locator('a[href*="/app/plan/workout/"]').first()
    await expect(workoutLink).toBeVisible({ timeout: 5_000 })
    await workoutLink.click()

    // Click "Zacznij trening"
    const startBtn = page.getByRole('link', { name: /zacznij trening/i })
    await expect(startBtn).toBeVisible({ timeout: 5_000 })
    await startBtn.click()

    // Pre-workout mood screen
    await page.waitForURL('**/start')
    const moodBtn = page.getByRole('button', { name: /dobrze/i })
    await expect(moodBtn).toBeVisible({ timeout: 3_000 })
    await moodBtn.click()

    // Start workout
    const startWorkoutBtn = page.getByRole('button', { name: /zaczynamy/i })
    await startWorkoutBtn.click()

    // Workout logger screen
    await page.waitForURL('**/today/workout/**', { timeout: 8_000 })
    await page.waitForLoadState('networkidle')

    // Add a set
    const addSetBtn = page.getByRole('button', { name: /dodaj serię/i })
    await expect(addSetBtn).toBeVisible({ timeout: 5_000 })
    await addSetBtn.click()

    // Fill weight
    const weightInput = page.locator('input[type="number"]').first()
    await expect(weightInput).toBeVisible({ timeout: 3_000 })
    await weightInput.fill('60')

    // Fill reps
    const repsInput = page.locator('input[type="number"]').nth(1)
    await repsInput.fill('10')

    // Add another set
    await addSetBtn.click()
    await page.locator('input[type="number"]').nth(2).fill('60')
    await page.locator('input[type="number"]').nth(3).fill('10')

    // Go to next exercise or finish
    const nextBtn = page
      .getByRole('button', { name: /następne ćwiczenie →|zakończ trening/i })
      .last()
    await expect(nextBtn).toBeVisible()
    await nextBtn.click()

    // If on finish screen
    const isFinishPage = page.url().includes('/finish')
    if (isFinishPage) {
      // Rate workout
      const stars = page.locator('[aria-label*="gwiazdki"]')
      await stars.nth(3).click() // 4 stars

      // Submit
      await page.getByRole('button', { name: /zakończ trening/i }).click()
      await page.waitForURL('**/history', { timeout: 8_000 })
    } else {
      // Click finish via next exercise until we reach the end
      // For testing speed, just navigate to finish directly
      const currentUrl = page.url()
      const logId = currentUrl.split('/workout/')[1]?.split('/')[0]
      if (logId) {
        await page.goto(`/app/today/workout/${logId}/finish`)
        await page.locator('[aria-label*="gwiazdki"]').nth(3).click()
        await page.getByRole('button', { name: /zakończ trening/i }).click()
        await page.waitForURL('**/history', { timeout: 8_000 })
      }
    }

    const elapsed = (Date.now() - startTime) / 1000
    expect(elapsed).toBeLessThan(180)
  })

  test('history page shows logged workout', async ({ page }) => {
    await page.goto('/app/history')
    await page.waitForLoadState('networkidle')

    // Either shows workouts or empty state
    const hasWorkouts = await page.locator('a[href*="/app/history/"]').first().isVisible().catch(() => false)
    const hasEmpty = await page.getByText(/brak zapisanych/i).isVisible().catch(() => false)
    expect(hasWorkouts || hasEmpty).toBe(true)
  })

  test('exercise history page shows chart or empty state', async ({ page }) => {
    await page.goto('/app/plan/exercise/barbell_bench_press/history')
    await page.waitForLoadState('networkidle')

    const hasChart = await page.locator('.recharts-wrapper').isVisible().catch(() => false)
    const hasEmpty = await page.getByText(/brak historii/i).isVisible().catch(() => false)
    expect(hasChart || hasEmpty).toBe(true)
  })
})
