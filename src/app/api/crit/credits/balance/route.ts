import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { isOwner } from '@/lib/admin';

/**
 * GET /api/crit/credits/balance
 * Get user's current Story Credits balance
 *
 * SECURITY: Owner-only access.
 */
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Require authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // SECURITY: Only owners can access story credit balances
    const user = await prisma.critUser.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !isOwner(user)) {
      return NextResponse.json(
        { error: 'Forbidden - Owner access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');

    // Use requested userId or authenticated user's ID
    const userId = requestedUserId || session.user.id;

    // Get latest transaction to find current balance
    const latestTransaction = await prisma.storyCreditTransaction.findFirst({
      where: { playerId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        balanceAfter: true,
        createdAt: true
      }
    });

    const balance = latestTransaction?.balanceAfter.toNumber() ?? 0;
    const balanceUsd = (balance * 0.01).toFixed(2); // 1 Story Credit = $0.01
    const critCoinsEquivalent = balance * 10; // 1 Story Credit = 10 Crit-Coins

    return NextResponse.json({
      balance,
      balanceUsd,
      critCoinsEquivalent,
      canCashOut: balance >= 1000, // Minimum 1,000 credits
      canConvert: balance >= 100, // Minimum 100 credits to convert
      lastUpdated: latestTransaction?.createdAt ?? null
    });
  } catch (error) {
    console.error('Error fetching Story Credits balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}
