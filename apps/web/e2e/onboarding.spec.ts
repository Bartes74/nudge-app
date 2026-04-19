import { test, expect, type Page } from '@playwright/test'
import { createConfirmedTestUser, deleteTestUser, signInAs } from './helpers/auth'

/**
 * Onboarding E2E specs for the current 10-step required flow.
 *
 * These tests assume a running local Supabase instance with migrations applied.
 * Each test creates a dedicated user, signs in, completes the wizard, and verifies
 * that the done page reflects the inferred entry path.
 */

type OnboardingScenario = {
  age: number
  heightCm: number
  weightKg: number
  goalLabel: string
  daysLabel: string
  locationLabel: string
  activityLabel: string
  healthLabel: string
  jobLabel: string
  backgroundLabel: string
  expectedGoal: string
  expectedExperience: string
}

async function clickNext(page: Page): Promise<void> {
  await page
    .getByRole('button', { name: /^Dalej$|^Zapisz i pokaż kolejny krok$/ })
    .click()
}

async function fillCurrentNumber(page: Page, value: number): Promise<void> {
  const input = page.locator('input[type="number"]:visible').last()
  await expect(input).toBeVisible()
  await input.click()
  await input.fill(String(value))
  await expect(input).toHaveValue(String(value))
}

async function chooseRadio(page: Page, label: string): Promise<void> {
  await page.getByRole('radio', { name: label }).click()
}

async function chooseCheckbox(page: Page, label: string): Promise<void> {
  await page.getByRole('checkbox', { name: label }).click()
}

async function completeOnboarding(
  page: Page,
  email: string,
  password: string,
  scenario: OnboardingScenario,
): Promise<void> {
  await signInAs(page, email, password, '**/onboarding')

  await expect(page.getByText('Jaki jest dziś Twój główny cel?')).toBeVisible()
  await chooseRadio(page, scenario.goalLabel)
  await clickNext(page)

  await fillCurrentNumber(page, scenario.age)
  await clickNext(page)

  await fillCurrentNumber(page, scenario.heightCm)
  await clickNext(page)

  await fillCurrentNumber(page, scenario.weightKg)
  await clickNext(page)

  await chooseRadio(page, scenario.daysLabel)
  await clickNext(page)

  await chooseRadio(page, scenario.locationLabel)
  await clickNext(page)

  await chooseRadio(page, scenario.activityLabel)
  await clickNext(page)

  await chooseCheckbox(page, scenario.healthLabel)
  await clickNext(page)

  await chooseRadio(page, scenario.jobLabel)
  await clickNext(page)

  await chooseRadio(page, scenario.backgroundLabel)
  await clickNext(page)

  await expect(page).toHaveURL(/\/onboarding\/done/)
  await expect(page.getByText('Profil gotowy', { exact: true })).toBeVisible()
  await expect(page.getByText(scenario.expectedGoal, { exact: true }).last()).toBeVisible()
  await expect(page.getByText(scenario.expectedExperience, { exact: true }).last()).toBeVisible()
}

test('Ania completes onboarding: guided beginner path', async ({ page }) => {
  const email = `e2e-ania-${Date.now()}@test.nudge`
  const password = 'Test1234!'
  await createConfirmedTestUser(email, password)

  try {
    await completeOnboarding(page, email, password, {
      age: 34,
      heightCm: 168,
      weightKg: 64,
      goalLabel: 'Chcę po prostu regularnie się ruszać i czuć się lepiej',
      daysLabel: '3 treningi tygodniowo',
      locationLabel: 'W domu albo na zewnątrz',
      activityLabel: 'Nie miałem/am jeszcze regularnych treningów',
      healthLabel: 'Nic z tych rzeczy mnie nie dotyczy',
      jobLabel: 'Głównie siedzę',
      backgroundLabel: 'Dopiero zaczynam i chcę prostych instrukcji krok po kroku',
      expectedGoal: 'Zdrowy styl życia',
      expectedExperience: 'Spokojny start',
    })
  } finally {
    await deleteTestUser(email)
  }
})

test('Kuba completes onboarding: standard training path', async ({ page }) => {
  const email = `e2e-kuba-${Date.now()}@test.nudge`
  const password = 'Test1234!'
  await createConfirmedTestUser(email, password)

  try {
    await completeOnboarding(page, email, password, {
      age: 28,
      heightCm: 182,
      weightKg: 85,
      goalLabel: 'Chcę zbudować mięśnie i poprawić sylwetkę',
      daysLabel: '4 treningi tygodniowo',
      locationLabel: 'Na siłowni',
      activityLabel: 'Ćwiczę regularnie teraz albo ćwiczyłem/am w ostatnich 3 miesiącach',
      healthLabel: 'Nic z tych rzeczy mnie nie dotyczy',
      jobLabel: 'Trochę siedzę, trochę chodzę',
      backgroundLabel: 'Ćwiczę regularnie',
      expectedGoal: 'Masa mięśniowa',
      expectedExperience: 'Średniozaawansowany',
    })
  } finally {
    await deleteTestUser(email)
  }
})

test('Marta completes onboarding: returning user path', async ({ page }) => {
  const email = `e2e-marta-${Date.now()}@test.nudge`
  const password = 'Test1234!'
  await createConfirmedTestUser(email, password)

  try {
    await completeOnboarding(page, email, password, {
      age: 41,
      heightCm: 165,
      weightKg: 72,
      goalLabel: 'Chcę schudnąć lub zmniejszyć ilość tkanki tłuszczowej',
      daysLabel: '3 treningi tygodniowo',
      locationLabel: 'W domu albo na zewnątrz',
      activityLabel: 'W ostatnich 12 miesiącach, ale nie teraz regularnie',
      healthLabel: 'Nic z tych rzeczy mnie nie dotyczy',
      jobLabel: 'Głównie stoję albo dużo chodzę',
      backgroundLabel: 'Wracam po długiej przerwie',
      expectedGoal: 'Redukcja',
      expectedExperience: 'Początkujący',
    })
  } finally {
    await deleteTestUser(email)
  }
})

test('User must answer each required step to continue', async ({ page }) => {
  const email = `e2e-required-${Date.now()}@test.nudge`
  const password = 'Test1234!'
  await createConfirmedTestUser(email, password)

  try {
    await signInAs(page, email, password, '**/onboarding')

    const nextButton = page.getByRole('button', { name: /^Dalej$/ })
    await expect(nextButton).toBeDisabled()

    await chooseRadio(page, 'Chcę po prostu regularnie się ruszać i czuć się lepiej')
    await expect(nextButton).toBeEnabled()
    await clickNext(page)

    await expect(page.getByText('Ile masz lat?')).toBeVisible()
    await expect(nextButton).toBeDisabled()

    await fillCurrentNumber(page, 29)
    await expect(nextButton).toBeEnabled()
  } finally {
    await deleteTestUser(email)
  }
})
