import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import type { ContainerExecRequest, ContainerExecResponse } from '@crit-fumble/core/types'

const CORE_API_URL = process.env.CORE_API_URL || 'https://core.crit-fumble.com'
const CORE_API_SECRET = process.env.CORE_API_SECRET

// Limit command length for security
const MAX_COMMAND_LENGTH = 1000

/**
 * POST /api/container/exec
 *
 * Execute a command in a container.
 * Used for MCP tool integration - one-shot command execution.
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

    const body: ContainerExecRequest = await request.json()
    const { guildId, channelId, command, timeout } = body

    if (!guildId || !channelId) {
      return NextResponse.json(
        { error: 'Missing guildId or channelId' },
        { status: 400 }
      )
    }

    if (!command || typeof command !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid command' },
        { status: 400 }
      )
    }

    if (command.length > MAX_COMMAND_LENGTH) {
      return NextResponse.json(
        { error: `Command too long (max ${MAX_COMMAND_LENGTH} characters)` },
        { status: 400 }
      )
    }

    const response = await fetch(`${CORE_API_URL}/api/container/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Core-Secret': CORE_API_SECRET,
        'X-User-Id': session.user.id,
        'X-User-Name': session.user.name || 'User',
        'X-Guild-Id': guildId,
        'X-Channel-Id': channelId,
      },
      body: JSON.stringify({
        guildId,
        channelId,
        command,
        timeout: timeout || 30000,
      }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: data.error || 'Failed to execute command' },
        { status: response.status }
      )
    }

    const data: ContainerExecResponse = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[container] Exec error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json(
      { error: 'Failed to execute command' },
      { status: 500 }
    )
  }
}
