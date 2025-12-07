import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import type { SessionUser } from '@/lib/permissions'
import { chatRateLimiter, checkRateLimit, getClientIdentifier } from '@/lib/rate-limit'

// Message validation constants
const MAX_MESSAGE_LENGTH = 2000
const SESSION_ID_PATTERN = /^[a-zA-Z0-9_-]+$/

const CORE_API_URL = process.env.CORE_API_URL || 'https://core.crit-fumble.com'
const CORE_API_SECRET = process.env.CORE_API_SECRET

/**
 * POST /api/fumblebot/chat
 * Proxy chat messages to Core API (which forwards to FumbleBot)
 *
 * Authentication:
 * 1. User must be logged in via Discord OAuth (session)
 * 2. Request to Core includes CORE_API_SECRET + user's Discord ID
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit by user ID
    const identifier = getClientIdentifier(session.user.id)
    const rateLimitResult = await checkRateLimit(chatRateLimiter, identifier)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many messages. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter) } }
      )
    }

    // Get user's Discord ID from session
    const user = session.user as SessionUser
    const discordId = user.discordId
    if (!discordId) {
      return NextResponse.json(
        { error: 'Discord account not linked' },
        { status: 400 }
      )
    }

    // Parse the message from request body
    const body = await request.json()
    const { message, sessionId } = body

    // Validate message
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)` },
        { status: 400 }
      )
    }

    // Validate sessionId if provided
    if (sessionId && (typeof sessionId !== 'string' || !SESSION_ID_PATTERN.test(sessionId))) {
      return NextResponse.json(
        { error: 'Invalid session ID format' },
        { status: 400 }
      )
    }

    // Check Core API secret is configured
    if (!CORE_API_SECRET) {
      console.error('[fumblebot] CORE_API_SECRET not configured')
      return NextResponse.json(
        { error: 'Chat service unavailable' },
        { status: 503 }
      )
    }

    // Forward to Core API (which proxies to FumbleBot)
    const response = await fetch(`${CORE_API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Core-Secret': CORE_API_SECRET,
        'X-Discord-User-Id': discordId,
      },
      body: JSON.stringify({
        message,
        sessionId,
        user: {
          discordId,
          name: session.user.name,
        },
      }),
    })

    if (!response.ok) {
      console.error('[fumblebot] Core API error:', response.status)
      return NextResponse.json(
        { error: 'Chat service error' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[fumblebot] Error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/fumblebot/chat
 * Get chat history for the current user via Core API
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit GET requests too
    const identifier = getClientIdentifier(session.user.id)
    const rateLimitResult = await checkRateLimit(chatRateLimiter, identifier)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter) } }
      )
    }

    const user = session.user as SessionUser
    const discordId = user.discordId
    if (!discordId) {
      return NextResponse.json(
        { error: 'Discord account not linked' },
        { status: 400 }
      )
    }

    if (!CORE_API_SECRET) {
      return NextResponse.json(
        { error: 'Chat service unavailable' },
        { status: 503 }
      )
    }

    // Validate and sanitize sessionId
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (sessionId && !SESSION_ID_PATTERN.test(sessionId)) {
      return NextResponse.json(
        { error: 'Invalid session ID format' },
        { status: 400 }
      )
    }

    // Build URL with proper encoding
    const historyUrl = new URL(`${CORE_API_URL}/api/chat/history`)
    if (sessionId) {
      historyUrl.searchParams.set('sessionId', sessionId)
    }

    const response = await fetch(historyUrl.toString(), {
      headers: {
        'X-Core-Secret': CORE_API_SECRET,
        'X-Discord-User-Id': discordId,
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch history' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[fumblebot] Error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    )
  }
}
