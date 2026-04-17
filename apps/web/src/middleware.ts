import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middleware-client'

/**
 * Middleware runs on every matched request.
 * Responsibilities:
 * 1. Refresh the Supabase session cookie so it never silently expires.
 * 2. Redirect unauthenticated users away from /app/* and /onboarding/* → /signin.
 * 3. Redirect authenticated users away from auth pages → /app.
 * 4. Redirect authenticated users that haven't finished onboarding → /onboarding.
 *    Exception: admin users only need to be authenticated.
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
  // /onboarding/* — require auth; admins are welcome without restrictions
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
  // /app/* — require auth + layer_1 onboarding (unless admin)
  // ------------------------------------------------------------------
  if (pathname.startsWith('/app')) {
    if (!user) {
      const redirectUrl = new URL('/signin', request.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Admin users (role set in Supabase app_metadata) bypass onboarding gate.
    // Set via Supabase Dashboard → Auth → Users → Edit user → app_metadata: {"role":"admin"}
    const isAdmin =
      (user.app_metadata as Record<string, unknown> | undefined)?.['role'] === 'admin'

    if (!isAdmin) {
      // Check onboarding status — single lightweight query
      const { data: profile } = await supabase
        .from('user_profile')
        .select('onboarding_layer_1_done')
        .eq('user_id', user.id)
        .single()

      // profile may be null if the trigger hasn't run yet (race on first auth)
      // In that case let the app layout handle it
      if (profile !== null && !profile.onboarding_layer_1_done) {
        return NextResponse.redirect(new URL('/onboarding', request.url))
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
