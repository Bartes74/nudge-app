import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, MailCheck } from 'lucide-react'
import { Card } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Potwierdź e-mail' }

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams

  return (
    <div className="flex flex-col gap-7 text-center">
      <div className="flex justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-muted text-brand">
          <MailCheck className="h-6 w-6" aria-hidden="true" />
        </div>
      </div>

      <header className="flex flex-col gap-2">
        <p className="text-label uppercase text-muted-foreground">Weryfikacja</p>
        <h1 className="text-display-l font-display leading-[1.05] tracking-tight">
          <span className="font-display italic text-muted-foreground">Sprawdź</span>{' '}
          <span className="font-sans font-semibold">skrzynkę.</span>
        </h1>
        <p className="text-body-m leading-relaxed text-muted-foreground">
          {email ? (
            <>
              Wysłaliśmy link aktywacyjny na{' '}
              <span className="font-medium text-foreground">{email}</span>. Kliknij w link,
              żeby aktywować konto.
            </>
          ) : (
            'Kliknij w link, który wysłaliśmy na Twój adres e-mail, żeby aktywować konto.'
          )}
        </p>
      </header>

      <Card variant="recessed" padding="sm">
        <p className="text-body-s text-muted-foreground">
          Nie widzisz e-maila? Sprawdź folder spam.
        </p>
      </Card>

      <Link
        href="/signin"
        className="inline-flex items-center justify-center gap-1.5 text-label uppercase text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Wróć do logowania
      </Link>
    </div>
  )
}
