import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Proxy middleware for auth routes
 * In Next.js 16, middleware has been moved to proxy files
 */
export async function middleware(request: NextRequest) {
  const { publicRateLimiter, getIpAddress, getClientIdentifier, checkRateLimit } = await import('@/packages/cfg-lib/rate-limit')

  const ip = getIpAddress(request)
  const identifier = getClientIdentifier(undefined, ip)

  const result = await checkRateLimit(publicRateLimiter, identifier)

  if (!result.success) {
    return new NextResponse(
      JSON.stringify({
        error: 'Too many requests',
        retryAfter: result.retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': result.retryAfter.toString(),
        },
      }
    )
  }

  return NextResponse.next()
}
