'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Sentry will capture this automatically via the instrumentation hook
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Coś poszło nie tak</h2>
        <p className="text-sm text-muted-foreground">
          Wystąpił nieoczekiwany błąd. Odśwież stronę lub wróć za chwilę.
        </p>
      </div>
      <Button onClick={reset} variant="outline">
        Spróbuj ponownie
      </Button>
    </div>
  )
}
