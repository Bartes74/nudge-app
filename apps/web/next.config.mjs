// @ts-check
import { withSentryConfig } from '@sentry/nextjs'

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

export default hasSentryCredentials
  ? withSentryConfig(nextConfig, {
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
  : nextConfig
