'use client'

import Link from 'next/link'
import { X } from 'lucide-react'
import { useState } from 'react'

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
      className={`relative flex items-center justify-between gap-3 px-4 py-2.5 text-sm ${
        isLastDay
          ? 'bg-destructive text-destructive-foreground'
          : 'bg-primary text-primary-foreground'
      }`}
    >
      <p className="flex-1 text-center font-medium">
        {label} —{' '}
        <Link href="/paywall" className="underline underline-offset-2 font-semibold">
          aktywuj plan
        </Link>
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Zamknij baner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
