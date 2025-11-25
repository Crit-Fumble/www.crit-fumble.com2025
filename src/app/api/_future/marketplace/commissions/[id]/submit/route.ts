import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/marketplace/commissions/:id/submit
 * Submit completed work for review
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { userId, files, message } = body;
    const commissionId = params.id;

    // Validate required fields
    if (!userId || !files || files.length === 0) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['userId', 'files (array of URLs)']
        },
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

    // Verify user is the assigned creator
    if (commission.creatorId !== userId) {
      return NextResponse.json(
        { error: 'Only the assigned creator can submit work' },
        { status: 403 }
      );
    }

    // Check commission is in progress
    if (commission.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Commission is not in progress' },
        { status: 400 }
      );
    }

    // Update commission with deliverables
    const updatedCommission = await prisma.marketplaceCommission.update({
      where: { id: commissionId },
      data: {
        status: 'submitted',
        deliveryFiles: files,
        deliveredAt: new Date()
      }
    });

    // Calculate review deadline (48 hours from now)
    const reviewDeadline = new Date();
    reviewDeadline.setHours(reviewDeadline.getHours() + 48);

    return NextResponse.json({
      success: true,
      message: 'Work submitted successfully',
      commission: {
        id: updatedCommission.id,
        status: updatedCommission.status,
        deliveryFiles: updatedCommission.deliveryFiles,
        deliveredAt: updatedCommission.deliveredAt
      },
      reviewInfo: {
        reviewDeadline,
        autoApproveIn: '48 hours',
        escrowAmount: commission.escrowAmount?.toNumber(),
        note: 'Payment will auto-release if no response within 48 hours'
      }
    });
  } catch (error) {
    console.error('Error submitting work:', error);
    return NextResponse.json(
      { error: 'Failed to submit work' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/marketplace/commissions/:id/submit
 * Get submission details (deliverables)
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
        deliveryFiles: true,
        deliveredAt: true,
        approvedAt: true,
        escrowAmount: true,
        creatorId: true,
        requestorId: true
      }
    });

    if (!commission) {
      return NextResponse.json(
        { error: 'Commission not found' },
        { status: 404 }
      );
    }

    // Calculate review time remaining if submitted
    let reviewTimeRemaining = null;
    if (commission.status === 'submitted' && commission.deliveredAt) {
      const reviewDeadline = new Date(commission.deliveredAt);
      reviewDeadline.setHours(reviewDeadline.getHours() + 48);
      const now = new Date();
      const msRemaining = reviewDeadline.getTime() - now.getTime();
      reviewTimeRemaining = Math.max(0, Math.floor(msRemaining / 1000 / 60 / 60)); // hours
    }

    return NextResponse.json({
      success: true,
      submission: {
        ...commission,
        reviewTimeRemaining: reviewTimeRemaining ? `${reviewTimeRemaining} hours` : null
      }
    });
  } catch (error) {
    console.error('Error fetching submission:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submission' },
      { status: 500 }
    );
  }
}
