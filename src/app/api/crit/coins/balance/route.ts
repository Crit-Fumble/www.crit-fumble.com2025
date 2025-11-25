import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isOwner } from '@/lib/admin';

/**
 * GET /api/crit/coins/balance
 * Get user's current Crit-Coin balance
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

    // SECURITY: Only owners can access crit-coin balances
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

    // Determine which user's balance to fetch
    const userId = requestedUserId || session.user.id;

    // Get latest transaction to find current balance
    const latestTransaction = await prisma.critCoinTransaction.findFirst({
      where: { playerId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        balanceAfter: true,
        createdAt: true
      }
    });

    const balance = latestTransaction?.balanceAfter ?? 0;
    const balanceUsd = (balance / 1000).toFixed(2);

    return NextResponse.json({
      balance,
      balanceUsd,
      lastUpdated: latestTransaction?.createdAt ?? null
    });
  } catch (error) {
    console.error('Error fetching Crit-Coin balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}
