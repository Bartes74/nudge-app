import type { Metadata } from 'next'
import Link from 'next/link'
import { NudgeLogo } from '@/components/layout/NudgeLogo'

export const metadata: Metadata = {
  title: {
    template: '%s | Nudge',
    default: 'Nudge',
  },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-[var(--bg-canvas)] px-5 py-6 md:px-8 md:py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-4 flex justify-center md:mb-10">
          <span className="inline-flex flex-col items-center gap-1">
            <span className="ds-sidebar__brand-mark">
              <NudgeLogo className="h-[28px] w-auto" priority />
            </span>
            <span className="ds-sidebar__brand-sub text-center">
              Adaptacyjny AI coach treningowo-żywieniowy
            </span>
          </span>
        </Link>
        {children}
      </div>
    </div>
  )
}
