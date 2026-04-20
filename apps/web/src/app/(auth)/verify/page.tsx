import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, MailCheck } from 'lucide-react'
import { PageHero, PageSection } from '@/components/layout/PageHero'
import { Card } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Potwierdź e-mail' }

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams

  return (
    <div className="flex flex-col gap-12 text-center">
      <div className="flex justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-md)] bg-[var(--bg-inset)] text-[var(--copper-500)]">
          <MailCheck className="h-6 w-6" aria-hidden="true" />
        </div>
      </div>

      <PageHero
        eyebrow="Weryfikacja"
        titleEmphasis="Sprawdź"
        titleMain="skrzynkę."
        lede={
          email ? (
            <>
              Wysłaliśmy link aktywacyjny na{' '}
              <span className="font-medium text-[var(--fg-primary)]">{email}</span>. Kliknij w link,
              żeby aktywować konto.
            </>
          ) : (
            'Kliknij w link, który wysłaliśmy na Twój adres e-mail, żeby aktywować konto.'
          )
        }
        className="text-center"
      />

      <PageSection
        number="01 — Dalej"
        title="Sprawdź e-mail"
        description="Po kliknięciu w link wrócisz do aplikacji i dokończysz aktywację konta."
      >
        <Card variant="recessed" padding="sm">
          <p className="text-body-s text-[var(--fg-secondary)]">
            Nie widzisz e-maila? Sprawdź folder spam.
          </p>
        </Card>
      </PageSection>

      <Link
        href="/signin"
        className="ds-label inline-flex items-center justify-center gap-2 text-[var(--fg-secondary)] transition-colors hover:text-[var(--fg-primary)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Wróć do logowania
      </Link>
    </div>
  )
}
