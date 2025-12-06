import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Proxy middleware
 *
 * Handles subdomain routing and path restrictions.
 * - wiki.crit-fumble.com -> /wiki/*
 * - activity.crit-fumble.com -> /activity/*
 * - storybook.crit-fumble.com -> /api/storybook-proxy/*
 * - Main site: Redirect non-essential routes to homepage while site is placeholder.
 * Auth.js handles /api/auth/* routes automatically.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host = request.headers.get('host') || ''

  // Handle wiki subdomain - rewrite to /wiki routes
  if (host === 'wiki.crit-fumble.com' || host.startsWith('wiki.')) {
    const url = request.nextUrl.clone()
    // /api routes should pass through for auth
    if (pathname.startsWith('/api')) {
      return NextResponse.next()
    }
    // Rewrite root to /wiki, otherwise /wiki/path
    url.pathname = pathname === '/' ? '/wiki' : `/wiki${pathname}`
    return NextResponse.rewrite(url)
  }

  // Handle activity subdomain - rewrite to /activity routes
  if (host === 'activity.crit-fumble.com' || host.startsWith('activity.')) {
    const url = request.nextUrl.clone()
    // /api routes should pass through for auth
    if (pathname.startsWith('/api')) {
      return NextResponse.next()
    }
    // Rewrite root to /activity
    url.pathname = pathname === '/' ? '/activity' : `/activity${pathname}`
    return NextResponse.rewrite(url)
  }

  // Handle storybook subdomain - rewrite to proxy
  if (host === 'storybook.crit-fumble.com' || host.startsWith('storybook.')) {
    const url = request.nextUrl.clone()
    url.pathname = `/api/storybook-proxy${pathname}`
    return NextResponse.rewrite(url)
  }

  // Handle fumblebot subdomain - rewrite to proxy
  if (host === 'fumblebot.crit-fumble.com' || host.startsWith('fumblebot.')) {
    const url = request.nextUrl.clone()
    url.pathname = `/api/fumblebot-proxy${pathname}`
    return NextResponse.rewrite(url)
  }

  // Allow these paths through on main site
  const allowedPaths = [
    '/',                    // Homepage
    '/api',                 // API routes (including /api/auth/*)
    '/dashboard',           // Wiki editor (requires login)
    '/wiki',                // Public wiki (also accessible via subdomain)
    '/activity',            // Activity feed (also accessible via subdomain)
    '/terms-of-service',    // Legal
    '/privacy-policy',      // Legal
    '/storybook',           // Storybook viewer
    '/storybook-auth',      // Storybook auth page
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
