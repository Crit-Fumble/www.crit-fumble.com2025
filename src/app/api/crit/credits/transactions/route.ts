import { NextRequest, NextResponse } from 'next/server';
import { prismaMain } from '@/lib/db';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { isOwner } from '@/lib/admin';

/**
 * GET /api/crit/credits/transactions
 * Get user's Story Credits transaction history
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
    // SECURITY: Only owners can access story credit transactions
    const user = await prismaMain.critUser.findUnique({
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const source = searchParams.get('source'); // Optional filter
    // Use requested userId or authenticated user's ID
    const userId = requestedUserId || session.user.id;
    const where: any = { playerId: userId };
    if (source) {
      where.source = source;
    }
    const transactions = await prismaMain.critStoryCreditTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        critSession: {
          select: {
            rpgSessionId: true,
            rpgSession: {
              select: {
                title: true,
                scheduledStart: true,
                actualStart: true,
                actualEnd: true
              }
            }
          }
        }
      }
    });

    const total = await prismaMain.critStoryCreditTransaction.count({
      where: { playerId: userId }
    });

    // Calculate earnings by source
    const earnedTransactions = await prismaMain.critStoryCreditTransaction.findMany({
      where: {
        playerId: userId,
        transactionType: 'earned'
      },
      select: {
        source: true,
        amount: true
      }
    });

    const earningsBySource = earnedTransactions.reduce((acc: any, tx) => {
      const source = tx.source;
      if (!acc[source]) {
        acc[source] = 0;
      }
      acc[source] += tx.amount.toNumber();
      return acc;
    }, {});
    return NextResponse.json({
      transactions,
      total,
      limit,
      offset,
      earningsBySource
    });
  } catch (error) {
    console.error('Error fetching Story Credits transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/crit/credits/transactions
 * Create a new Story Credits transaction (owner/system use for awarding credits)
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // SECURITY: Only owners can create story credit transactions
    const user = await prismaMain.critUser.findUnique({
      where: { id: session.user.id },
    });
    if (!user || !isOwner(user)) {
      return NextResponse.json(
        { error: 'Forbidden - Owner access required' },
        { status: 403 }
      );
    }
    // SECURITY: Only owners can create story credit transactions
    const body = await request.json();
    const {
      playerId,
      transactionType,
      amount,
      description,
      source,
      critSessionId,
      contentId,
      metadata
    } = body;
    // Validate required fields
    if (!playerId || !transactionType || !amount || !description || !source) {
      return NextResponse.json(
        { error: 'Missing required fields: playerId, transactionType, amount, description, source' },
        { status: 400 }
      );
    }
    // Get current balance
    const latestTransaction = await prismaMain.critStoryCreditTransaction.findFirst({
      where: { playerId },
      orderBy: { createdAt: 'desc' }
    });

    const currentBalance = latestTransaction?.balanceAfter.toNumber() ?? 0;
    const newBalance = currentBalance + amount;
    // Prevent negative balance
    if (newBalance < 0) {
      return NextResponse.json(
        { error: 'Insufficient balance', currentBalance, requestedAmount: amount },
        { status: 400 }
      );
    }
    // Create transaction
    const transaction = await prismaMain.critStoryCreditTransaction.create({
      data: {
        playerId,
        transactionType,
        amount,
        balanceAfter: newBalance,
        description,
        source,
        sessionId: critSessionId || null,
        contentId: contentId || null,
        metadata: metadata || {}
      }
    });

    // AUDIT LOG: Log owner transaction creation
    console.log(
      `[OWNER_TRANSACTION] Owner ${session.user.id} created ${transactionType} story credit transaction of ${amount} for user ${playerId}. Source: ${source}`
    );

    return NextResponse.json({
      transaction,
      previousBalance: currentBalance,
      newBalance
    });
  } catch (error) {
    console.error('Error creating Story Credits transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}
