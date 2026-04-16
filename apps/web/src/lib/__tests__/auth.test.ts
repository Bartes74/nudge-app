/**
 * Unit tests for auth action helpers.
 * These test the pure mapping/validation logic extracted from server actions.
 */
import { describe, it, expect } from 'vitest'

// ---- mapAuthError ----
// Re-export the pure function for testing without importing server action
function mapAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) {
    return 'Nieprawidłowy e-mail lub hasło.'
  }
  if (message.includes('Email not confirmed')) {
    return 'Potwierdź swój adres e-mail, zanim się zalogujesz.'
  }
  if (message.includes('Too many requests')) {
    return 'Za dużo prób. Odczekaj chwilę i spróbuj ponownie.'
  }
  if (message.includes('User already registered')) {
    return 'Ten adres e-mail jest już zarejestrowany. Zaloguj się.'
  }
  return 'Coś poszło nie tak. Spróbuj ponownie.'
}

describe('mapAuthError', () => {
  it('maps invalid credentials', () => {
    expect(mapAuthError('Invalid login credentials')).toBe(
      'Nieprawidłowy e-mail lub hasło.',
    )
  })

  it('maps unconfirmed email', () => {
    expect(mapAuthError('Email not confirmed')).toBe(
      'Potwierdź swój adres e-mail, zanim się zalogujesz.',
    )
  })

  it('maps rate limit', () => {
    expect(mapAuthError('Too many requests')).toBe(
      'Za dużo prób. Odczekaj chwilę i spróbuj ponownie.',
    )
  })

  it('maps already registered', () => {
    expect(mapAuthError('User already registered')).toBe(
      'Ten adres e-mail jest już zarejestrowany. Zaloguj się.',
    )
  })

  it('returns generic error for unknown messages', () => {
    expect(mapAuthError('some unknown error')).toBe(
      'Coś poszło nie tak. Spróbuj ponownie.',
    )
  })
})

// ---- Middleware redirect logic ----

type RouteDecision = 'allow' | 'redirect_signin' | 'redirect_app'

function decideRoute(
  pathname: string,
  isAuthenticated: boolean,
): RouteDecision {
  if (pathname.startsWith('/app')) {
    return isAuthenticated ? 'allow' : 'redirect_signin'
  }
  const authPaths = ['/signin', '/signup', '/forgot-password']
  if (authPaths.some((p) => pathname.startsWith(p))) {
    return isAuthenticated ? 'redirect_app' : 'allow'
  }
  return 'allow'
}

describe('middleware route decisions', () => {
  describe('unauthenticated user', () => {
    it('blocks /app', () => {
      expect(decideRoute('/app', false)).toBe('redirect_signin')
    })
    it('blocks /app/profile', () => {
      expect(decideRoute('/app/profile', false)).toBe('redirect_signin')
    })
    it('allows /signin', () => {
      expect(decideRoute('/signin', false)).toBe('allow')
    })
    it('allows /signup', () => {
      expect(decideRoute('/signup', false)).toBe('allow')
    })
    it('allows / (landing)', () => {
      expect(decideRoute('/', false)).toBe('allow')
    })
  })

  describe('authenticated user', () => {
    it('allows /app', () => {
      expect(decideRoute('/app', true)).toBe('allow')
    })
    it('allows /app/profile', () => {
      expect(decideRoute('/app/profile', true)).toBe('allow')
    })
    it('redirects away from /signin', () => {
      expect(decideRoute('/signin', true)).toBe('redirect_app')
    })
    it('redirects away from /signup', () => {
      expect(decideRoute('/signup', true)).toBe('redirect_app')
    })
    it('allows / (landing)', () => {
      expect(decideRoute('/', true)).toBe('allow')
    })
  })
})
