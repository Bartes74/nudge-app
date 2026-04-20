import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <input
          type={type}
          className={cn(
            'flex w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-[14px] py-[12px] text-[15px] text-[var(--fg-primary)]',
            'font-inherit transition-[border-color] duration-[var(--dur-fast)] ease-premium',
            'file:border-0 file:bg-transparent file:text-[15px] file:font-medium',
            'placeholder:text-[var(--fg-tertiary)]',
            'focus-visible:border-[var(--fg-primary)] focus-visible:outline-none focus-visible:ring-0',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-[var(--status-caution)] focus-visible:border-[var(--status-caution)]',
            className,
          )}
          ref={ref}
          aria-invalid={Boolean(error)}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'

export { Input }
