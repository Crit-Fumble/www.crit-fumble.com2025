import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { mockAuthStores } from '@/lib/mock-auth-stores'

/**
 * DEV ONLY: Test Authentication API
 *
 * Creates and manages test users for integration testing.
 * This endpoint is ONLY available when:
 * 1. NODE_ENV is 'development' or 'test', OR
 * 2. VERCEL_ENV is 'preview' (staging deployments), AND
 * 3. A valid TEST_AUTH_SECRET is provided in the request header
 *
 * Production deployments (VERCEL_ENV=production) are ALWAYS blocked.
 *
 * In mock mode (USE_MOCK_AUTH=true), uses the shared mock stores from CoreAdapter.
 * This ensures Auth.js session validation finds the test users created here.
 *
 * In non-mock mode, proxies to Core API for user/session management.
 *
 * POST - Create a test user with session
 * DELETE - Remove a test user and their sessions
 */

const CORE_API_URL = process.env.CORE_API_URL
const CORE_API_SECRET = process.env.CORE_API_SECRET
const TEST_AUTH_SECRET = process.env.TEST_AUTH_SECRET
const USE_MOCK_AUTH = process.env.USE_MOCK_AUTH === 'true'

// Local index for cleanup (maps userId -> sessionToken)
const testUserIndex = new Map<string, string>()

/**
 * Check if the environment allows test auth
 * - Production is ALWAYS blocked (Vercel production or explicit PRODUCTION=true)
 * - Staging/preview requires TEST_AUTH_SECRET header
 * - Local dev/test is allowed
 */
function isTestAuthAllowed(request: NextRequest): { allowed: boolean; reason?: string } {
  const vercelEnv = process.env.VERCEL_ENV
  const nodeEnv = process.env.NODE_ENV
  const isProduction = process.env.PRODUCTION === 'true'

  // ALWAYS block production deployments
  if (vercelEnv === 'production' || isProduction) {
    return { allowed: false, reason: 'Production deployments are blocked' }
  }

  // Local development/test - allow without secret
  if (nodeEnv === 'development' || nodeEnv === 'test') {
    return { allowed: true }
  }

  // Staging/preview deployments - require secret header
  if (vercelEnv === 'preview') {
    const providedSecret = request.headers.get('X-Test-Auth-Secret')
    if (!TEST_AUTH_SECRET) {
      return { allowed: false, reason: 'TEST_AUTH_SECRET not configured' }
    }
    if (providedSecret !== TEST_AUTH_SECRET) {
      return { allowed: false, reason: 'Invalid or missing X-Test-Auth-Secret header' }
    }
    return { allowed: true }
  }

  // Default deny for unknown environments
  return { allowed: false, reason: 'Unknown environment' }
}

