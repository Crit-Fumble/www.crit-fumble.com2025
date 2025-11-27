/**
 * Test Authentication API Route
 *
 * SECURITY: Only available in development and test environments
 * Creates test sessions for integration testing without OAuth flows
 *
 * This endpoint allows tests to authenticate as different user roles
 * without needing real Discord/GitHub credentials
 */

import { NextRequest, NextResponse } from 'next/server';
import { prismaMain } from '@/lib/db';
import crypto from 'crypto';

// SECURITY: Completely disable in production
if (process.env.NODE_ENV === 'production') {
  throw new Error('Test auth endpoint cannot be loaded in production');
}

// Create Prisma client for test auth
const prisma = prismaMain;

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Only allow in development/test
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Test auth not available in production' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, username, critCoins, storyCredits, role } = body;

    const testEmail = email || `test-player-${Date.now()}@crit-fumble.test`;
    const testUsername = username || `test_player_${Date.now()}`;

    // Create or update test player
    // Use transaction to ensure all records are created atomically
    const { player, sessionToken, sessionExpiry } = await prisma.$transaction(async (tx) => {
      // For admin users, set verification fields to match DEV_ env vars
      const isAdmin = role === 'admin';
      const verificationFields = isAdmin ? {
        verifiedPhone: process.env.DEV_PHONE || null,
        verifiedEmail: process.env.DEV_EMAIL || null,
        verifiedDiscord: process.env.DEV_DISCORD || null,
      } : {};

      const player = await tx.critUser.upsert({
        where: { email: testEmail },
        update: {
          username: testUsername,
          lastLoginAt: new Date(),
          ...verificationFields,
        },
        create: {
          email: testEmail,
          username: testUsername,
          lastLoginAt: new Date(),
          ...verificationFields,
        },
      });

      // Create balance transactions if provided
      if (critCoins !== undefined && critCoins > 0) {
        await tx.critCoinTransaction.create({
          data: {
            playerId: player.id,
            amount: critCoins,
            balanceAfter: critCoins, // First transaction, so balance after = amount
            transactionType: 'credit',
            description: 'Test balance initialization',
          },
        });
      }

      if (storyCredits !== undefined && storyCredits > 0) {
        await tx.critStoryCreditTransaction.create({
          data: {
            playerId: player.id,
            amount: storyCredits,
            balanceAfter: storyCredits, // First transaction, so balance after = amount
            transactionType: 'earned',
            description: 'Test balance initialization',
            source: 'test_initialization',
          },
        });
      }

      // Create test account (simulates OAuth provider)
      await tx.account.upsert({
        where: {
          provider_providerAccountId: {
            provider: 'test',
            providerAccountId: player.id,
          },
        },
        update: {
          userId: player.id,
        },
        create: {
          userId: player.id,
          type: 'oauth',
          provider: 'test',
          providerAccountId: player.id,
          access_token: crypto.randomBytes(32).toString('hex'),
          token_type: 'bearer',
          scope: 'identify email',
        },
      });

      // Create session with activity tracking
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const sessionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await tx.session.create({
        data: {
          sessionToken,
          userId: player.id,
          expires: sessionExpiry,
          createdAt: new Date(),
          lastActivityAt: new Date(),
          ipAddress: request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     '127.0.0.1',
          userAgent: request.headers.get('user-agent') || 'playwright-test-agent',
        },
      });

      // Create immutable player session audit log
      await tx.critSessionLog.create({
        data: {
          playerId: player.id,
          sessionToken,
          loginMethod: 'test',
          expiresAt: sessionExpiry,
          createdAt: new Date(),
          lastActivityAt: new Date(),
          ipAddress: request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     '127.0.0.1',
          userAgent: request.headers.get('user-agent') || 'playwright-test-agent',
          isValid: true,
        },
      });

      return { player, sessionToken, sessionExpiry };
    });

    // Verify session was created and is valid
    const verifySession = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    });

    if (!verifySession || verifySession.expires < new Date()) {
      console.error('[test-auth] Session verification failed:', {
        found: !!verifySession,
        expired: verifySession ? verifySession.expires < new Date() : null,
      });
      return NextResponse.json(
        { error: 'Session verification failed', sessionToken },
        { status: 500 }
      );
    }

    console.log('[test-auth] Session created and verified:', {
      playerId: player.id,
      sessionToken: sessionToken.substring(0, 20) + '...',
      expires: sessionExpiry.toISOString(),
    });

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      sessionToken,
      userId: player.id, // Use userId for compatibility with NextAuth
      playerId: player.id,
      username: testUsername,
      email: testEmail,
      role: role || 'player',
      expiresAt: sessionExpiry.toISOString(),
    });

    // Set session cookie (same as NextAuth would)
    // This allows direct browser testing without needing Playwright fixtures
    response.cookies.set('next-auth.session-token', sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      expires: sessionExpiry,
      // Don't set domain - let it default to current domain
    });

    return response;
  } catch (error) {
    console.error('Test auth error:', error);
    return NextResponse.json(
      { error: 'Failed to create test session', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // SECURITY: Only allow in development/test
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Test auth not available in production' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { playerId, sessionToken } = body;

    if (sessionToken) {
      // Delete specific session
      await prisma.session.deleteMany({
        where: { sessionToken },
      });
    } else if (playerId) {
      // Delete all sessions for player
      await prisma.session.deleteMany({
        where: { userId: playerId },
      });

      // Delete test account
      await prisma.account.deleteMany({
        where: { userId: playerId, provider: 'test' },
      });

      // Delete player session audit logs
      await prisma.critSessionLog.deleteMany({
        where: { playerId },
      });

      // Delete test player entirely
      await prisma.critUser.deleteMany({
        where: { id: playerId },
      });
    } else {
      // Clean up all test players
      const testPlayers = await prisma.critUser.findMany({
        where: {
          OR: [
            { email: { contains: '@crit-fumble.test' } },
            { username: { startsWith: 'test_player_' } },
          ],
        },
      });

      for (const player of testPlayers) {
        await prisma.session.deleteMany({ where: { userId: player.id } });
        await prisma.account.deleteMany({ where: { userId: player.id } });
        await prisma.critSessionLog.deleteMany({ where: { playerId: player.id } });
        await prisma.critUser.delete({ where: { id: player.id } });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Test auth cleanup error:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup test session', details: String(error) },
      { status: 500 }
    );
  }
}
