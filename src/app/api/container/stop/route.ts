import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import type { ContainerStopRequest, ContainerStopResponse } from '@crit-fumble/core/types'

const CORE_API_URL = process.env.CORE_API_URL || 'https://core.crit-fumble.com'
const CORE_API_SECRET = process.env.CORE_API_SECRET

/**
 * POST /api/container/stop
 *
 * Stop a container for a guild+channel.
 * Proxies to Core API with admin auth.
 * Admin-only: Container management is restricted to administrators.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user is admin
    const admin = await requireAdmin()
    if (admin instanceof NextResponse) return admin

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
        'X-User-Id': admin.userId,
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
