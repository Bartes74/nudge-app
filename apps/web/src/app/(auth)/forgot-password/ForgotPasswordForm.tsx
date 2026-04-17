'use client'

import { useFormState } from 'react-dom'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { forgotPasswordAction, type AuthActionState } from '@/app/(auth)/actions'
import { AuthSubmitButton } from '@/app/(auth)/AuthSubmitButton'

export function ForgotPasswordForm() {
  const [state, formAction] = useFormState<AuthActionState, FormData>(
    forgotPasswordAction,
    null,
  )

  if (state?.success) {
    return (
      <div className="rounded-lg bg-brand-muted p-4 text-center text-sm text-brand">
        Gotowe! Sprawdź swoją skrzynkę e-mail — wysłaliśmy Ci link do resetu
        hasła.
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="ty@przykład.pl"
          required
        />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <AuthSubmitButton className="w-full">
        Wyślij link do resetu
      </AuthSubmitButton>
    </form>
  )
}
