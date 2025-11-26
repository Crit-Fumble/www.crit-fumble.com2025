/**
 * API route to link World Anvil account using User API Token
 *
 * SECURITY: Requires authentication, rate limited
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { WorldAnvilPlaywrightClient } from '@/packages/worldanvil/client/WorldAnvilPlaywrightClient';
import { apiRateLimiter, getClientIdentifier, getIpAddress, checkRateLimit } from '@/lib/rate-limit';
import { encryptApiKey } from '@/lib/foundry-api';

export async function POST(request: NextRequest) {
  try {
    // RATE LIMITING: 100 requests/minute (account linking)
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

    // Parse request body
    const body = await request.json();
    const { userToken } = body;

    if (!userToken || typeof userToken !== 'string') {
      return NextResponse.json(
        { error: 'User API token is required' },
        { status: 400 }
      );
    }

    // Get application key from environment
    const applicationKey = process.env.WORLD_ANVIL_CLIENT_SECRET;
    if (!applicationKey) {
      console.error('WORLD_ANVIL_CLIENT_SECRET not configured');
      return NextResponse.json(
        { error: 'World Anvil integration not configured on server' },
        { status: 500 }
      );
    }

    // Verify the token by fetching user identity from World Anvil
    console.log('[World Anvil] Verifying user token...');
    const client = new WorldAnvilPlaywrightClient({
      apiKey: applicationKey,
      authToken: userToken,
    });

    let worldAnvilUser;
    try {
      worldAnvilUser = await client.getIdentity();
    } catch (error) {
      console.error('[World Anvil] Token verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid World Anvil token or API error' },
        { status: 400 }
      );
    } finally {
      await client.destroy();
    }

    if (!worldAnvilUser?.id || !worldAnvilUser?.username) {
      return NextResponse.json(
        { error: 'Failed to retrieve World Anvil user information' },
        { status: 400 }
      );
    }

    // Check if this World Anvil account is already linked to another user
    const existingLink = await prisma.critUser.findFirst({
      where: {
        worldAnvilId: worldAnvilUser.id,
        id: { not: session.user.id }, // Not the current user
        deletedAt: null,
      },
    });

    if (existingLink) {
      return NextResponse.json(
        { error: 'This World Anvil account is already linked to another user' },
        { status: 409 }
      );
    }

    // Update user with World Anvil information
    // SECURITY: Encrypt token before storage using AES-256
    const encryptedToken = encryptApiKey(userToken);
    const updatedUser = await prisma.critUser.update({
      where: { id: session.user.id },
      data: {
        worldAnvilId: worldAnvilUser.id,
        worldAnvilUsername: worldAnvilUser.username,
        worldAnvilToken: encryptedToken,
      },
      select: {
        id: true,
        worldAnvilId: true,
        worldAnvilUsername: true,
      },
    });

    console.log(`[World Anvil] Successfully linked account for user ${session.user.id}`);

    return NextResponse.json({
      success: true,
      worldAnvil: {
        id: updatedUser.worldAnvilId,
        username: updatedUser.worldAnvilUsername,
      },
    });
  } catch (error) {
    console.error('[World Anvil] Link account error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
