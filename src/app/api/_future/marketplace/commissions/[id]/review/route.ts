import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/marketplace/commissions/:id/review
 * Approve or request revisions for submitted work
 * On approval: releases escrow funds to creator
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { userId, status, feedback, rating } = body;
    const commissionId = params.id;

    // Validate required fields
    if (!userId || !status) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['userId', 'status (approved|revision_requested)']
        },
        { status: 400 }
      );
    }

    // Validate status
    if (status !== 'approved' && status !== 'revision_requested') {
      return NextResponse.json(
        { error: 'Invalid status. Must be "approved" or "revision_requested"' },
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

    // Verify user is the requester
    if (commission.requestorId !== userId) {
      return NextResponse.json(
        { error: 'Only the requester can review work' },
        { status: 403 }
      );
    }

    // Check commission is submitted
    if (commission.status !== 'submitted') {
      return NextResponse.json(
        { error: 'Commission is not submitted for review' },
        { status: 400 }
      );
    }

    // Check escrow is held
    if (!commission.escrowHeld || !commission.escrowAmount) {
      return NextResponse.json(
        { error: 'No escrow funds held' },
        { status: 400 }
      );
    }

    if (status === 'revision_requested') {
      // Request revisions - send back to in_progress
      const updatedCommission = await prisma.marketplaceCommission.update({
        where: { id: commissionId },
        data: {
          status: 'in_progress',
          requestorReview: feedback || null
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Revision requested',
        commission: {
          id: updatedCommission.id,
          status: updatedCommission.status
        },
        feedback
      });
    }

    // status === 'approved' - Release funds to creator
    const result = await prisma.$transaction(async (tx) => {
      // Get creator's current Story Credits balance
      const latestCredit = await tx.storyCreditTransaction.findFirst({
        where: { playerId: commission.creatorId! },
        orderBy: { createdAt: 'desc' }
      });

      const creatorBalance = latestCredit?.balanceAfter.toNumber() ?? 0;
      const escrowAmount = commission.escrowAmount.toNumber();

      // Release payment to creator
      const paymentTx = await tx.storyCreditTransaction.create({
        data: {
          playerId: commission.creatorId!,
          transactionType: 'earned',
          amount: escrowAmount,
          balanceAfter: creatorBalance + escrowAmount,
          description: `Commission completed: ${commission.title}`,
          source: 'marketplace_commission',
          metadata: {
            commissionId,
            requestorId: commission.requestorId,
            escrowTxId: commission.escrowTxId,
            paymentType: commission.paymentType,
            platformMargin: commission.platformMargin?.toNumber() || 0
          }
        }
      });

      // Update commission
      const updatedCommission = await tx.marketplaceCommission.update({
        where: { id: commissionId },
        data: {
          status: 'completed',
          approvedAt: new Date(),
          escrowHeld: false,
          requestorRating: rating || null,
          requestorReview: feedback || null
        }
      });

      return { paymentTx, updatedCommission, escrowAmount };
    });

    return NextResponse.json({
      success: true,
      message: 'Work approved and payment released',
      payment: {
        amount: result.escrowAmount,
        creatorId: commission.creatorId,
        transactionId: result.paymentTx.id
      },
      commission: {
        id: result.updatedCommission.id,
        status: result.updatedCommission.status,
        approvedAt: result.updatedCommission.approvedAt
      }
    });
  } catch (error) {
    console.error('Error reviewing commission:', error);
    return NextResponse.json(
      { error: 'Failed to review commission' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/marketplace/commissions/:id/review
 * Get review status and details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const commissionId = params.id;

    const commission = await prisma.marketplaceCommission.findUnique({
      where: { id: commissionId },
      select: {
        id: true,
        status: true,
        deliveredAt: true,
        approvedAt: true,
        requestorRating: true,
        creatorRating: true,
        requestorReview: true,
        creatorReview: true,
        escrowHeld: true,
        escrowAmount: true
      }
    });

    if (!commission) {
      return NextResponse.json(
        { error: 'Commission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      review: commission
    });
  } catch (error) {
    console.error('Error fetching review:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review' },
      { status: 500 }
    );
  }
}
