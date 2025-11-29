import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import type { ContainerStartRequest, ContainerStartResponse } from '@crit-fumble/core/types'

const CORE_API_URL = process.env.CORE_API_URL || 'https://core.crit-fumble.com'
const CORE_API_SECRET = process.env.CORE_API_SECRET

/**
 * POST /api/container/start
 *
 * Start a container for a guild+channel.
 * Proxies to Core API with session auth.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!CORE_API_SECRET) {
      console.error('[container] CORE_API_SECRET not configured')
      return NextResponse.json(
        { error: 'Service unavailable' },
        { status: 503 }
      )
    }

    const body: ContainerStartRequest = await request.json()
    const { guildId, channelId } = body

    if (!guildId || !channelId) {
      return NextResponse.json(
        { error: 'Missing guildId or channelId' },
        { status: 400 }
      )
    }

    // Forward to Core API
    const response = await fetch(`${CORE_API_URL}/api/container/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Core-Secret': CORE_API_SECRET,
        'X-User-Id': session.user.id,
        'X-User-Name': session.user.name || 'User',
        'X-Guild-Id': guildId,
        'X-Channel-Id': channelId,
      },
      body: JSON.stringify({ guildId, channelId }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      console.error('[container] Start failed:', response.status, data)
      return NextResponse.json(
        { error: data.error || 'Failed to start container' },
        { status: response.status }
      )
    }

    const data: ContainerStartResponse = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[container] Start error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json(
      { error: 'Failed to start container' },
      { status: 500 }
    )
  }
}
