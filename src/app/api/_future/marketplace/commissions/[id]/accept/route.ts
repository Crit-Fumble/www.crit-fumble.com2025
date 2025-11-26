import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { apiRateLimiter, getClientIdentifier, getIpAddress, checkRateLimit } from '@/lib/rate-limit';

/**
 * POST /api/marketplace/commissions/:id/accept
 * Accept a proposal and move funds to escrow
 * Handles both Crit-Coins (5:4 ratio) and Story Credits (1:1)
 *
 * SECURITY: Requires authentication, rate limited
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // RATE LIMITING: Check before authentication to prevent brute force
    const ip = getIpAddress(request);
    const rateLimitResult = await checkRateLimit(
      apiRateLimiter,
      getClientIdentifier(undefined, ip)
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: { 'Retry-After': rateLimitResult.retryAfter.toString() }
        }
      );
    }

    // AUTHENTICATION: Require logged-in user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use authenticated user ID - never trust client-provided userId
    const userId = session.user.id;

    const body = await request.json();
    const { proposalId } = body;
    const commissionId = params.id;

    // Validate required fields
    if (!proposalId) {
      return NextResponse.json(
        { error: 'Missing required field: proposalId' },
        { status: 400 }
      );
    }

    // Get commission
    const commission = await prisma.marketplaceCommission.findUnique({
      where: { id: commissionId }
    });

    if (!commission) {
      return NextResponse.json(
        { error: 'Commission not found' },
        { status: 404 }
      );
    }

    // Verify requester owns this commission
    if (commission.requestorId !== userId) {
      return NextResponse.json(
        { error: 'Only the requester can accept proposals' },
        { status: 403 }
      );
    }

    // Check commission is open
    if (commission.status !== 'open') {
      return NextResponse.json(
        { error: 'Commission is not open' },
        { status: 400 }
      );
    }

    // Get proposal
    const proposal = await prisma.commissionProposal.findUnique({
      where: { id: proposalId }
    });

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Verify proposal is for this commission
    if (proposal.commissionId !== commissionId) {
      return NextResponse.json(
        { error: 'Proposal does not belong to this commission' },
        { status: 400 }
      );
    }

    // Check proposal is pending
    if (proposal.status !== 'pending') {
      return NextResponse.json(
        { error: 'Proposal is not pending' },
        { status: 400 }
      );
    }

    let escrowAmount: number;
    let critCoinTxId: string | null = null;
    let platformMargin: number = 0;

    // Execute in transaction
    const result = await prisma.$transaction(async (tx) => {
      if (commission.paymentType === 'crit_coins') {
        // Crit-Coins payment: 5:4 ratio (20% platform margin)
        const latestCritCoin = await tx.critCoinTransaction.findFirst({
          where: { playerId: userId },
          orderBy: { createdAt: 'desc' }
        });

        const critCoinsBalance = latestCritCoin?.balanceAfter ?? 0;
        const proposalPrice = proposal.price.toNumber();

        if (critCoinsBalance < proposalPrice) {
          throw new Error('Insufficient Crit-Coins');
        }

        // Deduct Crit-Coins from requester
        const critCoinTx = await tx.critCoinTransaction.create({
          data: {
            playerId: userId,
            transactionType: 'debit',
            amount: -proposalPrice,
            balanceAfter: critCoinsBalance - proposalPrice,
            description: `Commission: ${commission.title}`,
            metadata: {
              commissionId,
              creatorId: proposal.creatorId,
              proposalId: proposal.id,
              escrowConversion: true
            }
          }
        });

        critCoinTxId = critCoinTx.id;

        // Convert to Story Credits at 5:4 ratio
        escrowAmount = proposalPrice * 0.8; // 80% goes to creator
        platformMargin = proposalPrice * 0.2; // 20% platform margin
      } else {
        // Story Credits payment: 1:1 (no fee)
        const latestStoryCredit = await tx.storyCreditTransaction.findFirst({
          where: { playerId: userId },
          orderBy: { createdAt: 'desc' }
        });

        const storyCreditsBalance = latestStoryCredit?.balanceAfter.toNumber() ?? 0;
        const proposalPrice = proposal.price.toNumber();

        if (storyCreditsBalance < proposalPrice) {
          throw new Error('Insufficient Story Credits');
        }

        escrowAmount = proposalPrice; // 100% to creator
        platformMargin = 0;
      }

      // Get current Story Credits balance for escrow transaction
      const currentStoryCreditBalance = await tx.storyCreditTransaction.findFirst({
        where: { playerId: userId },
        orderBy: { createdAt: 'desc' }
      });

      const currentBalance = currentStoryCreditBalance?.balanceAfter.toNumber() ?? 0;

      // Create escrow transaction (debit requester's Story Credits)
      const escrowTx = await tx.storyCreditTransaction.create({
        data: {
          playerId: userId,
          transactionType: 'spent_escrow',
          amount: -escrowAmount,
          balanceAfter: currentBalance - escrowAmount,
          description: `Escrow for commission: ${commission.title}`,
          source: 'marketplace_escrow',
          metadata: {
            commissionId,
            proposalId: proposal.id,
            creatorId: proposal.creatorId,
            escrowAmount,
            paymentType: commission.paymentType,
            originalAmount: proposal.price.toNumber(),
            platformMargin: platformMargin
          }
        }
      });

      // Update commission
      await tx.marketplaceCommission.update({
        where: { id: commissionId },
        data: {
          status: 'in_progress',
          creatorId: proposal.creatorId,
          escrowHeld: true,
          escrowAmount: escrowAmount,
          escrowTxId: escrowTx.id,
          critCoinTxId: critCoinTxId,
          platformMargin: platformMargin
        }
      });

      // Update accepted proposal
      await tx.commissionProposal.update({
        where: { id: proposalId },
        data: { status: 'accepted' }
      });

      // Reject all other proposals
      await tx.commissionProposal.updateMany({
        where: {
          commissionId,
          id: { not: proposalId },
          status: 'pending'
        },
        data: { status: 'rejected' }
      });

      return { escrowTx, escrowAmount, platformMargin };
    });

    return NextResponse.json({
      success: true,
      message: 'Proposal accepted and funds moved to escrow',
      escrow: {
        amount: result.escrowAmount,
        paymentType: commission.paymentType,
        platformMargin: result.platformMargin,
        creatorWillReceive: result.escrowAmount
      },
      commission: {
        id: commissionId,
        status: 'in_progress',
        creatorId: proposal.creatorId
      }
    });
  } catch (error: any) {
    console.error('Error accepting proposal:', error);

    if (error.message === 'Insufficient Crit-Coins' || error.message === 'Insufficient Story Credits') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to accept proposal' },
      { status: 500 }
    );
  }
}
