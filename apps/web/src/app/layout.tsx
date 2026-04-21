import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
import { PostHogProvider } from '@/components/providers/PostHogProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { I18nProvider } from '@/components/providers/I18nProvider'
import { cn } from '@/lib/utils'
import { env } from '@/lib/env'
import {
  fontDisplay,
  fontEditorial,
  fontMono,
  fontSans,
} from '@/lib/fonts'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | Nudge',
    default: 'Nudge',
  },
  description: 'Adaptacyjny AI coach treningowo-żywieniowy',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Nudge',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F7F4F0' },
    { media: '(prefers-color-scheme: dark)', color: '#0E0E0E' },
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
    <html
      lang="pl"
      suppressHydrationWarning
      className={cn(
        fontSans.variable,
        fontDisplay.variable,
        fontEditorial.variable,
        fontMono.variable,
      )}
    >
      <body>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="light"
          enableSystem={false}
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
