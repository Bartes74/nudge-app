import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ForgotPasswordForm } from './ForgotPasswordForm'

export const metadata: Metadata = { title: 'Reset hasła' }

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-col gap-2 text-center">
        <p className="text-label uppercase text-muted-foreground">Reset</p>
        <h1 className="text-display-l font-display leading-[1.05] tracking-tight">
          <span className="font-display italic text-muted-foreground">Zresetuj</span>{' '}
          <span className="font-sans font-semibold">hasło.</span>
        </h1>
        <p className="text-body-m text-muted-foreground">
          Podaj swój e-mail, a wyślemy Ci link do ustawienia nowego hasła.
        </p>
      </header>

      <ForgotPasswordForm />

      <p className="text-center">
        <Link
          href="/signin"
          className="inline-flex items-center gap-1.5 text-label uppercase text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Wróć do logowania
        </Link>
      </p>
    </div>
  )
}
