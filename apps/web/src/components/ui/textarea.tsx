import * as React from 'react'
import { cn } from '@/lib/utils'

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        'flex min-h-[112px] w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-[14px] py-[12px] text-[15px] text-[var(--fg-primary)] transition-[border-color,background-color,color] duration-premium ease-premium',
        'placeholder:text-[var(--fg-tertiary)]',
        'focus-visible:border-[var(--fg-primary)] focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'resize-none',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
)
Textarea.displayName = 'Textarea'

export { Textarea }
