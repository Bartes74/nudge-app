import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middleware-client'

/**
 * Middleware runs on every matched request.
 * Responsibilities:
 * 1. Refresh the Supabase session cookie so it never silently expires.
 * 2. Redirect unauthenticated users away from /app/* → /signin.
 * 3. Redirect authenticated users away from auth pages → /app.
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request })
  const supabase = createMiddlewareClient(request, response)

  // Refresh session — MUST be called before checking the user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Protected routes — require auth
  if (pathname.startsWith('/app')) {
    if (!user) {
      const redirectUrl = new URL('/signin', request.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    return response
  }

  // Auth pages — redirect logged-in users to the app
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
