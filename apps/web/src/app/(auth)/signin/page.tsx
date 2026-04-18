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
    <div className="flex flex-col gap-7">
      <header className="flex flex-col gap-2 text-center">
        <p className="text-label uppercase text-muted-foreground">Logowanie</p>
        <h1 className="text-display-l font-display leading-[1.05] tracking-tight">
          <span className="font-display italic text-muted-foreground">Witaj</span>{' '}
          <span className="font-sans font-semibold">z powrotem.</span>
        </h1>
        <p className="text-body-m text-muted-foreground">
          Zaloguj się, żeby wrócić do swojego planu.
        </p>
      </header>

      <SignInForm searchParams={searchParams} />

      <p className="text-center text-body-s text-muted-foreground">
        Nie masz konta?{' '}
        <Link
          href="/signup"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Zarejestruj się
        </Link>
      </p>
    </div>
  )
}
