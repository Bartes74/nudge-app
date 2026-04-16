import type { Metadata } from 'next'
import Link from 'next/link'
import { MailCheck } from 'lucide-react'

export const metadata: Metadata = { title: 'Potwierdź e-mail' }

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="rounded-full bg-brand-muted p-4">
          <MailCheck className="h-8 w-8 text-brand" />
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Sprawdź skrzynkę!
        </h1>
        <p className="text-sm text-muted-foreground">
          {email ? (
            <>
              Wysłaliśmy link aktywacyjny na{' '}
              <span className="font-medium text-foreground">{email}</span>.
              Kliknij w link, żeby aktywować konto.
            </>
          ) : (
            'Kliknij w link, który wysłaliśmy na Twój adres e-mail, żeby aktywować konto.'
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          Nie widzisz e-maila? Sprawdź folder spam.
        </p>
      </div>

      <div className="pt-2">
        <Link
          href="/signin"
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Wróć do logowania
        </Link>
      </div>
    </div>
  )
}
