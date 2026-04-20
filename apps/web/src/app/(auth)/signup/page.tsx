import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHero, PageSection } from '@/components/layout/PageHero'
import { SignUpForm } from './SignUpForm'

export const metadata: Metadata = { title: 'Zarejestruj się' }

export default function SignUpPage() {
  return (
    <div className="flex flex-col gap-12">
      <PageHero
        eyebrow="Rejestracja"
        titleEmphasis="Zacznij"
        titleMain="spokojnie."
        lede="Stwórz konto i dostań swój plan w kilka minut."
        className="text-center"
      />

      <PageSection
        number="01 — Konto"
        title="Załóż konto"
        description="Podaj podstawowe dane, żeby przejść dalej do onboardingu."
      >
        <SignUpForm />
      </PageSection>

      <p className="text-center text-body-s text-[var(--fg-secondary)]">
        Rejestrując się, akceptujesz nasz{' '}
        <Link
          href="/terms"
          className="text-[var(--fg-primary)] underline-offset-4 hover:underline"
        >
          Regulamin
        </Link>{' '}
        i{' '}
        <Link
          href="/privacy"
          className="text-[var(--fg-primary)] underline-offset-4 hover:underline"
        >
          Politykę Prywatności
        </Link>
        .
      </p>

      <p className="text-center text-body-s text-[var(--fg-secondary)]">
        Masz już konto?{' '}
        <Link
          href="/signin"
          className="font-medium text-[var(--fg-primary)] underline-offset-4 hover:underline"
        >
          Zaloguj się
        </Link>
      </p>
    </div>
  )
}
