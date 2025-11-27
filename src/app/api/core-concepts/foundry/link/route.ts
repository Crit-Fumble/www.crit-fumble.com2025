/**
 * Core Concepts API - Foundry Platform - Link Actor
 *
 * POST /api/core-concepts/foundry/link
 * Links a Foundry VTT actor to a Core Concepts creature (character)
 *
 * DELETE /api/core-concepts/foundry/link
 * Unlinks a Foundry VTT actor from a creature
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  validatePlatformAuth,
  errorResponse,
  successResponse,
} from '@/lib/core-concepts-api'

export async function POST(request: NextRequest) {
  // Validate Foundry platform authentication
  const authResult = await validatePlatformAuth(request, 'foundry')
  if ('error' in authResult) {
    return errorResponse(authResult.error, authResult.status)
  }

  const { context } = authResult

  try {
    const body = await request.json()
    const { creatureId, foundryActorId, foundryActorName, worldId, systemId } = body as {
      creatureId: string
      foundryActorId: string
      foundryActorName?: string
      worldId?: string
      systemId?: string
    }

    if (!creatureId || !foundryActorId) {
      return errorResponse('creatureId and foundryActorId are required', 400)
    }

    // Verify the creature belongs to the user (via player)
    const creature = await prisma.rpgCreature.findFirst({
      where: {
        id: creatureId,
        deletedAt: null,
        player: {
          userId: context.userId,
        },
      },
    })

    if (!creature) {
      return errorResponse('Character not found or access denied', 404)
    }

    // Check if this Foundry actor is already linked to another creature
    // We search via tags JSON field
    const existingLink = await prisma.rpgCreature.findFirst({
      where: {
        id: { not: creatureId },
        deletedAt: null,
        player: {
          userId: context.userId,
        },
        tags: {
          path: ['foundry', 'actorId'],
          equals: foundryActorId,
        },
      },
    })

    if (existingLink) {
      return errorResponse(
        `This Foundry actor is already linked to character "${existingLink.name}"`,
        409
      )
    }

    // Update creature with Foundry link in tags
    const currentTags = creature.tags as Record<string, unknown> || {}
    const updated = await prisma.rpgCreature.update({
      where: { id: creatureId },
      data: {
        tags: {
          ...currentTags,
          foundry: {
            actorId: foundryActorId,
            actorName: foundryActorName,
            worldId,
            systemId,
            linkedAt: new Date().toISOString(),
            linkedBy: context.platformUserId || context.userId,
          },
        },
      },
    })

    return successResponse({
      creatureId: updated.id,
      characterName: updated.name,
      foundryActorId,
      foundryActorName,
      linked: true,
      platform: 'foundry',
    })
  } catch (error) {
    console.error('Error linking actor:', error)
    return errorResponse('Failed to link actor', 500)
  }
}

export async function DELETE(request: NextRequest) {
  // Validate Foundry platform authentication
  const authResult = await validatePlatformAuth(request, 'foundry')
  if ('error' in authResult) {
    return errorResponse(authResult.error, authResult.status)
  }

  const { context } = authResult

  try {
    const body = await request.json()
    const { creatureId, foundryActorId } = body as {
      creatureId?: string
      foundryActorId?: string
    }

    if (!creatureId && !foundryActorId) {
      return errorResponse('creatureId or foundryActorId is required', 400)
    }

    // Find the creature to unlink
    const creature = await prisma.rpgCreature.findFirst({
      where: {
        deletedAt: null,
        player: {
          userId: context.userId,
        },
        ...(creatureId
          ? { id: creatureId }
          : {
              tags: {
                path: ['foundry', 'actorId'],
                equals: foundryActorId,
              },
            }),
      },
    })

    if (!creature) {
      return errorResponse('Character not found or not linked', 404)
    }

    // Remove Foundry link from tags - reset to empty array
    await prisma.rpgCreature.update({
      where: { id: creature.id },
      data: {
        tags: [],
      },
    })

    return successResponse({
      creatureId: creature.id,
      characterName: creature.name,
      unlinked: true,
      platform: 'foundry',
    })
  } catch (error) {
    console.error('Error unlinking actor:', error)
    return errorResponse('Failed to unlink actor', 500)
  }
}
