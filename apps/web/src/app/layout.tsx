import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
import { PostHogProvider } from '@/components/providers/PostHogProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { I18nProvider } from '@/components/providers/I18nProvider'
import { env } from '@/lib/env'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | Nudge',
    default: 'Nudge',
  },
  description: 'Adaptacyjny AI coach treningowo-żywieniowy',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Nudge',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1729' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider>
            <PostHogProvider
              apiKey={env.NEXT_PUBLIC_POSTHOG_KEY}
              apiHost={env.NEXT_PUBLIC_POSTHOG_HOST}
            >
              {children}
            </PostHogProvider>
          </I18nProvider>
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  )
}
