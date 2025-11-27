/**
 * Core Concepts API Utilities
 *
 * Shared utilities for Core Concepts platform-specific API endpoints.
 * All endpoints only read/write from Rpg* tables.
 *
 * Supported Platforms:
 * - web: Browser-based access from crit-fumble.com
 * - discord: Discord Activity and bot integrations
 * - foundry: Foundry VTT module integration
 */

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import {
  apiRateLimiter,
  getClientIdentifier,
  getIpAddress,
  checkRateLimit,
} from '@/lib/rate-limit'

export type Platform = 'web' | 'discord' | 'foundry'

export interface CoreConceptsContext {
  userId: string
  platform: Platform
  platformUserId?: string // Discord ID, Foundry user ID, etc.
  sessionId?: string // Game session ID if in active session
}

/**
 * Validate platform-specific authentication
 */
export async function validatePlatformAuth(
  request: NextRequest,
  platform: Platform
): Promise<{ context: CoreConceptsContext } | { error: string; status: number }> {
  // Rate limiting
  const ip = getIpAddress(request)
  const rateLimitResult = await checkRateLimit(apiRateLimiter, getClientIdentifier(undefined, ip))

  if (!rateLimitResult.success) {
    return {
      error: 'Too many requests',
      status: 429,
    }
  }

  // Standard auth for web platform
  if (platform === 'web') {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized', status: 401 }
    }
    return {
      context: {
        userId: session.user.id,
        platform: 'web',
      },
    }
  }

  // Discord platform - check for Discord auth token
  if (platform === 'discord') {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return { error: 'Missing Discord authorization', status: 401 }
    }

    // For Discord, we need to validate the token and get the linked user
    // The token comes from our Discord Activity OAuth flow
    const token = authHeader.slice(7)
    const discordAuth = await validateDiscordToken(token)
    if (!discordAuth) {
      return { error: 'Invalid Discord token', status: 401 }
    }

    return {
      context: {
        userId: discordAuth.userId,
        platform: 'discord',
        platformUserId: discordAuth.discordId,
      },
    }
  }

  // Foundry platform - check for Foundry API key or session
  if (platform === 'foundry') {
    const authHeader = request.headers.get('authorization')
    const apiKey = request.headers.get('x-foundry-api-key')

    // Option 1: Bearer token (from logged-in user)
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      const foundryAuth = await validateFoundryToken(token)
      if (!foundryAuth) {
        return { error: 'Invalid Foundry token', status: 401 }
      }
      return {
        context: {
          userId: foundryAuth.userId,
          platform: 'foundry',
          platformUserId: foundryAuth.foundryUserId,
        },
      }
    }

    // Option 2: API key (for server-to-server)
    if (apiKey) {
      const keyAuth = await validateFoundryApiKey(apiKey)
      if (!keyAuth) {
        return { error: 'Invalid API key', status: 401 }
      }
      return {
        context: {
          userId: keyAuth.userId,
          platform: 'foundry',
        },
      }
    }

    // Option 3: Fall back to session auth
    const session = await auth()
    if (session?.user?.id) {
      return {
        context: {
          userId: session.user.id,
          platform: 'foundry',
        },
      }
    }

    return { error: 'Unauthorized', status: 401 }
  }

  return { error: 'Invalid platform', status: 400 }
}

/**
 * Validate Discord OAuth token and get linked user
 */
async function validateDiscordToken(
  token: string
): Promise<{ userId: string; discordId: string } | null> {
  try {
    // Look up the token in our stored Discord authentications
    // This would be stored when the user authenticates via Discord Activity
    // Using the Account table from NextAuth which stores OAuth tokens
    const account = await prisma.account.findFirst({
      where: {
        provider: 'discord',
        access_token: token,
      },
      include: {
        user: {
          select: { id: true },
        },
      },
    })

    if (!account) {
      return null
    }

    return {
      userId: account.userId,
      discordId: account.providerAccountId,
    }
  } catch {
    return null
  }
}

/**
 * Validate Foundry session token
 */
async function validateFoundryToken(
  token: string
): Promise<{ userId: string; foundryUserId?: string } | null> {
  try {
    // For now, treat Foundry tokens as session tokens
    // In the future, we could have Foundry-specific token storage
    const session = await prisma.session.findUnique({
      where: { sessionToken: token },
      include: {
        user: {
          select: { id: true },
        },
      },
    })

    if (!session || session.expires < new Date()) {
      return null
    }

    return {
      userId: session.userId,
    }
  } catch {
    return null
  }
}

/**
 * Validate Foundry API key (for server-to-server auth)
 */
async function validateFoundryApiKey(
  apiKey: string
): Promise<{ userId: string } | null> {
  try {
    // Look up API key - stored in user settings or a dedicated table
    const user = await prisma.critUser.findFirst({
      where: {
        // API keys stored in settings JSON
        settings: {
          path: ['foundryApiKey'],
          equals: apiKey,
        },
        deletedAt: null,
      },
      select: { id: true },
    })

    if (!user) {
      return null
    }

    return { userId: user.id }
  } catch {
    return null
  }
}

/**
 * Standard error response
 */
export function errorResponse(error: string, status: number): NextResponse {
  return NextResponse.json({ error }, { status })
}

/**
 * Standard success response
 */
export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status })
}

/**
 * Get system mappings for a specific RPG system
 * Used by Foundry module to fetch attribute mappings on load
 */
export async function getSystemMappings(systemId: string) {
  const system = await prisma.rpgSystem.findUnique({
    where: { systemId, deletedAt: null },
    include: {
      subSystems: {
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          title: true,
          category: true,
          metadata: true,
        },
      },
    },
  })

  if (!system) {
    return null
  }

  // Return system with its platform configurations
  return {
    id: system.id,
    systemId: system.systemId,
    name: system.name,
    title: system.title,
    platforms: system.platforms,
    subSystems: system.subSystems,
    // Attribute mappings would be in platforms.foundry.attributeMappings
    mappings: (system.platforms as Record<string, unknown>)?.foundry as Record<string, unknown> | undefined,
  }
}
