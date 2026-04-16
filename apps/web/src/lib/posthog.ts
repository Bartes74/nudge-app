import posthog from 'posthog-js'

let initialized = false

export function initPostHog(key: string, host: string) {
  if (initialized || typeof window === 'undefined') return
  posthog.init(key, {
    api_host: host,
    capture_pageview: true,
    capture_pageleave: true,
    persistence: 'localStorage',
  })
  initialized = true
}

export { posthog }
