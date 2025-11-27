import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { getUserPermissions, isAdminOrOwner } from '@/lib/permissions'
import type { UserTier } from '@prisma/client'

/**
 * PATCH /api/admin/users/:userId/tier
 * Update a user's tier (admin only)
 * Body: { tier: UserTier }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Check if user is admin or owner
    const adminUser = await getUserPermissions(session.user.id)
    if (!adminUser || !isAdminOrOwner(adminUser)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const { userId } = await params
    const body = await req.json()
    const { tier } = body

    if (!tier || typeof tier !== 'string') {
      return NextResponse.json({ error: 'Tier is required' }, { status: 400 })
    }

    // Validate tier value
    const validTiers: UserTier[] = ['LEGACY', 'FREE', 'PRO', 'PLUS', 'MAX']
    if (!validTiers.includes(tier as UserTier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    // Check if target user exists
    const targetUser = await prisma.critUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        tier: true,
        isOwner: true,
      },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Cannot modify owner's tier unless you are the owner
    if (targetUser.isOwner && !adminUser.isOwner) {
      return NextResponse.json(
        { error: 'Cannot modify owner tier' },
        { status: 403 }
      )
    }

    // Update tier
    const updatedUser = await prisma.critUser.update({
      where: { id: userId },
      data: { tier: tier as UserTier },
    })

    // Log the tier change
    console.log(
      `[Admin] ${adminUser.id} changed ${targetUser.username}'s tier from ${targetUser.tier} to ${tier}`
    )
    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `Tier updated to ${tier}`,
    })
  } catch (error) {
    console.error('Error updating user tier:', error)
    return NextResponse.json(
      { error: 'Failed to update user tier' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/users/:userId/tier
 * Get a user's tier (admin only)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await params
    const user = await prisma.critUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        tier: true,
        email: true,
        createdAt: true,
        lastMonthlyCoinsGranted: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user tier:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user tier' },
      { status: 500 }
    )
  }
}
