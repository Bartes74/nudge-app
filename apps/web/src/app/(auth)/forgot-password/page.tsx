import type { Metadata } from 'next'
import Link from 'next/link'
import { ForgotPasswordForm } from './ForgotPasswordForm'

export const metadata: Metadata = { title: 'Reset hasła' }

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Zresetuj hasło
        </h1>
        <p className="text-sm text-muted-foreground">
          Podaj swój e-mail, a wyślemy Ci link do ustawienia nowego hasła.
        </p>
      </div>

      <ForgotPasswordForm />

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/signin" className="font-medium text-primary hover:underline">
          ← Wróć do logowania
        </Link>
      </p>
    </div>
  )
}
