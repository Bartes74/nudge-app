'use client'

import { useFormState } from 'react-dom'
import { CheckCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { forgotPasswordAction, type AuthActionState } from '@/app/(auth)/actions'
import { AuthSubmitButton } from '@/app/(auth)/AuthSubmitButton'

export function ForgotPasswordForm() {
  const [state, formAction] = useFormState<AuthActionState, FormData>(
    forgotPasswordAction,
    null,
  )

  if (state?.success) {
    return (
      <Card variant="default" padding="md" className="ring-1 ring-inset ring-success/20">
        <div className="flex items-start gap-2.5">
          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
          <p className="text-body-s leading-relaxed text-foreground">
            Gotowe! Sprawdź swoją skrzynkę e-mail — wysłaliśmy Ci link do resetu hasła.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email" className="text-label uppercase text-muted-foreground">
          E-mail
        </Label>
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
        <Card
          variant="default"
          padding="sm"
          className="ring-1 ring-inset ring-destructive/20"
          role="alert"
        >
          <p className="text-body-s text-destructive">{state.error}</p>
        </Card>
      )}

      <AuthSubmitButton size="hero" className="w-full">
        Wyślij link do resetu
      </AuthSubmitButton>
    </form>
  )
}
