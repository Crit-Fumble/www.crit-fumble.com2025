import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserRole } from '@/lib/permissions'
import { verifyBotAuth } from '@/lib/bot-auth'
import { apiRateLimiter, checkRateLimit, getClientIdentifier, getIpAddress } from '@/lib/rate-limit'

/**
 * Core API Proxy
 *
 * Proxies authenticated requests from www.crit-fumble.com to core.crit-fumble.com.
 * The core API runs on a separate server with Caddy/Docker.
 *
 * Security features:
 * - Session auth (for web users) or Bot auth (for FumbleBot)
 * - Rate limiting on all requests
 * - Query parameter whitelist
 * - Required CORE_API_SECRET in production
 * - Security headers on responses
 */

const CORE_API_URL = process.env.CORE_API_URL || 'https://core.crit-fumble.com'
const CORE_API_SECRET = process.env.CORE_API_SECRET
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

// Allowed query parameters (whitelist)
const ALLOWED_QUERY_PARAMS = new Set([
  // Pagination
  'page', 'limit', 'offset', 'skip', 'take',
  // Sorting
  'sort', 'sortBy', 'sortOrder', 'order',
  // Filtering
  'filter', 'search', 'query', 'q',
  'category', 'slug', 'id',
  // Relations
  'include', 'select', 'expand',
  // Publishing
  'published', 'isPublished', 'includeDeleted',
  // Auth (for getUserByAccount)
  'provider', 'providerAccountId', 'email',
])

// Validate query parameter values (alphanumeric, dash, underscore, comma, dot, @)
const SAFE_PARAM_VALUE = /^[a-zA-Z0-9_,.@-]+$/

interface RouteParams {
  params: Promise<{ path: string[] }>
}

/**
 * Validate and filter query parameters
 */
function sanitizeQueryParams(searchParams: URLSearchParams): URLSearchParams {
  const sanitized = new URLSearchParams()

  searchParams.forEach((value, key) => {
    // Only allow whitelisted params with safe values
    if (ALLOWED_QUERY_PARAMS.has(key) && SAFE_PARAM_VALUE.test(value)) {
      sanitized.set(key, value)
    }
  })

  return sanitized
}

/**
 * Forward a request to the core API
 */
async function forwardToCore(
  request: NextRequest,
  path: string[],
  authInfo: { userId: string; role: string; discordId?: string }
): Promise<NextResponse> {
  // Validate CORE_API_SECRET in production
  if (IS_PRODUCTION && !CORE_API_SECRET) {
    console.error('[core-proxy] CORE_API_SECRET not configured in production')
    return NextResponse.json(
      { error: 'Service configuration error' },
      { status: 503 }
    )
  }

  const targetPath = path.join('/')
  const targetUrl = new URL(targetPath, CORE_API_URL)

  // Sanitize and forward only allowed query parameters
  const sanitizedParams = sanitizeQueryParams(request.nextUrl.searchParams)
  sanitizedParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value)
  })

  // Build headers for the core API
  const headers: Record<string, string> = {
    'Content-Type': request.headers.get('Content-Type') || 'application/json',
    'Accept': request.headers.get('Accept') || 'application/json',
    // Auth headers for the core API
    'X-User-Id': authInfo.userId,
    'X-User-Role': authInfo.role,
  }

  if (authInfo.discordId) {
    headers['X-Discord-Id'] = authInfo.discordId
  }

  // Add shared secret for server-to-server auth
  if (CORE_API_SECRET) {
    headers['X-Core-Secret'] = CORE_API_SECRET
  }

  // Forward the request body for non-GET requests
  let body: string | undefined
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.text()
  }

  try {
    const response = await fetch(targetUrl.toString(), {
      method: request.method,
      headers,
      body,
    })

    // Get response data
    const responseBody = await response.text()
    const contentType = response.headers.get('Content-Type') || 'application/json'

    // Forward the response with security headers
    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      },
    })
  } catch (error) {
    // Log without exposing sensitive details
    console.error('[core-proxy] Connection error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 502 }
    )
  }
}

/**
 * Authenticate the request and return user info
 */
async function authenticateRequest(request: NextRequest): Promise<
  | { success: true; userId: string; role: string; discordId?: string }
  | { success: false; response: NextResponse }
> {
  // Check bot auth first
  const botAuth = verifyBotAuth(request)

  if (botAuth) {
    // Bot is authenticated
    return {
      success: true,
      userId: `bot:${botAuth.discordId}`,
      role: botAuth.role,
      discordId: botAuth.discordId,
    }
  }

  // Check session auth
  const session = await auth()
  if (!session?.user?.id) {
    return {
      success: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  // Get user role
  const userRole = await getUserRole(session.user.id)

  return {
    success: true,
    userId: session.user.id,
    role: userRole.role,
    discordId: userRole.discordId || undefined,
  }
}

/**
 * Apply rate limiting
 */
async function applyRateLimit(request: NextRequest): Promise<NextResponse | null> {
  const ip = getIpAddress(request)
  const identifier = getClientIdentifier(undefined, ip)
  const result = await checkRateLimit(apiRateLimiter, identifier)

  if (!result.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(result.retryAfter) } }
    )
  }

  return null
}

/**
 * GET /api/core/[...path]
 * Proxy GET requests to core API (with rate limiting)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  // Rate limit GET requests too (prevents enumeration/DoS)
  const rateLimitResponse = await applyRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  const authResult = await authenticateRequest(request)
  if (!authResult.success) {
    return authResult.response
  }

  const { path } = await params
  return forwardToCore(request, path, authResult)
}

/**
 * POST /api/core/[...path]
 * Proxy POST requests to core API
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const rateLimitResponse = await applyRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  const authResult = await authenticateRequest(request)
  if (!authResult.success) {
    return authResult.response
  }

  const { path } = await params
  return forwardToCore(request, path, authResult)
}

/**
 * PATCH /api/core/[...path]
 * Proxy PATCH requests to core API
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const rateLimitResponse = await applyRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  const authResult = await authenticateRequest(request)
  if (!authResult.success) {
    return authResult.response
  }

  const { path } = await params
  return forwardToCore(request, path, authResult)
}

/**
 * PUT /api/core/[...path]
 * Proxy PUT requests to core API
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const rateLimitResponse = await applyRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  const authResult = await authenticateRequest(request)
  if (!authResult.success) {
    return authResult.response
  }

  const { path } = await params
  return forwardToCore(request, path, authResult)
}

/**
 * DELETE /api/core/[...path]
 * Proxy DELETE requests to core API
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const rateLimitResponse = await applyRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  const authResult = await authenticateRequest(request)
  if (!authResult.success) {
    return authResult.response
  }

  const { path } = await params
  return forwardToCore(request, path, authResult)
}
