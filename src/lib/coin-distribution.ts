import { prisma } from '@/packages/cfg-lib/db'
import { getMonthlyCoins } from './permissions'
import type { UserTier } from '@prisma/client'

/**
 * Check if a user is eligible for monthly coins (hasn't received this month yet)
 */
export async function isEligibleForMonthlyCoins(userId: string): Promise<boolean> {
  const user = await prisma.critUser.findUnique({
    where: { id: userId },
    select: {
      tier: true,
      lastMonthlyCoinsGranted: true,
    },
  })

  if (!user) return false

  // Get monthly coin amount for their tier
  const monthlyCoins = getMonthlyCoins(user.tier)

  // If tier doesn't grant coins, not eligible
  if (monthlyCoins <= 0) return false

  // If never granted before, eligible
  if (!user.lastMonthlyCoinsGranted) return true

  // Check if it's been a month since last grant
  const lastGrant = new Date(user.lastMonthlyCoinsGranted)
  const now = new Date()

  // Check if we're in a different month/year
  const isDifferentMonth =
    lastGrant.getMonth() !== now.getMonth() ||
    lastGrant.getFullYear() !== now.getFullYear()

  return isDifferentMonth
}

/**
 * Grant monthly coins to a user
 */
export async function grantMonthlyCoins(
  userId: string
): Promise<{ success: boolean; coins?: number; error?: string }> {
  try {
    const user = await prisma.critUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        tier: true,
        lastMonthlyCoinsGranted: true,
      },
    })

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Check eligibility
    const eligible = await isEligibleForMonthlyCoins(userId)
    if (!eligible) {
      return {
        success: false,
        error: 'Not eligible for monthly coins (already received this month or tier does not grant coins)',
      }
    }

    // Get coin amount
    const monthlyCoins = getMonthlyCoins(user.tier)

    // Create coin transaction
    await prisma.critCoinTransaction.create({
      data: {
        playerId: userId,
        amount: monthlyCoins,
        transactionType: 'credit',
        description: `Monthly tier bonus (${user.tier})`,
        metadata: {
          source: 'monthly_tier_grant',
          tier: user.tier,
          grantedAt: new Date().toISOString(),
        },
      },
    })

    // Update last granted timestamp
    await prisma.critUser.update({
      where: { id: userId },
      data: {
        lastMonthlyCoinsGranted: new Date(),
      },
    })

    return { success: true, coins: monthlyCoins }
  } catch (error) {
    console.error('Error granting monthly coins:', error)
    return { success: false, error: 'Failed to grant monthly coins' }
  }
}

/**
 * Grant monthly coins to all eligible users
 * Should be run as a cron job (e.g., once per day)
 */
export async function grantMonthlyCoinsToAll(): Promise<{
  processed: number
  granted: number
  errors: number
}> {
  let processed = 0
  let granted = 0
  let errors = 0

  try {
    // Get all users with tiers that grant coins
    const users = await prisma.critUser.findMany({
      where: {
        tier: {
          in: ['LEGACY'], // Add other tiers here when they grant positive coins
        },
        isActive: true,
      },
      select: {
        id: true,
        tier: true,
        username: true,
      },
    })

    console.log(`[CoinDistribution] Found ${users.length} users with coin-granting tiers`)

    for (const user of users) {
      processed++

      // Check eligibility
      const eligible = await isEligibleForMonthlyCoins(user.id)
      if (!eligible) {
        console.log(`[CoinDistribution] User ${user.username} (${user.tier}) not eligible`)
        continue
      }

      // Grant coins
      const result = await grantMonthlyCoins(user.id)
      if (result.success) {
        granted++
        console.log(
          `[CoinDistribution] Granted ${result.coins} coins to ${user.username} (${user.tier})`
        )
      } else {
        errors++
        console.error(
          `[CoinDistribution] Failed to grant coins to ${user.username}: ${result.error}`
        )
      }
    }

    console.log(
      `[CoinDistribution] Complete: Processed ${processed}, Granted ${granted}, Errors ${errors}`
    )
  } catch (error) {
    console.error('[CoinDistribution] Fatal error:', error)
    errors++
  }

  return { processed, granted, errors }
}

/**
 * Get users who should receive monthly coins but haven't yet
 */
export async function getEligibleUsersForMonthlyCoins(): Promise<
  Array<{
    id: string
    username: string
    tier: UserTier
    monthlyCoins: number
    lastGranted: Date | null
  }>
> {
  const users = await prisma.critUser.findMany({
    where: {
      tier: {
        in: ['LEGACY'], // Add other tiers here when they grant positive coins
      },
      isActive: true,
    },
    select: {
      id: true,
      username: true,
      tier: true,
      lastMonthlyCoinsGranted: true,
    },
  })

  const eligible = []

  for (const user of users) {
    const isEligible = await isEligibleForMonthlyCoins(user.id)
    if (isEligible) {
      eligible.push({
        id: user.id,
        username: user.username,
        tier: user.tier,
        monthlyCoins: getMonthlyCoins(user.tier),
        lastGranted: user.lastMonthlyCoinsGranted,
      })
    }
  }

  return eligible
}
