import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middleware-client'
import { getUserRole, isPrivilegedRole } from '@/lib/auth/roles'

/**
 * Middleware runs on every matched request.
 * Responsibilities:
 * 1. Refresh the Supabase session cookie so it never silently expires.
 * 2. Redirect unauthenticated users away from /app/* and /onboarding/* → /signin.
 * 3. Redirect authenticated users away from auth pages → /app.
 * 4. Redirect authenticated users that haven't finished onboarding → /onboarding.
 *    Exception: admin and tester users only need to be authenticated.
 * 5. Billing gate on /app/*:
 *    - admin | tester role → full access (no billing check)
 *    - trial (active)      → full access
 *    - active              → full access
 *    - paused              → full access with x-nudge-readonly header
 *    - paywall             → redirect /paywall
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request })
  const supabase = createMiddlewareClient(request, response)

  // Refresh session — MUST be called before checking the user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ------------------------------------------------------------------
  // /onboarding/* — require auth; admins/testers are welcome
  // ------------------------------------------------------------------
  if (pathname.startsWith('/onboarding')) {
    if (!user) {
      const redirectUrl = new URL('/signin', request.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    return response
  }

  // ------------------------------------------------------------------
  // /app/* — require auth + onboarding + billing gate
  // ------------------------------------------------------------------
  if (pathname.startsWith('/app')) {
    if (!user) {
      const redirectUrl = new URL('/signin', request.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    const role = getUserRole({
      email: user.email,
      app_metadata: user.app_metadata as Record<string, unknown> | undefined,
    })
    const isPrivileged = isPrivilegedRole(role)

    if (!isPrivileged) {
      // ── Onboarding gate ──────────────────────────────────────────
      const { data: profile } = await supabase
        .from('user_profile')
        .select('onboarding_layer_1_done')
        .eq('user_id', user.id)
        .single()

      if (profile !== null && !profile.onboarding_layer_1_done) {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }

      // ── Billing gate ─────────────────────────────────────────────
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('status, trial_ends_at, paused_until')
        .eq('user_id', user.id)
        .maybeSingle()

      const now = new Date()

      if (!sub) {
        // No subscription record — send to paywall
        return NextResponse.redirect(new URL('/paywall', request.url))
      }

      if (sub.status === 'trial') {
        const trialEnd = sub.trial_ends_at ? new Date(sub.trial_ends_at) : null
        if (!trialEnd || trialEnd <= now) {
          return NextResponse.redirect(new URL('/paywall', request.url))
        }
        // Active trial — full access, continue
      } else if (sub.status === 'active' || sub.status === 'past_due') {
        // Full access (past_due = grace period)
      } else if (sub.status === 'paused') {
        const pausedUntil = sub.paused_until ? new Date(sub.paused_until) : null
        if (pausedUntil && pausedUntil > now) {
          // Read-only access — signal to the app via header
          const pausedResponse = NextResponse.next({ request })
          pausedResponse.headers.set('x-nudge-access', 'paused')
          return pausedResponse
        }
        // Pause expired — treat as active
      } else {
        // cancelled | expired
        return NextResponse.redirect(new URL('/paywall', request.url))
      }
    }

    return response
  }

  // ------------------------------------------------------------------
  // Auth pages — redirect logged-in users to the app
  // ------------------------------------------------------------------
  const authPaths = ['/signin', '/signup', '/forgot-password']
  if (authPaths.some((p) => pathname.startsWith(p))) {
    if (user) {
      return NextResponse.redirect(new URL('/app', request.url))
    }
    return response
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico, manifest.json, icons/* (PWA assets)
     * - api/* (API routes handle their own auth)
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|api).*)',
  ],
}
