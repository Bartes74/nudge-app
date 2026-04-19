'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button, type ButtonProps } from '@/components/ui/button'
import { useGeneratePlan } from '@/hooks/useGeneratePlan'

type Props = Pick<ButtonProps, 'variant' | 'size' | 'className'> & {
  label?: string
}

export function GeneratePlanButton({
  label = 'Wygeneruj plan',
  variant,
  size = 'sm',
  className,
}: Props) {
  const router = useRouter()
  const { status, error, blockedReasons, generate } = useGeneratePlan(() => router.refresh())

  useEffect(() => {
    if (status === 'failed' && error) {
      toast.error(error)
    }
  }, [error, status])

  useEffect(() => {
    if (status === 'blocked' && blockedReasons && blockedReasons.length > 0) {
      toast.error(`Najpierw zajmijmy się bezpieczeństwem: ${blockedReasons.join(', ')}.`)
    }
  }, [blockedReasons, status])

  return (
    <Button
      onClick={() => void generate()}
      disabled={status === 'generating'}
      size={size}
      variant={variant}
      className={className}
    >
      {status === 'generating' ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generuję…
        </>
      ) : (
        label
      )}
    </Button>
  )
}
