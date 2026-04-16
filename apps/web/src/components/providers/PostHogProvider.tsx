'use client'

import { useEffect } from 'react'
import { initPostHog, posthog } from '@/lib/posthog'
import { env } from '@/lib/env'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog(env.NEXT_PUBLIC_POSTHOG_KEY, env.NEXT_PUBLIC_POSTHOG_HOST)
    posthog.capture('app_loaded')
  }, [])

  return <>{children}</>
}
