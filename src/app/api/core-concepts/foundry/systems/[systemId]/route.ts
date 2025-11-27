/**
 * Core Concepts API - Foundry Platform - System Details
 *
 * GET /api/core-concepts/foundry/systems/[systemId]
 * Returns detailed system configuration including attribute mappings for Foundry VTT
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  validatePlatformAuth,
  errorResponse,
  successResponse,
} from '@/lib/core-concepts-api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ systemId: string }> }
) {
  // Validate Foundry platform authentication
  const authResult = await validatePlatformAuth(request, 'foundry')
  if ('error' in authResult) {
    return errorResponse(authResult.error, authResult.status)
  }

  const { systemId } = await params

  try {
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
      return errorResponse('System not found', 404)
    }

    // Get attributes for this system
    const attributes = await prisma.rpgAttribute.findMany({
      where: {
        systemName: system.name,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        title: true,
        description: true,
        dataType: true,
        category: true,
        defaultValue: true,
        minValue: true,
        maxValue: true,
        isCore: true,
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })

    const platforms = system.platforms as Record<string, unknown> | null
    const foundryConfig = platforms?.foundry as Record<string, unknown> | undefined

    return successResponse({
      system: {
        id: system.id,
        systemId: system.systemId,
        name: system.name,
        title: system.title,
        description: system.description,
        // Foundry-specific configuration
        foundrySystemId: foundryConfig?.foundrySystemId || system.systemId,
        manifestUrl: foundryConfig?.manifestUrl,
        modules: foundryConfig?.modules || [],
        // Attribute mappings for Foundry data paths
        // e.g., { "strength": "system.abilities.str.value" }
        attributeMappings: foundryConfig?.attributeMappings || {},
        // Sub-systems (e.g., character classes, races)
        subSystems: system.subSystems,
        // Attribute definitions
        attributes,
      },
      platform: 'foundry',
    })
  } catch (error) {
    console.error('Error fetching system:', error)
    return errorResponse('Failed to fetch system', 500)
  }
}
