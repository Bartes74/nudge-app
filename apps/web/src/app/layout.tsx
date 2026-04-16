import type { Metadata, Viewport } from 'next'
import { PostHogProvider } from '@/components/providers/PostHogProvider'
import { env } from '@/lib/env'
import './globals.css'

export const metadata: Metadata = {
  title: 'Nudge',
  description: 'Adaptacyjny AI coach treningowo-żywieniowy',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Nudge',
  },
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl">
      <body>
        <PostHogProvider
            apiKey={env.NEXT_PUBLIC_POSTHOG_KEY}
            apiHost={env.NEXT_PUBLIC_POSTHOG_HOST}
          >
            {children}
          </PostHogProvider>
      </body>
    </html>
  )
}
