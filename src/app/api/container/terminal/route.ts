import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

const CORE_API_URL = process.env.CORE_API_URL || 'https://core.crit-fumble.com'

/**
 * GET /api/container/terminal
 *
 * Returns WebSocket URL for terminal connection.
 * The client connects directly to Core's WebSocket endpoint.
 * Admin-only: Terminal access is restricted to administrators.
 *
 * Note: Vercel serverless doesn't support WebSocket upgrade.
 * The client should connect directly to the Core WebSocket URL.
 */
export async function GET(request: NextRequest) {
  // Verify user is admin
  const admin = await requireAdmin()
  if (admin instanceof NextResponse) return admin

  const { searchParams } = new URL(request.url)
  const guildId = searchParams.get('guildId')
  const channelId = searchParams.get('channelId')

  if (!guildId || !channelId) {
    return NextResponse.json(
      { error: 'Missing guildId or channelId' },
      { status: 400 }
    )
  }

  // Return the WebSocket URL for direct connection
  const wsUrl = CORE_API_URL.replace('https://', 'wss://').replace('http://', 'ws://')
  const terminalUrl = `${wsUrl}/api/container/terminal?guildId=${guildId}&channelId=${channelId}`

  return NextResponse.json({
    wsUrl: terminalUrl,
    message: 'Connect to this WebSocket URL for terminal access',
  })
}
