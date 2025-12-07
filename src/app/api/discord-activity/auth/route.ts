import { NextRequest, NextResponse } from 'next/server'

const CORE_API_URL = process.env.CORE_API_URL || 'https://core.crit-fumble.com'
const CORE_API_SECRET = process.env.CORE_API_SECRET

/**
 * POST /api/discord-activity/auth
 *
 * Exchange Discord Activity context for a session.
 * Called by the Discord Activity client after getting context from Discord SDK.
 */
export async function POST(request: NextRequest) {
  try {
    if (!CORE_API_SECRET) {
      console.error('[discord-activity] CORE_API_SECRET not configured')
      return NextResponse.json(
        { error: 'Service unavailable' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { instanceId, platform, guildId, channelId, accessToken } = body

    if (!guildId || !channelId) {
      return NextResponse.json(
        { error: 'Missing guild or channel ID' },
        { status: 400 }
      )
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Missing access token' },
        { status: 400 }
      )
    }

    console.log('[discord-activity] Authenticating user', {
      guildId,
      channelId,
      instanceId,
      platform,
    })

    // Forward auth request to Core API
    // Core API expects: { authType, discordToken, guildId?, channelId? }
    const response = await fetch(`${CORE_API_URL}/api/activity/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Core-Secret': CORE_API_SECRET,
      },
      body: JSON.stringify({
        authType: 'discord',
        discordToken: accessToken,
        guildId,
        channelId,
      }),
    })

    if (!response.ok) {
      console.error('[discord-activity] Core auth failed:', response.status)
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[discord-activity] Auth error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
