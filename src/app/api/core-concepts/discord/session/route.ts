/**
 * Core Concepts API - Discord Platform - Session
 *
 * GET /api/core-concepts/discord/session
 * Returns RPG sessions for the authenticated user
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
  const sessionId = searchParams.get('sessionId')
  const campaignId = searchParams.get('campaignId')

  try {
    // If sessionId provided, get that specific session
    if (sessionId) {
      const session = await prisma.rpgSession.findFirst({
        where: {
          id: sessionId,
          deletedAt: null,
        },
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
              ownerId: true,
            },
          },
        },
      })

      if (!session) {
        return errorResponse('Session not found', 404)
      }

      return successResponse({
        session: {
          id: session.id,
          sessionNumber: session.sessionNumber,
          sessionTitle: session.sessionTitle,
          sessionDate: session.sessionDate,
          systemName: session.systemName,
          campaignId: session.campaignId,
          campaignName: session.campaignName,
          summary: session.summary,
          metadata: session.metadata,
        },
        platform: 'discord',
        discordUserId: context.platformUserId,
      })
    }

    // Get sessions for a campaign or all user's sessions
    const sessions = await prisma.rpgSession.findMany({
      where: {
        deletedAt: null,
        ...(campaignId ? { campaignId } : {}),
      },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
      },
      orderBy: { sessionDate: 'desc' },
      take: 20,
    })

    return successResponse({
      sessions: sessions.map((s) => ({
        id: s.id,
        sessionNumber: s.sessionNumber,
        sessionTitle: s.sessionTitle,
        sessionDate: s.sessionDate,
        systemName: s.systemName,
        campaignId: s.campaignId,
        campaignName: s.campaignName,
      })),
      platform: 'discord',
      discordUserId: context.platformUserId,
    })
  } catch (error) {
    console.error('Error fetching session:', error)
    return errorResponse('Failed to fetch session', 500)
  }
}
