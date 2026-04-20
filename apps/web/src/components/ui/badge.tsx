import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-pill border px-[10px] py-1 text-[11px] font-medium tracking-[0.02em] transition-colors',
  {
    variants: {
      variant: {
        default: 'border-[var(--border-subtle)] bg-[var(--bg-inset)] text-[var(--fg-secondary)]',
        secondary: 'border-[var(--border-subtle)] bg-[var(--bg-inset)] text-[var(--fg-secondary)]',
        destructive: 'border-[var(--copper-100)] bg-[var(--copper-50)] text-[var(--copper-900)]',
        outline: 'border-[var(--border-strong)] bg-transparent text-[var(--fg-primary)]',
        brand: 'border-[var(--copper-100)] bg-[var(--copper-50)] text-[var(--copper-900)]',
        success: 'border-[var(--sage-100)] bg-[var(--sage-50)] text-[var(--sage-900)]',
        'outline-warm': 'border-[var(--border-subtle)] bg-[var(--bg-inset)] text-[var(--fg-secondary)]',
        label: 'border-transparent bg-transparent px-0 py-0 ds-label',
        dark: 'border-[var(--obsidian-700)] bg-[var(--obsidian-900)] text-[var(--oatmeal-100)]',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { badgeVariants }
