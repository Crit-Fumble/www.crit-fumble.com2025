import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Proxy middleware
 *
 * Simple routing for landing page.
 * - / - Landing page
 * - /terms-of-service - Legal
 * - /privacy-policy - Legal
 * All other routes redirect to homepage.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow these paths through
  const allowedPaths = [
    '/',                    // Homepage
    '/terms-of-service',    // Legal
    '/privacy-policy',      // Legal
  ]

  // Check if path is allowed
  const isAllowed = allowedPaths.some((path) =>
    pathname === path || pathname.startsWith(path + '/')
  )

  if (isAllowed) {
    return NextResponse.next()
  }

  // Redirect everything else to homepage
  return NextResponse.redirect(new URL('/', request.url))
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - img (images)
     */
    '/((?!_next/static|_next/image|favicon.ico|img).*)',
  ],
}
