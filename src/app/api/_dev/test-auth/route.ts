import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { randomUUID } from 'crypto'

/**
 * DEV ONLY: Test Authentication API
 *
 * Creates and manages test users for integration testing.
 * This endpoint should only be available in development/test environments.
 *
 * POST - Create a test user with session
 * DELETE - Remove a test user and their sessions
 *
 * For admin/owner testing, you need to set these env vars:
 * - TEST_ADMIN_DISCORD_ID: Discord ID to use for test admin users
 * - TEST_OWNER_DISCORD_ID: Discord ID to use for test owner users
 *
 * These should match values in ADMIN_DISCORD_IDS and OWNER_DISCORD_IDS
 */

// Only allow in development
const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'

/**
 * POST /api/_dev/test-auth
 * Create a test user and session for testing
 */
export async function POST(request: NextRequest) {
  if (!isDev) {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { role = 'user', username, email } = body

    // Generate unique identifiers
    const userId = randomUUID()
    const sessionToken = randomUUID()
    const baseDiscordId = `test_discord_${Date.now()}`

    // Create user
    const user = await prisma.user.create({
      data: {
        id: userId,
        name: username || `test_user_${Date.now()}`,
        email: email || `test-${Date.now()}@crit-fumble.test`,
        emailVerified: new Date(),
      },
    })

    // Determine Discord ID based on role
    // For testing, we need to use Discord IDs that are in ADMIN_DISCORD_IDS or OWNER_DISCORD_IDS
    let providerAccountId = baseDiscordId
    let effectiveRole = 'user'

    if (role === 'owner') {
      // Use TEST_OWNER_DISCORD_ID or first OWNER_DISCORD_IDS entry
      const testOwnerId = process.env.TEST_OWNER_DISCORD_ID
      const ownerIds = process.env.OWNER_DISCORD_IDS?.split(',').map(id => id.trim()).filter(Boolean)
      providerAccountId = testOwnerId || (ownerIds && ownerIds[0]) || `test_owner_${Date.now()}`
      effectiveRole = 'owner'
    } else if (role === 'admin') {
      // Use TEST_ADMIN_DISCORD_ID or first ADMIN_DISCORD_IDS entry
      const testAdminId = process.env.TEST_ADMIN_DISCORD_ID
      const adminIds = process.env.ADMIN_DISCORD_IDS?.split(',').map(id => id.trim()).filter(Boolean)
      providerAccountId = testAdminId || (adminIds && adminIds[0]) || `test_admin_${Date.now()}`
      effectiveRole = 'admin'
    }

    // Create account (Discord OAuth link)
    await prisma.account.create({
      data: {
        userId: user.id,
        type: 'oauth',
        provider: 'discord',
        providerAccountId,
        access_token: `test_access_${sessionToken}`,
        token_type: 'Bearer',
        scope: 'identify email',
      },
    })

    // Create session
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        sessionToken,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    })

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
  if (!isDev) {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { playerId, userId } = body

    const targetUserId = playerId || userId

    if (!targetUserId) {
      return NextResponse.json({ error: 'Missing userId or playerId' }, { status: 400 })
    }

    // Delete sessions first
    await prisma.session.deleteMany({
      where: { userId: targetUserId },
    })

    // Delete accounts
    await prisma.account.deleteMany({
      where: { userId: targetUserId },
    })

    // Delete user
    await prisma.user.delete({
      where: { id: targetUserId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting test user:', error)
    return NextResponse.json({ error: 'Failed to delete test user' }, { status: 500 })
  }
}
