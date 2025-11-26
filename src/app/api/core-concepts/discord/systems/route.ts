/**
 * Core Concepts API - Discord Platform - Systems
 *
 * GET /api/core-concepts/discord/systems
 * Returns available RPG systems for Discord Activity/bot integrations
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  validatePlatformAuth,
  errorResponse,
  successResponse,
} from '@/lib/core-concepts-api'

export async function GET(request: NextRequest) {
  // Validate Discord platform authentication
  const authResult = await validatePlatformAuth(request, 'discord')
  if ('error' in authResult) {
    return errorResponse(authResult.error, authResult.status)
  }

  try {
    // Get all active RPG systems
    const systems = await prisma.rpgSystem.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        systemId: true,
        name: true,
        title: true,
        description: true,
        platforms: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    })

    // Filter to only systems that support Discord platform
    const discordSystems = systems.filter((system) => {
      const platforms = system.platforms as Record<string, unknown> | null
      return platforms?.discord !== false // Include if discord is not explicitly disabled
    })

    return successResponse({
      systems: discordSystems,
      platform: 'discord',
    })
  } catch (error) {
    console.error('Error fetching systems:', error)
    return errorResponse('Failed to fetch systems', 500)
  }
}
