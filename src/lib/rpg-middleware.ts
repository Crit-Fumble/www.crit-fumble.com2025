/**
 * RPG API Middleware
 *
 * Helper functions for RPG routes that depend on Core Concepts database
 */

import { NextResponse } from 'next/server'
import { prismaConcepts, coreConceptsAvailable } from '@/lib/db'

/**
 * Check if Core Concepts is available
 * Returns error response if unavailable, null if available
 */
export function checkCoreConceptsAvailability(): NextResponse | null {
  if (!prismaConcepts || !coreConceptsAvailable) {
    return NextResponse.json(
      {
        error: 'Core Concepts RPG features are temporarily unavailable',
        message: 'The RPG database is currently offline. Please try again later.',
      },
      { status: 503 }
    )
  }
  return null
}

/**
 * Wrapper for RPG route handlers that automatically checks Core Concepts availability
 *
 * @example
 * export const GET = withCoreConceptsCheck(async (request) => {
 *   // prismaConcepts is guaranteed to be available here
 *   const data = await prismaConcepts.rpgCampaign.findMany()
 *   return NextResponse.json({ data })
 * })
 */
export function withCoreConceptsCheck<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const availabilityCheck = checkCoreConceptsAvailability()
    if (availabilityCheck) {
      return availabilityCheck
    }

    try {
      return await handler(...args)
    } catch (error) {
      console.error('RPG route error:', error)
      return NextResponse.json(
        {
          error: 'An error occurred while processing your request',
          details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
        },
        { status: 500 }
      )
    }
  }
}
