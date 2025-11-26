/**
 * Core Concepts API - Foundry Platform - Characters
 *
 * GET /api/core-concepts/foundry/characters
 * Returns characters (RpgCreatures) for the authenticated user that can be linked to Foundry actors
 *
 * POST /api/core-concepts/foundry/characters
 * Creates a new character from Foundry VTT data
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
  const worldId = searchParams.get('worldId')
  const unlinkedOnly = searchParams.get('unlinkedOnly') === 'true'

  try {
    // Get player characters for the user
    const creatures = await prisma.rpgCreature.findMany({
      where: {
        deletedAt: null,
        player: {
          userId: context.userId,
        },
        ...(worldId ? { worldId } : {}),
      },
      select: {
        id: true,
        name: true,
        race: true,
        class: true,
        level: true,
        imageUrl: true,
        worldId: true,
        tags: true, // Using tags to store Foundry link data
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    })

    // Filter and transform for Foundry
    const foundryCharacters = creatures
      .filter((creature) => {
        if (!unlinkedOnly) return true
        const tags = creature.tags as Record<string, unknown> | null
        return !tags?.foundry // Only unlinked creatures
      })
      .map((creature) => {
        const tags = creature.tags as Record<string, unknown> | null
        const foundryData = tags?.foundry as Record<string, unknown> | undefined

        return {
          id: creature.id,
          name: creature.name,
          race: creature.race,
          class: creature.class,
          level: creature.level,
          imageUrl: creature.imageUrl,
          worldId: creature.worldId,
          // Foundry link status
          linked: !!foundryData?.actorId,
          foundryActorId: foundryData?.actorId,
          foundryActorName: foundryData?.actorName,
          foundryWorldId: foundryData?.worldId,
          lastSyncedAt: foundryData?.lastSyncedAt,
        }
      })

    return successResponse({
      characters: foundryCharacters,
      platform: 'foundry',
      foundryUserId: context.platformUserId,
    })
  } catch (error) {
    console.error('Error fetching characters:', error)
    return errorResponse('Failed to fetch characters', 500)
  }
}

export async function POST(request: NextRequest) {
  // Validate Foundry platform authentication
  const authResult = await validatePlatformAuth(request, 'foundry')
  if ('error' in authResult) {
    return errorResponse(authResult.error, authResult.status)
  }

  const { context } = authResult

  try {
    const body = await request.json()
    const {
      name,
      race,
      characterClass,
      level,
      worldId,
      foundryActorId,
      foundryActorName,
      foundryWorldId,
      systemId,
    } = body as {
      name: string
      race?: string
      characterClass?: string
      level?: number
      worldId?: string
      foundryActorId?: string
      foundryActorName?: string
      foundryWorldId?: string
      systemId?: string
    }

    if (!name) {
      return errorResponse('name is required', 400)
    }

    // Get or create the player record for this user
    let player = await prisma.rpgPlayer.findFirst({
      where: {
        userId: context.userId,
        deletedAt: null,
      },
    })

    if (!player) {
      // Create a player record for this user
      player = await prisma.rpgPlayer.create({
        data: {
          userId: context.userId,
          displayName: 'Player', // Will be updated from user profile
        },
      })
    }

    // Create character (creature) with optional Foundry link in tags
    const creature = await prisma.rpgCreature.create({
      data: {
        name,
        race,
        class: characterClass,
        level: level || 1,
        playerId: player.id,
        worldId,
        tags: foundryActorId
          ? {
              foundry: {
                actorId: foundryActorId,
                actorName: foundryActorName,
                worldId: foundryWorldId,
                systemId,
                linkedAt: new Date().toISOString(),
                linkedBy: context.platformUserId || context.userId,
              },
            }
          : [],
      },
    })

    return successResponse(
      {
        character: {
          id: creature.id,
          name: creature.name,
          race: creature.race,
          class: creature.class,
          level: creature.level,
          linked: !!foundryActorId,
          foundryActorId,
        },
        platform: 'foundry',
      },
      201
    )
  } catch (error) {
    console.error('Error creating character:', error)
    return errorResponse('Failed to create character', 500)
  }
}
