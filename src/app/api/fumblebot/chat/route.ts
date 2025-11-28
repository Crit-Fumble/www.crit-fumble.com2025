import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserDiscordId } from '@/lib/permissions'
import { chatRateLimiter, checkRateLimit, getClientIdentifier } from '@/lib/rate-limit'

/**
 * POST /api/fumblebot/chat
 * Proxy chat messages to FumbleBot's HTTP API
 *
 * Authentication: Dual-factor
 * 1. User must be logged in via Discord OAuth (session)
 * 2. Request to FumbleBot includes BOT_API_SECRET + user's Discord ID
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

    // Get user's Discord ID
    const discordId = await getUserDiscordId(session.user.id)
    if (!discordId) {
      return NextResponse.json(
        { error: 'Discord account not linked' },
        { status: 400 }
      )
    }

    // Parse the message from request body
    const body = await request.json()
    const { message, sessionId } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Check FumbleBot API URL is configured
    const fumbleBotUrl = process.env.FUMBLEBOT_API_URL
    if (!fumbleBotUrl) {
      console.error('FUMBLEBOT_API_URL not configured')
      return NextResponse.json(
        { error: 'Chat service unavailable' },
        { status: 503 }
      )
    }

    // Forward to FumbleBot with dual-factor auth
    const response = await fetch(`${fumbleBotUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Bot-Secret': process.env.BOT_API_SECRET || '',
        'X-Discord-User-Id': discordId,
      },
      body: JSON.stringify({
        message,
        sessionId,
        // Include user info for context
        user: {
          discordId,
          name: session.user.name,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('FumbleBot API error:', response.status, errorText)
      return NextResponse.json(
        { error: 'Chat service error' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in chat API:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/fumblebot/chat
 * Get chat history for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const discordId = await getUserDiscordId(session.user.id)
    if (!discordId) {
      return NextResponse.json(
        { error: 'Discord account not linked' },
        { status: 400 }
      )
    }

    const fumbleBotUrl = process.env.FUMBLEBOT_API_URL
    if (!fumbleBotUrl) {
      return NextResponse.json(
        { error: 'Chat service unavailable' },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    const response = await fetch(
      `${fumbleBotUrl}/api/chat/history?sessionId=${sessionId || ''}`,
      {
        headers: {
          'X-Bot-Secret': process.env.BOT_API_SECRET || '',
          'X-Discord-User-Id': discordId,
        },
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch history' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching chat history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    )
  }
}
