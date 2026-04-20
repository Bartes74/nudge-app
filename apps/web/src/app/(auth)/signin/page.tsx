import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHero, PageSection } from '@/components/layout/PageHero'
import { SignInForm } from './SignInForm'

export const metadata: Metadata = { title: 'Zaloguj się' }

export default function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; deleted?: string }>
}) {
  return (
    <div className="flex flex-col gap-12">
      <PageHero
        eyebrow="Logowanie"
        titleEmphasis="Witaj"
        titleMain="z powrotem."
        lede="Zaloguj się, żeby wrócić do swojego planu."
        className="text-center"
      />

      <PageSection
        number="01 — Konto"
        title="Zaloguj się"
        description="Użyj adresu e-mail i hasła przypisanego do konta."
      >
        <SignInForm searchParams={searchParams} />
      </PageSection>

      <p className="text-center text-body-s text-[var(--fg-secondary)]">
        Nie masz konta?{' '}
        <Link href="/signup" className="font-medium text-[var(--fg-primary)] underline-offset-4 hover:underline">
          Zarejestruj się
        </Link>
      </p>
    </div>
  )
}
