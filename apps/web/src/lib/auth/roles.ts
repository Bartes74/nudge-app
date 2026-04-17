type UserLike = {
  email?: string | null
  app_metadata?: Record<string, unknown> | null
}

export type AppUserRole = 'admin' | 'tester' | 'user'

const DEFAULT_ADMIN_EMAILS = ['bartek@dajer.pl']

function getAdminEmails(): Set<string> {
  const configured = process.env['NUDGE_ADMIN_EMAILS']
    ?.split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean) ?? []

  return new Set([...DEFAULT_ADMIN_EMAILS, ...configured])
}

export function isBootstrapAdminEmail(email?: string | null): boolean {
  if (!email) return false
  return getAdminEmails().has(email.trim().toLowerCase())
}

export function getUserRole(user: UserLike | null | undefined): AppUserRole {
  const metadataRole = user?.app_metadata?.['role']

  if (metadataRole === 'admin' || metadataRole === 'tester') {
    return metadataRole
  }

  if (isBootstrapAdminEmail(user?.email)) {
    return 'admin'
  }

  return 'user'
}

export function isPrivilegedRole(role: AppUserRole): boolean {
  return role === 'admin' || role === 'tester'
}
