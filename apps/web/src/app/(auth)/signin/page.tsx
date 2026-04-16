import type { Metadata } from 'next'
import Link from 'next/link'
import { SignInForm } from './SignInForm'

export const metadata: Metadata = { title: 'Zaloguj się' }

export default function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; deleted?: string }>
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Witaj z powrotem
        </h1>
        <p className="text-sm text-muted-foreground">
          Zaloguj się, żeby wrócić do swojego planu.
        </p>
      </div>

      <SignInForm searchParams={searchParams} />

      <p className="text-center text-sm text-muted-foreground">
        Nie masz konta?{' '}
        <Link
          href="/signup"
          className="font-medium text-primary hover:underline"
        >
          Zarejestruj się
        </Link>
      </p>
    </div>
  )
}
