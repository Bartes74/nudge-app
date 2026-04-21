// @ts-check
import { withSentryConfig } from '@sentry/nextjs'
import withPWAInit from '@ducanh2912/next-pwa'

const withPWA = withPWAInit({
  dest: 'public',
  // Keep PWA shell/caches, but avoid overly aggressive client navigation caching.
  // Installed iOS PWAs were prone to holding onto stale route bundles across deploys.
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  swcMinify: true,
  // Disable SW in dev to avoid stale cache confusion
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@nudge/config'],
  experimental: {
    instrumentationHook: true,
  },
}

// Only wrap with Sentry in CI/production (requires SENTRY_AUTH_TOKEN).
// Locally, Sentry still works via sentry.client.config.ts — just without source maps.
const hasSentryCredentials = Boolean(
  process.env['SENTRY_AUTH_TOKEN'] &&
    process.env['SENTRY_ORG'] &&
    process.env['SENTRY_PROJECT'],
)

const configWithPWA = withPWA(nextConfig)

export default hasSentryCredentials
  ? withSentryConfig(configWithPWA, {
      org: process.env['SENTRY_ORG'],
      project: process.env['SENTRY_PROJECT'],
      sourcemaps: {
        deleteSourcemapsAfterUpload: true,
      },
      silent: !process.env['CI'],
      widenClientFileUpload: true,
      hideSourceMaps: true,
      disableLogger: true,
      automaticVercelMonitors: true,
    })
  : configWithPWA
