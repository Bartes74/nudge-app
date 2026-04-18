'use client'

import Link from 'next/link'
import { Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface TrialBannerProps {
  daysLeft: number
}

export function TrialBanner({ daysLeft }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const isLastDay = daysLeft <= 1
  const label = isLastDay
    ? 'To ostatni dzień Twojego trialu'
    : `Dzień ${7 - daysLeft + 1} z 7 darmowego trialu`

  return (
    <div
      className={cn(
        'relative flex items-center justify-between gap-3 border-b px-5 py-2 text-body-s',
        isLastDay
          ? 'border-destructive/30 bg-destructive/10 text-destructive'
          : 'border-border/60 bg-surface-2/80 text-foreground',
      )}
    >
      <div className="flex flex-1 items-center justify-center gap-2 text-center">
        <Sparkles
          className={cn('h-3.5 w-3.5 shrink-0', isLastDay ? 'text-destructive' : 'text-brand')}
          aria-hidden="true"
        />
        <p className="font-medium tracking-tight">
          {label}
          <span className="mx-1.5 opacity-40">—</span>
          <Link
            href="/paywall"
            className={cn(
              'font-semibold underline-offset-4 transition-colors',
              isLastDay
                ? 'underline hover:text-destructive/80'
                : 'text-brand hover:underline',
            )}
          >
            aktywuj plan
          </Link>
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
        aria-label="Zamknij baner"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
