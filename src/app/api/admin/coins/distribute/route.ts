import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserPermissions, isAdminOrOwner } from '@/lib/permissions'
import {
  grantMonthlyCoinsToAll,
  getEligibleUsersForMonthlyCoins,
  grantMonthlyCoins,
} from '@/lib/coin-distribution'

/**
 * POST /api/admin/coins/distribute
 * Manually trigger monthly coin distribution to all eligible users
 * Admin only - should normally be run as a cron job
 */
export async function POST(req: NextRequest) {
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

    console.log(`[Admin] ${adminUser.id} triggered monthly coin distribution`)

    // Run distribution
    const result = await grantMonthlyCoinsToAll()

    return NextResponse.json({
      success: true,
      ...result,
      message: `Distributed coins to ${result.granted} out of ${result.processed} eligible users`,
    })
  } catch (error) {
    console.error('Error distributing monthly coins:', error)
    return NextResponse.json(
      { error: 'Failed to distribute monthly coins' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/coins/distribute
 * Get list of users eligible for monthly coins (without distributing)
 * Admin only
 */
export async function GET(req: NextRequest) {
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

    const eligibleUsers = await getEligibleUsersForMonthlyCoins()

    return NextResponse.json({
      eligible: eligibleUsers,
      count: eligibleUsers.length,
      totalCoins: eligibleUsers.reduce((sum, user) => sum + user.monthlyCoins, 0),
    })
  } catch (error) {
    console.error('Error fetching eligible users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch eligible users' },
      { status: 500 }
    )
  }
}
