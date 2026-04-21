import Image from 'next/image'
import { cn } from '@/lib/utils'

type NudgeLogoProps = {
  className?: string
  priority?: boolean
}

export function NudgeLogo({ className, priority = false }: NudgeLogoProps) {
  return (
    <span className="inline-flex items-center">
      <Image
        src="/brand/logo-light.png"
        alt="Nudge"
        width={1150}
        height={327}
        priority={priority}
        className={cn('nudge-logo nudge-logo--light h-auto w-auto', className)}
      />
      <Image
        src="/brand/logo-dark.png"
        alt=""
        aria-hidden="true"
        width={1150}
        height={327}
        priority={priority}
        className={cn('nudge-logo nudge-logo--dark h-auto w-auto', className)}
      />
    </span>
  )
}