async function coreRequest<T>(path: string, options: RequestInit = {}): Promise<T | null> {
  if (!CORE_API_URL || !CORE_API_SECRET) {
    throw new Error('CORE_API_URL and CORE_API_SECRET must be configured')
  }

  const res = await fetch(`${CORE_API_URL}/api/auth${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Core-Secret': CORE_API_SECRET,
      ...options.headers,
    },
  })

  if (!res.ok) {
    if (res.status === 404) return null
    throw new Error(`Core API request failed: ${res.status}`)
  }

  const text = await res.text()
  if (!text) return null
  return JSON.parse(text)
}

/**
 * POST /api/_dev/test-auth
 * Create a test user and session for testing
 */
export async function POST(request: NextRequest) {
  const authCheck = isTestAuthAllowed(request)
  if (!authCheck.allowed) {
    return NextResponse.json(
      { error: 'Not available', reason: authCheck.reason },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { role = 'user', username, email } = body

    // Generate unique identifiers
    const sessionToken = randomUUID()
    const providerAccountId = `test_discord_${Date.now()}`

    // Determine if user should be admin
    // Accept 'owner' for backwards compatibility, but treat as admin
    const isAdmin = role === 'admin' || role === 'owner'

    // Mock mode: use shared mock stores from CoreAdapter
    // This ensures Auth.js can find the user when validating the session cookie
    if (USE_MOCK_AUTH) {
      const userName = username || `test_user_${Date.now()}`
      const userEmail = email || `test-${Date.now()}@crit-fumble.test`

      // Create user in shared mock store (matches AdapterUser interface)
      mockAuthStores.users.create({
        id: providerAccountId,
        name: userName,
        email: userEmail,
        emailVerified: new Date(),
        image: null,
        isAdmin,
      })

      // Create account link in shared mock store
      mockAuthStores.accounts.link({
        userId: providerAccountId,
        type: 'oauth',
        provider: 'discord',
        providerAccountId,
        access_token: `test_access_${sessionToken}`,
        token_type: 'Bearer',
        scope: 'identify email',
      })

      // Create session in shared mock store
      mockAuthStores.sessions.create({
        sessionToken,
        userId: providerAccountId,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      })

      // Track for cleanup
      testUserIndex.set(providerAccountId, sessionToken)

      return NextResponse.json({
        userId: providerAccountId,
        username: userName,
        email: userEmail,
        sessionToken,
        isAdmin,
        discordId: providerAccountId,
      })
    }

    // Create user via Core API
    const user = await coreRequest<{ id: string; name: string; email: string }>('/user', {
      method: 'POST',
      body: JSON.stringify({
        id: providerAccountId, // Use Discord ID as user ID
        name: username || `test_user_${Date.now()}`,
        email: email || `test-${Date.now()}@crit-fumble.test`,
        emailVerified: new Date(),
      }),
    })

    if (!user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // Create account (Discord OAuth link) via Core API
    await coreRequest('/account', {
      method: 'POST',
      body: JSON.stringify({
        userId: user.id,
        type: 'oauth',
        provider: 'discord',
        providerAccountId,
        access_token: `test_access_${sessionToken}`,
        token_type: 'Bearer',
        scope: 'identify email',
      }),
    })

    // Create session via Core API
    const session = await coreRequest<{ sessionToken: string }>('/session', {
      method: 'POST',
      body: JSON.stringify({
        userId: user.id,
        sessionToken,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      }),
    })

    if (!session) {
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }

    return NextResponse.json({
      userId: user.id,
      username: user.name,
      email: user.email,
      sessionToken: session.sessionToken,
      isAdmin,
      discordId: providerAccountId,
    })
  } catch (error) {
    console.error('Error creating test user:', error)
    return NextResponse.json({ error: 'Failed to create test user' }, { status: 500 })
  }
}

/**
 * DELETE /api/_dev/test-auth
 * Delete a test user and all their data
 */
export async function DELETE(request: NextRequest) {
  const authCheck = isTestAuthAllowed(request)
  if (!authCheck.allowed) {
    return NextResponse.json(
      { error: 'Not available', reason: authCheck.reason },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { playerId, userId } = body

    const targetUserId = playerId || userId

    if (!targetUserId) {
      return NextResponse.json({ error: 'Missing userId or playerId' }, { status: 400 })
    }

    // Mock mode: remove from shared mock stores
    if (USE_MOCK_AUTH) {
      const sessionToken = testUserIndex.get(targetUserId)
      if (sessionToken) {
        mockAuthStores.sessions.delete(sessionToken)
        mockAuthStores.accounts.unlink('discord', targetUserId)
        mockAuthStores.users.delete(targetUserId)
        testUserIndex.delete(targetUserId)
      }
      return NextResponse.json({ success: true })
    }

    // Delete user via Core API (cascades to sessions and accounts)
    await coreRequest(`/user/${encodeURIComponent(targetUserId)}`, {
      method: 'DELETE',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting test user:', error)
    return NextResponse.json({ error: 'Failed to delete test user' }, { status: 500 })
  }
}

/**
 * GET /api/_dev/test-auth
 * Get mock user by session token (for mock auth validation)
 */
export async function GET(request: NextRequest) {
  const authCheck = isTestAuthAllowed(request)
  if (!authCheck.allowed) {
    return NextResponse.json(
      { error: 'Not available', reason: authCheck.reason },
      { status: 403 }
    )
  }

  // Only available in mock mode
  if (!USE_MOCK_AUTH) {
    return NextResponse.json({ error: 'Mock mode not enabled' }, { status: 400 })
  }

  const sessionToken = request.nextUrl.searchParams.get('sessionToken')
  if (!sessionToken) {
    return NextResponse.json({ error: 'Missing sessionToken' }, { status: 400 })
  }

  // Look up session and user in shared mock stores
  const result = mockAuthStores.sessions.getWithUser(sessionToken)
  if (!result) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const { user } = result
  return NextResponse.json({
    userId: user.id,
    username: user.name,
    email: user.email,
    isAdmin: user.isAdmin ?? false,
    discordId: user.id, // In mock mode, userId is the Discord ID
  })
}
