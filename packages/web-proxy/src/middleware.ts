/**
 * Middleware Utilities
 *
 * Common middleware patterns for Next.js applications.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Configuration for path-based routing middleware
 */
export interface PathRouterConfig {
  /**
   * Paths that are allowed through without redirect
   */
  allowedPaths: string[]

  /**
   * URL to redirect blocked paths to
   * @default '/'
   */
  redirectTo?: string
}

/**
 * Create a path-based routing middleware
 * Redirects all non-allowed paths to a specified URL
 *
 * @example
 * const middleware = createPathRouter({
 *   allowedPaths: ['/', '/api', '/dashboard', '/terms'],
 *   redirectTo: '/',
 * })
 *
 * export { middleware }
 */
export function createPathRouter(config: PathRouterConfig) {
  const { allowedPaths, redirectTo = '/' } = config

  return function pathRouterMiddleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Check if path is allowed
    const isAllowed = allowedPaths.some(
      (path) => pathname === path || pathname.startsWith(path + '/')
    )

    if (isAllowed) {
      return NextResponse.next()
    }

    // Redirect everything else
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }
}

/**
 * Default matcher configuration for middleware
 * Excludes static files, images, and favicon
 */
export const defaultMatcher = {
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

/**
 * Compose multiple middleware functions
 * Runs each middleware in order, stopping if one returns a response
 *
 * @example
 * const middleware = composeMiddleware([
 *   rateLimitMiddleware,
 *   authMiddleware,
 *   pathRouterMiddleware,
 * ])
 */
export function composeMiddleware(
  middlewares: Array<(request: NextRequest) => NextResponse | Promise<NextResponse>>
) {
  return async function composedMiddleware(request: NextRequest): Promise<NextResponse> {
    for (const middleware of middlewares) {
      const response = await middleware(request)
      // If middleware returns something other than next(), stop the chain
      if (response.headers.get('x-middleware-next') !== '1') {
        return response
      }
    }
    return NextResponse.next()
  }
}

/**
 * Create a rate-limited middleware wrapper
 *
 * @example
 * import { rateLimiters, checkRateLimit, getIpAddress, getClientIdentifier } from '@crit-fumble/web-proxy/rate-limit'
 *
 * const middleware = createRateLimitedMiddleware({
 *   limiter: rateLimiters.public,
 *   getIdentifier: (req) => getClientIdentifier(undefined, getIpAddress(req)),
 * })
 */
export interface RateLimitMiddlewareConfig {
  /**
   * Rate limiter to use
   */
  limiter: {
    consume: (key: string) => Promise<unknown>
  }

  /**
   * Function to get the client identifier from the request
   */
  getIdentifier: (request: NextRequest) => string

  /**
   * Custom response when rate limited
   */
  onRateLimited?: (retryAfter: number) => NextResponse
}

export function createRateLimitedMiddleware(config: RateLimitMiddlewareConfig) {
  const { limiter, getIdentifier, onRateLimited } = config

  return async function rateLimitMiddleware(request: NextRequest): Promise<NextResponse> {
    const identifier = getIdentifier(request)

    try {
      await limiter.consume(identifier)
      return NextResponse.next()
    } catch (error: unknown) {
      // Rate limit exceeded
      const msBeforeNext = (error as { msBeforeNext?: number })?.msBeforeNext ?? 60000
      const retryAfter = Math.ceil(msBeforeNext / 1000)

      if (onRateLimited) {
        return onRateLimited(retryAfter)
      }

      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString(),
          },
        }
      )
    }
  }
}
