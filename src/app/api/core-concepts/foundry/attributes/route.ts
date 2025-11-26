/**
 * Core Concepts API - Foundry Platform - Attributes
 *
 * GET /api/core-concepts/foundry/attributes
 * Returns attribute definitions and Foundry mappings for a system
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

  const { context } = authResult
  const { searchParams } = new URL(request.url)
  const systemName = searchParams.get('systemName')
  const systemId = searchParams.get('systemId')

  if (!systemName && !systemId) {
    return errorResponse('systemName or systemId is required', 400)
  }

  try {
    // Get the RPG system for Foundry mappings
    let system = null
    if (systemId) {
      system = await prisma.rpgSystem.findUnique({
        where: { systemId, deletedAt: null },
        select: {
          id: true,
          systemId: true,
          name: true,
          platforms: true,
        },
      })
    }

    // Get attribute definitions for the system
    const attributes = await prisma.rpgAttribute.findMany({
      where: {
        systemName: systemName || system?.name || '',
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        title: true,
        description: true,
        category: true,
        dataType: true,
        defaultValue: true,
        minValue: true,
        maxValue: true,
        isCore: true,
        metadata: true,
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })

    // Get Foundry-specific attribute mappings from system config
    const foundryConfig = (system?.platforms as Record<string, unknown> | null)?.foundry as
      | Record<string, unknown>
      | undefined

    return successResponse({
      systemId: system?.systemId,
      systemName: systemName || system?.name,
      attributes,
      // Foundry-specific attribute path mappings
      // e.g., { "strength": "system.abilities.str.value" }
      attributeMappings: foundryConfig?.attributeMappings || {},
      platform: 'foundry',
      foundryUserId: context.platformUserId,
    })
  } catch (error) {
    console.error('Error fetching attributes:', error)
    return errorResponse('Failed to fetch attributes', 500)
  }
}
