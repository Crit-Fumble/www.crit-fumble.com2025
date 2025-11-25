/**
 * Basic Hostile Behavior Script
 *
 * Simple rule-based AI for generic aggressive creatures.
 * No LLM or complex AI required - just if/else decision trees.
 *
 * Used by: Goblins, bandits, hostile animals, low-intelligence enemies
 */

import type { BehaviorScript, BehaviorContext, BehaviorAction, EntityToken } from '../types'

export const basicHostile: BehaviorScript = (
  creature: EntityToken,
  context: BehaviorContext
): BehaviorAction => {
  // Find nearest entity we have an opinion about
  const nearestEnemy = context.findNearest(e => {
    const attitude = creature.attitudes[e.id]
    return attitude !== undefined && attitude <= 50  // Hostile or neutral
  })

  // No enemies visible
  if (!nearestEnemy) {
    return { action: 'idle' }
  }

  const attitude = creature.attitudes[nearestEnemy.id] ?? 50
  const distance = context.getDistance(creature, nearestEnemy)

  // ========================================================================
  // HOSTILE (0-25): Attack on sight, pursue, fight to death
  // ========================================================================
  if (attitude <= 25) {
    // Prioritize wounded enemies (focus fire)
    const woundedEnemy = context.findNearest(e => {
      const attitude = creature.attitudes[e.id]
      return attitude !== undefined &&
        attitude <= 25 &&
        e.hp < e.maxHp * 0.5  // Below 50% HP
    })

    const target = woundedEnemy ?? nearestEnemy

    // Can we reach the target?
    if (distance <= creature.reach) {
      return { action: 'attack', target: target.id }
    }

    // Move toward target
    return {
      action: 'move',
      position: context.moveToward(creature, target)
    }
  }

  // ========================================================================
  // NEUTRAL (26-50): Defend territory, flee if wounded
  // ========================================================================
  if (attitude <= 50) {
    // Flee if critically wounded
    if (creature.hp < creature.maxHp * 0.3) {
      return {
        action: 'flee',
        direction: context.moveAway(creature, nearestEnemy)
      }
    }

    // Attack if enemy is within territory (30ft)
    if (distance <= 30) {
      if (distance <= creature.reach) {
        return { action: 'attack', target: nearestEnemy.id }
      }
      return {
        action: 'move',
        position: context.moveToward(creature, nearestEnemy)
      }
    }

    // Otherwise, stand ground
    return { action: 'idle' }
  }

  // ========================================================================
  // FRIENDLY (51-75): Avoid combat, defend self only
  // ========================================================================
  if (attitude <= 75) {
    // Only attack if we've been attacked this turn
    if (context.attackedBy?.includes(nearestEnemy.id)) {
      if (distance <= creature.reach) {
        return { action: 'attack', target: nearestEnemy.id }
      }
    }

    // Move away from threats
    if (distance < 15) {
      return {
        action: 'move',
        position: context.moveAway(creature, nearestEnemy)
      }
    }

    return { action: 'idle' }
  }

  // ========================================================================
  // LOYAL (76-100): Defend ally, follow commands
  // ========================================================================
  // Find our ally (entity with attitude > 75)
  const ally = context.findNearest(e => {
    const attitude = creature.attitudes[e.id]
    return attitude !== undefined && attitude > 75
  })

  if (!ally) {
    return { action: 'idle' }
  }

  // Find nearest threat to our ally
  const allyThreat = context.findNearest(e => {
    const attitude = ally.attitudes?.[e.id]
    return attitude !== undefined &&
      attitude <= 25 &&
      context.getDistance(ally, e) <= 30  // Within 30ft of ally
  })

  if (allyThreat) {
    const threatDistance = context.getDistance(creature, allyThreat)

    if (threatDistance <= creature.reach) {
      return { action: 'attack', target: allyThreat.id }
    }

    return {
      action: 'move',
      position: context.moveToward(creature, allyThreat)
    }
  }

  // No threats, follow ally
  const allyDistance = context.getDistance(creature, ally)
  if (allyDistance > 10) {
    return { action: 'follow', target: ally.id }
  }

  return { action: 'idle' }
}
