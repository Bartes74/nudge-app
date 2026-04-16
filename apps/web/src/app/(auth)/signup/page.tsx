import type { Metadata } from 'next'
import Link from 'next/link'
import { SignUpForm } from './SignUpForm'

export const metadata: Metadata = { title: 'Zarejestruj się' }

export default function SignUpPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Zacznij swoją przygodę
        </h1>
        <p className="text-sm text-muted-foreground">
          Stwórz konto i dostań swój plan w 5 minut.
        </p>
      </div>

      <SignUpForm />

      <p className="text-center text-xs text-muted-foreground">
        Rejestrując się, akceptujesz nasz{' '}
        <Link href="/terms" className="underline underline-offset-2 hover:text-primary">
          Regulamin
        </Link>{' '}
        i{' '}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-primary">
          Politykę Prywatności
        </Link>
        .
      </p>

      <p className="text-center text-sm text-muted-foreground">
        Masz już konto?{' '}
        <Link href="/signin" className="font-medium text-primary hover:underline">
          Zaloguj się
        </Link>
      </p>
    </div>
  )
}
