import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

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
 * Proxies to Core API for user/session management.
 *
 * POST - Create a test user with session
 * DELETE - Remove a test user and their sessions
 */

const CORE_API_URL = process.env.CORE_API_URL
const CORE_API_SECRET = process.env.CORE_API_SECRET
const TEST_AUTH_SECRET = process.env.TEST_AUTH_SECRET

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
    const baseDiscordId = `test_discord_${Date.now()}`

    // Determine Discord ID based on role
    let providerAccountId = baseDiscordId
    let effectiveRole = 'user'

    if (role === 'owner') {
      const testOwnerId = process.env.TEST_OWNER_DISCORD_ID
      const ownerIds = process.env.OWNER_DISCORD_IDS?.split(',').map(id => id.trim()).filter(Boolean)
      providerAccountId = testOwnerId || (ownerIds && ownerIds[0]) || `test_owner_${Date.now()}`
      effectiveRole = 'owner'
    } else if (role === 'admin') {
      const testAdminId = process.env.TEST_ADMIN_DISCORD_ID
      const adminIds = process.env.ADMIN_DISCORD_IDS?.split(',').map(id => id.trim()).filter(Boolean)
      providerAccountId = testAdminId || (adminIds && adminIds[0]) || `test_admin_${Date.now()}`
      effectiveRole = 'admin'
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
      role: effectiveRole,
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
