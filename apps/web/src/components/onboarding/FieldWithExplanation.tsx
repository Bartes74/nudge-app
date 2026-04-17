'use client'

import * as React from 'react'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FieldExplanation {
  why_we_ask: string
  how_to_measure?: string | null
  example?: string | null
}

interface FieldWithExplanationProps {
  label: string
  explanation: FieldExplanation | null
  children: React.ReactNode
  required?: boolean
  className?: string
}

export function FieldWithExplanation({
  label,
  explanation,
  children,
  required = false,
  className,
}: FieldWithExplanationProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-start gap-2">
        <span className="text-base font-medium leading-tight text-foreground">
          {label}
          {required && <span className="ml-1 text-destructive" aria-hidden>*</span>}
        </span>
        {explanation && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="shrink-0 mt-0.5 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={open ? 'Ukryj wyjaśnienie' : 'Pokaż wyjaśnienie'}
          >
            <Info className="h-4 w-4" />
          </button>
        )}
      </div>

      {explanation && open && (
        <div className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground space-y-1.5">
          <p>{explanation.why_we_ask}</p>
          {explanation.how_to_measure && (
            <p className="font-medium text-foreground/80">
              Jak zmierzyć: {explanation.how_to_measure}
            </p>
          )}
          {explanation.example && (
            <p className="italic text-muted-foreground/70">
              Przykład: {explanation.example}
            </p>
          )}
        </div>
      )}

      <div>{children}</div>
    </div>
  )
}
