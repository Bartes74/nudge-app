'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col gap-6 text-center">
      <Card variant="default" padding="md" className="ring-1 ring-inset ring-destructive/20">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-display-m font-display italic text-destructive">
              Coś poszło nie tak
            </h2>
            <p className="text-body-s text-muted-foreground">
              Wystąpił błąd podczas uwierzytelniania. Spróbuj ponownie.
            </p>
          </div>
        </div>
      </Card>
      <div className="flex flex-col gap-2">
        <Button onClick={reset}>Spróbuj ponownie</Button>
        <Button variant="ghost" asChild>
          <Link href="/signin">Wróć do logowania</Link>
        </Button>
      </div>
    </div>
  )
}
