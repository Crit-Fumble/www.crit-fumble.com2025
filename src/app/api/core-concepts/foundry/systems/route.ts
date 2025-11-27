/**
 * Core Concepts API - Foundry Platform - Systems
 *
 * GET /api/core-concepts/foundry/systems
 * Returns available RPG systems with Foundry-specific configuration
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  validatePlatformAuth,
  errorResponse,
  successResponse,
} from '@/lib/core-concepts-api'

export async function GET(request: NextRequest) {
  // Validate Foundry platform authentication
  const authResult = await validatePlatformAuth(request, 'foundry')
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

    // Filter and transform for Foundry platform
    const foundrySystems = systems
      .filter((system) => {
        const platforms = system.platforms as Record<string, unknown> | null
        return platforms?.foundry !== false // Include if foundry is not explicitly disabled
      })
      .map((system) => {
        const platforms = system.platforms as Record<string, unknown> | null
        const foundryConfig = platforms?.foundry as Record<string, unknown> | undefined

        return {
          id: system.id,
          systemId: system.systemId,
          name: system.name,
          title: system.title,
          description: system.description,
          // Foundry-specific fields
          foundrySystemId: foundryConfig?.foundrySystemId || system.systemId,
          manifestUrl: foundryConfig?.manifestUrl,
          modules: foundryConfig?.modules || [],
          attributeMappings: foundryConfig?.attributeMappings || {},
        }
      })

    return successResponse({
      systems: foundrySystems,
      platform: 'foundry',
    })
  } catch (error) {
    console.error('Error fetching systems:', error)
    return errorResponse('Failed to fetch systems', 500)
  }
}
