import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { isOwner } from '@/lib/admin';

/**
 * Conversion tiers matching Crit-Coins purchase bundles
 * Same bonus structure as buying Crit-Coins!
 */
const CONVERSION_TIERS = [
  { credits: 250, coins: 300, bonus: 50, bonusPercent: 20 },
  { credits: 200, coins: 236, bonus: 36, bonusPercent: 18 },
  { credits: 100, coins: 116, bonus: 16, bonusPercent: 16 },
  { credits: 50, coins: 57, bonus: 7, bonusPercent: 14 },
  { credits: 25, coins: 28, bonus: 3, bonusPercent: 12 },
  { credits: 10, coins: 11, bonus: 1, bonusPercent: 10 },
  { credits: 1, coins: 1, bonus: 0, bonusPercent: 0 },
];

/**
 * Find applicable tier for given Story Credits amount
 */
function getConversionTier(amount: number) {
  return CONVERSION_TIERS.find((tier) => amount >= tier.credits) || CONVERSION_TIERS[CONVERSION_TIERS.length - 1];
}

/**
 * POST /api/crit/credits/convert
 * Convert Story Credits to Crit-Coins with bonus tiers (no fee!)
 * Same bonuses as purchasing: 0%, 10%, 12%, 14%, 16%, 18%, 20%
 *
 * SECURITY: Owner-only access.
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // SECURITY: Only owners can convert story credits
    const user = await prisma.critUser.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !isOwner(user)) {
      return NextResponse.json(
        { error: 'Forbidden - Owner access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { amount } = body;

    // SECURITY: Use authenticated user's ID, not client-provided
    const userId = session.user.id;

    // Validate required fields
    if (!amount) {
      return NextResponse.json(
        { error: 'Missing required field: amount' },
        { status: 400 }
      );
    }

    // Validate minimum amount
    if (amount < 1) {
      return NextResponse.json(
        { error: 'Minimum conversion is 1 Story Credit' },
        { status: 400 }
      );
    }

    // Get current Story Credits balance
    const latestStoryCredit = await prisma.storyCreditTransaction.findFirst({
      where: { playerId: userId },
      orderBy: { createdAt: 'desc' }
    });

    const currentStoryCredits = latestStoryCredit?.balanceAfter.toNumber() ?? 0;

    // Check sufficient balance
    if (currentStoryCredits < amount) {
      return NextResponse.json(
        {
          error: 'Insufficient Story Credits',
          currentBalance: currentStoryCredits,
          requestedAmount: amount
        },
        { status: 400 }
      );
    }

    // Get current Crit-Coins balance
    const latestCritCoin = await prisma.critCoinTransaction.findFirst({
      where: { playerId: userId },
      orderBy: { createdAt: 'desc' }
    });

    const currentCritCoins = latestCritCoin?.balanceAfter ?? 0;

    // Find applicable conversion tier (with bonus!)
    const tier = getConversionTier(amount);
    const critCoinsToCredit = tier.coins;
    const bonusCoins = tier.bonus;

    const newStoryCredits = currentStoryCredits - amount;
    const newCritCoins = currentCritCoins + critCoinsToCredit;

    // Create transactions in a transaction (atomic)
    const result = await prisma.$transaction(async (tx) => {
      // Debit Story Credits
      const storyCreditTx = await tx.storyCreditTransaction.create({
        data: {
          playerId: userId,
          transactionType: 'spent_conversion',
          amount: -amount,
          balanceAfter: newStoryCredits,
          description: bonusCoins > 0
            ? `Converted ${amount} Story Credits → ${critCoinsToCredit} Crit-Coins (+${bonusCoins} bonus!)`
            : `Converted ${amount} Story Credits → ${critCoinsToCredit} Crit-Coins`,
          source: 'convert_to_coins',
          metadata: {
            critCoinsReceived: critCoinsToCredit,
            bonusCoins: bonusCoins,
            bonusPercent: tier.bonusPercent,
            tier: `${amount} credits → ${critCoinsToCredit} coins`
          }
        }
      });

      // Credit Crit-Coins
      const critCoinTx = await tx.critCoinTransaction.create({
        data: {
          playerId: userId,
          transactionType: 'credit',
          amount: critCoinsToCredit,
          balanceAfter: newCritCoins,
          description: bonusCoins > 0
            ? `Converted from ${amount} Story Credits (+${bonusCoins} bonus)`
            : `Converted from ${amount} Story Credits`,
          metadata: {
            storyCreditsConverted: amount,
            bonusCoins: bonusCoins,
            bonusPercent: tier.bonusPercent,
            storyCreditTransactionId: storyCreditTx.id
          }
        }
      });

      // Update Story Credit transaction with reference to Crit-Coin transaction
      await tx.storyCreditTransaction.update({
        where: { id: storyCreditTx.id },
        data: {
          critCoinTransactionId: critCoinTx.id
        }
      });

      return { storyCreditTx, critCoinTx };
    });

    // AUDIT LOG
    console.log(
      `[OWNER_CONVERT] Owner ${userId} converted ${amount} story credits → ${critCoinsToCredit} crit-coins (bonus: ${bonusCoins})`
    );

    return NextResponse.json({
      success: true,
      storyCreditsDebited: amount,
      critCoinsReceived: critCoinsToCredit,
      bonusCoins: bonusCoins,
      bonusPercent: tier.bonusPercent,
      newStoryCreditsBalance: newStoryCredits,
      newCritCoinsBalance: newCritCoins,
      tier: {
        credits: tier.credits,
        coins: tier.coins,
        bonus: tier.bonus,
        bonusPercent: tier.bonusPercent
      },
      message: bonusCoins > 0
        ? `Converted ${amount} Story Credits to ${critCoinsToCredit} Crit-Coins with +${bonusCoins} bonus (${tier.bonusPercent}%)!`
        : `Converted ${amount} Story Credits to ${critCoinsToCredit} Crit-Coins`,
      transactions: result
    });
  } catch (error) {
    console.error('Error converting Story Credits:', error);
    return NextResponse.json(
      { error: 'Failed to convert Story Credits' },
      { status: 500 }
    );
  }
}
