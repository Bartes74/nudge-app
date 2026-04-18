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
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-sm animate-stagger">
        <Link href="/" className="mb-10 flex justify-center">
          <span className="inline-flex items-baseline gap-[1px] text-[28px] leading-none tracking-tight">
            <span className="font-display italic text-brand">N</span>
            <span className="font-sans font-semibold text-foreground">udge</span>
            <span className="ml-0.5 h-1.5 w-1.5 translate-y-[-1px] rounded-full bg-brand" aria-hidden="true" />
          </span>
        </Link>
        {children}
      </div>
    </div>
  )
}
