'use client'

import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGeneratePlan } from '@/hooks/useGeneratePlan'

export function GeneratePlanButton() {
  const router = useRouter()
  const { status, generate } = useGeneratePlan(() => router.refresh())

  return (
    <Button onClick={generate} disabled={status === 'generating'} size="sm">
      {status === 'generating' ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generuję…
        </>
      ) : (
        'Wygeneruj plan'
      )}
    </Button>
  )
}
