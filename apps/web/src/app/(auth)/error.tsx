'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

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
    <div className="space-y-4 text-center">
      <h2 className="text-lg font-semibold">Coś poszło nie tak</h2>
      <p className="text-sm text-muted-foreground">
        Wystąpił błąd podczas uwierzytelniania. Spróbuj ponownie.
      </p>
      <div className="flex flex-col gap-2">
        <Button onClick={reset}>Spróbuj ponownie</Button>
        <Button variant="ghost" asChild>
          <Link href="/signin">Wróć do logowania</Link>
        </Button>
      </div>
    </div>
  )
}
