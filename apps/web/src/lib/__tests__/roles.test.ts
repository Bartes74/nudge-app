import { describe, expect, it, vi } from 'vitest'
import { getUserRole, isBootstrapAdminEmail, isPrivilegedRole } from '@/lib/auth/roles'

describe('roles helpers', () => {
  it('treats bootstrap admin email as admin', () => {
    expect(isBootstrapAdminEmail('bartek@dajer.pl')).toBe(true)
    expect(
      getUserRole({
        email: 'bartek@dajer.pl',
        app_metadata: {},
      }),
    ).toBe('admin')
  })

  it('prefers explicit metadata role', () => {
    expect(
      getUserRole({
        email: 'someone@example.com',
        app_metadata: { role: 'tester' },
      }),
    ).toBe('tester')
  })

  it('reads extra admin emails from env', () => {
    vi.stubEnv('NUDGE_ADMIN_EMAILS', 'admin@example.com, owner@example.com')

    expect(isBootstrapAdminEmail('owner@example.com')).toBe(true)
    expect(
      getUserRole({
        email: 'admin@example.com',
        app_metadata: {},
      }),
    ).toBe('admin')

    vi.unstubAllEnvs()
  })

  it('marks only admin and tester as privileged', () => {
    expect(isPrivilegedRole('admin')).toBe(true)
    expect(isPrivilegedRole('tester')).toBe(true)
    expect(isPrivilegedRole('user')).toBe(false)
  })
})
