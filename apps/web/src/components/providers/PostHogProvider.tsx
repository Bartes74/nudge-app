'use client'

import { useEffect } from 'react'
import { initPostHog, posthog } from '@/lib/posthog'

interface PostHogProviderProps {
  children: React.ReactNode
  apiKey: string
  apiHost: string
}

export function PostHogProvider({
  children,
  apiKey,
  apiHost,
}: PostHogProviderProps) {
  useEffect(() => {
    initPostHog(apiKey, apiHost)
    posthog.capture('app_loaded')
  }, [apiKey, apiHost])

  return <>{children}</>
}
