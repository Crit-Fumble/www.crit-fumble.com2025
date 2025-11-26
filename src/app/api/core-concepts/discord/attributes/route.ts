/**
 * Core Concepts API - Discord Platform - Attributes
 *
 * GET /api/core-concepts/discord/attributes
 * Returns attribute definitions for a system
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

  const { context } = authResult
  const { searchParams } = new URL(request.url)
  const systemName = searchParams.get('systemName')

  if (!systemName) {
    return errorResponse('systemName is required', 400)
  }

  try {
    // Get attribute definitions for the system
    const attributes = await prisma.rpgAttribute.findMany({
      where: {
        systemName,
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

    return successResponse({
      systemName,
      attributes,
      platform: 'discord',
      discordUserId: context.platformUserId,
    })
  } catch (error) {
    console.error('Error fetching attributes:', error)
    return errorResponse('Failed to fetch attributes', 500)
  }
}
