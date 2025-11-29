import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import type { ContainerStopRequest, ContainerStopResponse } from '@crit-fumble/core/types'

const CORE_API_URL = process.env.CORE_API_URL || 'https://core.crit-fumble.com'
const CORE_API_SECRET = process.env.CORE_API_SECRET

/**
 * POST /api/container/stop
 *
 * Stop a container for a guild+channel.
 * Proxies to Core API with session auth.
 */
export async function POST(request: NextRequest) {
  try {
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

    const body: ContainerStopRequest = await request.json()
    const { guildId, channelId } = body

    if (!guildId || !channelId) {
      return NextResponse.json(
        { error: 'Missing guildId or channelId' },
        { status: 400 }
      )
    }

    const response = await fetch(`${CORE_API_URL}/api/container/stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Core-Secret': CORE_API_SECRET,
        'X-User-Id': session.user.id,
        'X-Guild-Id': guildId,
        'X-Channel-Id': channelId,
      },
      body: JSON.stringify({ guildId, channelId }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: data.error || 'Failed to stop container' },
        { status: response.status }
      )
    }

    const data: ContainerStopResponse = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[container] Stop error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json(
      { error: 'Failed to stop container' },
      { status: 500 }
    )
  }
}
