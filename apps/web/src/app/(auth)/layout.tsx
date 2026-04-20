import type { Metadata } from 'next'
import Link from 'next/link'

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
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-[var(--bg-canvas)] px-8 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-10 flex justify-center">
          <span className="inline-flex flex-col items-center gap-1">
            <span className="ds-sidebar__brand-mark">Nudge</span>
            <span className="ds-sidebar__brand-sub">Adaptacyjny AI coach treningowo-żywieniowy</span>
          </span>
        </Link>
        {children}
      </div>
    </div>
  )
}
