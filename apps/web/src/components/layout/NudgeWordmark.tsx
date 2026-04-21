import { fontDisplay, fontWordmarkSans } from '@/lib/fonts'
import { cn } from '@/lib/utils'

type NudgeWordmarkProps = {
  className?: string
}

export function NudgeWordmark({ className }: NudgeWordmarkProps) {
  return (
    <span
      className={cn(
        'inline-flex items-baseline gap-0 leading-none tracking-tight text-[var(--fg-primary)]',
        className,
      )}
    >
      <span className={cn(fontDisplay.className, 'text-[1em] font-normal italic')}>N</span>
      <span className={cn(fontWordmarkSans.className, 'text-[1em] font-black')}>u</span>
      <span className={cn(fontWordmarkSans.className, 'text-[1em] font-semibold')}>d</span>
      <span className={cn(fontWordmarkSans.className, 'text-[1em] font-normal')}>g</span>
      <span className={cn(fontWordmarkSans.className, 'text-[1em] font-extralight')}>e</span>
    </span>
  )
}
