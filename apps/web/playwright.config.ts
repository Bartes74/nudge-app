import { defineConfig, devices } from '@playwright/test'
import {
  localSupabaseAnonKey,
  localSupabaseServiceRoleKey,
  localSupabaseUrl,
} from './e2e/helpers/auth'

process.env['NEXT_PUBLIC_SUPABASE_URL'] ??= localSupabaseUrl
process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ??= localSupabaseAnonKey
process.env['SUPABASE_SERVICE_ROLE_KEY'] ??= localSupabaseServiceRoleKey
process.env['NEXT_PUBLIC_POSTHOG_KEY'] ??= 'phc_e2e_placeholder'
process.env['OPENAI_API_KEY'] ??= 'openai_e2e_placeholder'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: 1,
  reporter: process.env['CI'] ? 'github' : 'list',

  use: {
    baseURL: process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 14'] },
    },
  ],

  // Start dev server automatically when running locally
  webServer: process.env['CI']
    ? undefined
    : {
        command: 'pnpm dev',
        env: {
          ...process.env,
          NEXT_PUBLIC_SUPABASE_URL: process.env['NEXT_PUBLIC_SUPABASE_URL']!,
          NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
          SUPABASE_SERVICE_ROLE_KEY: process.env['SUPABASE_SERVICE_ROLE_KEY']!,
          NEXT_PUBLIC_POSTHOG_KEY: process.env['NEXT_PUBLIC_POSTHOG_KEY']!,
          OPENAI_API_KEY: process.env['OPENAI_API_KEY']!,
        },
        url: 'http://localhost:3000',
        reuseExistingServer: false,
        timeout: 60_000,
      },
})
