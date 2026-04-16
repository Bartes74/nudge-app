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
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex justify-center">
          <span className="text-2xl font-bold tracking-tight text-brand">
            Nudge
          </span>
        </Link>
        {children}
      </div>
    </div>
  )
}
