/**
 * Core Concepts API - Web Platform - Systems
 *
 * GET /api/core-concepts/web/systems
 * Returns available RPG systems for the web platform
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  validatePlatformAuth,
  errorResponse,
  successResponse,
} from '@/lib/core-concepts-api'

export async function GET(request: NextRequest) {
  // Validate web platform authentication
  const authResult = await validatePlatformAuth(request, 'web')
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

    // Filter to only systems that support web platform
    const webSystems = systems.filter((system) => {
      const platforms = system.platforms as Record<string, unknown> | null
      return platforms?.web !== false // Include if web is not explicitly disabled
    })

    return successResponse({
      systems: webSystems,
      platform: 'web',
    })
  } catch (error) {
    console.error('Error fetching systems:', error)
    return errorResponse('Failed to fetch systems', 500)
  }
}
