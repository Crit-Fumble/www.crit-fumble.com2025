/**
 * Track Foundry VTT user activity
 * This endpoint is called periodically by clients connected to Foundry
 * to track active users and determine when to shut down
 *
 * SECURITY: Owner-only access
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/packages/cfg-lib/auth';
import { isOwner } from '@/lib/admin';
import prismaMain from '@/packages/cfg-lib/db-main';
import { prisma } from '@/lib/db';

interface FoundryActivity {
  userId: string;
  username: string;
  lastSeen: number;
  sessionId?: string;
}

// In-memory activity tracking
// In production, consider using Redis for multi-instance support
const activeUsers = new Map<string, FoundryActivity>();

const ACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes (user considered inactive)

/**
 * GET /api/foundry/activity - Get current active users
 *
 * SECURITY: Owner-only access
 */
export async function GET(request: NextRequest) {
  try {
    // AUTHENTICATION: Require logged-in user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // AUTHORIZATION: Owner-only
    const user = await prisma.critUser.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !isOwner(user)) {
      return NextResponse.json(
        { error: 'Forbidden - Owner access required' },
        { status: 403 }
      );
    }

    // Clean up stale entries
    const now = Date.now();
    for (const [userId, activity] of activeUsers.entries()) {
      if (now - activity.lastSeen > ACTIVITY_TIMEOUT_MS) {
        activeUsers.delete(userId);
      }
    }

    const activeUsersList = Array.from(activeUsers.values());
    const hasActiveUsers = activeUsersList.length > 0;

    return NextResponse.json({
      activeUsers: activeUsersList,
      count: activeUsersList.length,
      hasActiveUsers,
      activityTimeoutMinutes: ACTIVITY_TIMEOUT_MS / 60000,
    });
  } catch (error: any) {
    console.error('Error getting Foundry activity:', error);
    return NextResponse.json(
      { error: 'Failed to get activity', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/foundry/activity - Report user activity (heartbeat)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId } = body;

    // Get user info from database
    const player = await prismaMain.player.findUnique({
      where: { id: session.user.id },
      select: { id: true, username: true },
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Update activity
    activeUsers.set(player.id, {
      userId: player.id,
      username: player.username || 'Unknown',
      lastSeen: Date.now(),
      sessionId,
    });

    // Clean up stale entries
    const now = Date.now();
    for (const [userId, activity] of activeUsers.entries()) {
      if (now - activity.lastSeen > ACTIVITY_TIMEOUT_MS) {
        activeUsers.delete(userId);
      }
    }

    const activeUsersList = Array.from(activeUsers.values());

    return NextResponse.json({
      success: true,
      activeUsers: activeUsersList.length,
      yourActivity: {
        userId: player.id,
        username: player.username,
        lastSeen: Date.now(),
      },
    });
  } catch (error: any) {
    console.error('Error reporting Foundry activity:', error);
    return NextResponse.json(
      { error: 'Failed to report activity', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/foundry/activity - Remove user activity (logout)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    activeUsers.delete(session.user.id);

    const activeUsersList = Array.from(activeUsers.values());
    const hasActiveUsers = activeUsersList.length > 0;

    return NextResponse.json({
      success: true,
      remainingUsers: activeUsersList.length,
      hasActiveUsers,
    });
  } catch (error: any) {
    console.error('Error removing Foundry activity:', error);
    return NextResponse.json(
      { error: 'Failed to remove activity', details: error.message },
      { status: 500 }
    );
  }
}
