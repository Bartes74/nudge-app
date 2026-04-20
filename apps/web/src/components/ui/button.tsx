import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap border font-medium transition-[background-color,color,border-color] duration-[var(--dur-fast)] ease-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--action-primary-bg)] text-[var(--action-primary-fg)]",
        success:
          'border-transparent bg-[var(--sage-700)] text-[var(--oatmeal-50)]',
        destructive:
          'border-transparent bg-[var(--clay-500)] text-[var(--oatmeal-50)]',
        outline:
          'border-[var(--border-strong)] bg-transparent text-[var(--fg-primary)]',
        secondary:
          'border-transparent bg-[var(--bg-inset)] text-[var(--fg-primary)]',
        ghost:
          'border-transparent bg-transparent text-[var(--fg-primary)]',
        link:
          'border-transparent bg-transparent px-0 text-[var(--fg-primary)] underline-offset-4 hover:underline',
        sage:
          'border-transparent bg-[var(--sage-700)] text-[var(--oatmeal-50)]',
        copper:
          'border-transparent bg-[var(--copper-500)] text-white',
        subtle:
          'border-transparent bg-[var(--bg-inset)] text-[var(--fg-primary)]',
      },
      size: {
        default: 'h-[42px] rounded-[var(--radius-md)] px-[18px] py-[10px] text-[14px]',
        sm: 'h-[34px] rounded-[var(--radius-md)] px-[14px] py-[8px] text-[13px]',
        lg: 'h-[52px] rounded-[var(--radius-md)] px-[24px] py-[14px] text-[15px]',
        hero: 'h-[52px] rounded-[var(--radius-md)] px-[24px] py-[14px] text-[15px]',
        icon: 'h-[42px] w-[42px] rounded-[var(--radius-md)] p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn("font-sans font-medium", buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled ?? isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>{children}</span>
          </>
        ) : (
          children
        )}
      </Comp>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
