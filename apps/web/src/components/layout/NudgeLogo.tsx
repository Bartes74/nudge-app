import Image from 'next/image'
import { cn } from '@/lib/utils'

type NudgeLogoProps = {
  className?: string
  priority?: boolean
}

export function NudgeLogo({ className, priority = false }: NudgeLogoProps) {
  return (
    <Image
      src="/brand/logo.png"
      alt="Nudge"
      width={1095}
      height={327}
      priority={priority}
      className={cn('nudge-logo h-auto w-auto', className)}
    />
  )
}
