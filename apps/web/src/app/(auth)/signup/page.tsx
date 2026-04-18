import type { Metadata } from 'next'
import Link from 'next/link'
import { SignUpForm } from './SignUpForm'

export const metadata: Metadata = { title: 'Zarejestruj się' }

export default function SignUpPage() {
  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-col gap-2 text-center">
        <p className="text-label uppercase text-muted-foreground">Rejestracja</p>
        <h1 className="text-display-l font-display leading-[1.05] tracking-tight">
          <span className="font-display italic text-muted-foreground">Zacznij</span>{' '}
          <span className="font-sans font-semibold">spokojnie.</span>
        </h1>
        <p className="text-body-m text-muted-foreground">
          Stwórz konto i dostań swój plan w 5 minut.
        </p>
      </header>

      <SignUpForm />

      <p className="text-center text-body-s text-muted-foreground">
        Rejestrując się, akceptujesz nasz{' '}
        <Link
          href="/terms"
          className="text-foreground underline-offset-4 hover:underline"
        >
          Regulamin
        </Link>{' '}
        i{' '}
        <Link
          href="/privacy"
          className="text-foreground underline-offset-4 hover:underline"
        >
          Politykę Prywatności
        </Link>
        .
      </p>

      <p className="text-center text-body-s text-muted-foreground">
        Masz już konto?{' '}
        <Link
          href="/signin"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Zaloguj się
        </Link>
      </p>
    </div>
  )
}
