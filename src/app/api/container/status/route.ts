import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import type { ContainerStatusResponse } from '@crit-fumble/core/types'

const CORE_API_URL = process.env.CORE_API_URL || 'https://core.crit-fumble.com'
const CORE_API_SECRET = process.env.CORE_API_SECRET

/**
 * GET /api/container/status
 *
 * Get container status for a guild+channel.
 * Query params: guildId, channelId
 * Admin-only: Container management is restricted to administrators.
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const guildId = searchParams.get('guildId')
    const channelId = searchParams.get('channelId')

    if (!guildId || !channelId) {
      return NextResponse.json(
        { error: 'Missing guildId or channelId' },
        { status: 400 }
      )
    }

    const url = new URL(`${CORE_API_URL}/api/container/status`)
    url.searchParams.set('guildId', guildId)
    url.searchParams.set('channelId', channelId)

    const response = await fetch(url.toString(), {
      headers: {
        'X-Core-Secret': CORE_API_SECRET,
        'X-User-Id': admin.userId,
        'X-Guild-Id': guildId,
        'X-Channel-Id': channelId,
      },
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: data.error || 'Failed to get status' },
        { status: response.status }
      )
    }

    const data: ContainerStatusResponse = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[container] Status error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    )
  }
}
