'use client'

import '@/lib/i18n/config'

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Initialises i18next on the client by importing config.
  // Wrapping in a component keeps the 'use client' boundary explicit.
  return <>{children}</>
}
