/**
 * Goblin Raider Behavior Script
 *
 * Pack tactics, cowardly behavior, calls for help.
 * Pure rule-based logic - no AI required.
 *
 * Used by: Goblins, kobolds, cowardly humanoids
 */

import type { BehaviorScript, BehaviorContext, BehaviorAction, EntityToken } from '../types'

export const goblinRaider: BehaviorScript = (
  creature: EntityToken,
  context: BehaviorContext
): BehaviorAction => {
  const config = creature.scriptConfig ?? {}
  const fleeThreshold = config.fleeThreshold ?? 3  // Flee at 3 HP or below
  const callForHelpRange = config.callForHelpRange ?? 30

  // Count nearby allies and enemies
  const nearbyAllies = context.findInRange(15, e => {
    const attitude = creature.attitudes[e.id]
    return attitude !== undefined && attitude > 50
  })

  const nearbyEnemies = context.findInRange(30, e => {
    const attitude = creature.attitudes[e.id]
    return attitude !== undefined && attitude <= 25
  })

  const nearestEnemy = nearbyEnemies[0] ?? context.findNearest(e => {
    const attitude = creature.attitudes[e.id]
    return attitude !== undefined && attitude <= 50
  })

  if (!nearestEnemy) {
    return { action: 'idle' }
  }

  const attitude = creature.attitudes[nearestEnemy.id] ?? 50
  const distance = context.getDistance(creature, nearestEnemy)

  // ========================================================================
  // COWARDLY BEHAVIOR: Flee if wounded or outnumbered
  // ========================================================================

  // Flee if critically wounded
  if (creature.hp <= fleeThreshold) {
    // Call for help before fleeing
    if (!context.previousAction || context.previousAction.action !== 'call_for_help') {
      return { action: 'call_for_help', range: callForHelpRange }
    }

    return {
      action: 'flee',
      direction: context.moveAway(creature, nearestEnemy)
    }
  }

  // Flee if outnumbered 2:1
  if (nearbyEnemies.length >= nearbyAllies.length * 2 && nearbyEnemies.length > 1) {
    return {
      action: 'flee',
      direction: context.moveAway(creature, nearestEnemy)
    }
  }

  // ========================================================================
  // HOSTILE (0-25): Pack tactics, focus fire
  // ========================================================================
  if (attitude <= 25) {
    // Call for help if wounded
    if (creature.hp < creature.maxHp * 0.5) {
      const hasCalledRecently = context.previousAction?.action === 'call_for_help'
      if (!hasCalledRecently) {
        return { action: 'call_for_help', range: callForHelpRange }
      }
    }

    // PACK TACTICS: Target same enemy as nearby ally
    let target = nearestEnemy

    // Check if any ally is already fighting an enemy
    for (const ally of nearbyAllies) {
      // If ally attacked someone last turn, target that enemy
      const allyTarget = findAllyTarget(ally, nearbyEnemies, context)
      if (allyTarget) {
        target = allyTarget
        break
      }
    }

    // Can we reach the target?
    const targetDistance = context.getDistance(creature, target)
    if (targetDistance <= creature.reach) {
      return { action: 'attack', target: target.id }
    }

    // Move toward target
    return {
      action: 'move',
      position: context.moveToward(creature, target)
    }
  }

  // ========================================================================
  // NEUTRAL (26-50): Demand tribute, threaten
  // ========================================================================
  if (attitude <= 50) {
    // Opportunistic: attack if outnumber enemy 2:1
    if (nearbyAllies.length >= nearbyEnemies.length * 2) {
      if (distance <= creature.reach) {
        return { action: 'attack', target: nearestEnemy.id }
      }
      return {
        action: 'move',
        position: context.moveToward(creature, nearestEnemy)
      }
    }

    // Demand tribute (interact action - would trigger dialogue)
    if (distance <= 30 && distance > 10) {
      return {
        action: 'interact',
        target: nearestEnemy.id,
        type: 'talk'  // GM can handle "Drop your gold!" dialogue
      }
    }

    // Keep distance
    if (distance < 10) {
      return {
        action: 'move',
        position: context.moveAway(creature, nearestEnemy)
      }
    }

    return { action: 'idle' }
  }

  // ========================================================================
  // FRIENDLY (51-75): Trade, provide info (unreliable)
  // ========================================================================
  if (attitude <= 75) {
    // Approach for trade
    if (distance > 10) {
      return {
        action: 'move',
        position: context.moveToward(creature, nearestEnemy)
      }
    }

    // Offer trade/information
    return {
      action: 'interact',
      target: nearestEnemy.id,
      type: 'trade'
    }
  }

  // ========================================================================
  // LOYAL (76-100): Serve as scout/spy
  // ========================================================================
  const ally = context.findNearest(e => {
    const attitude = creature.attitudes[e.id]
    return attitude !== undefined && attitude > 75
  })

  if (!ally) {
    return { action: 'idle' }
  }

  // Scout ahead for threats
  const scoutRange = 30
  const threat = context.findNearest(e => {
    const attitude = ally.attitudes?.[e.id]
    return attitude !== undefined &&
      attitude <= 25 &&
      context.getDistance(ally, e) <= scoutRange
  })

  if (threat) {
    // Alert ally to threat
    return { action: 'call_for_help', range: scoutRange }
  }

  // Follow ally at distance (scout position)
  const allyDistance = context.getDistance(creature, ally)
  if (allyDistance > 15) {
    return { action: 'follow', target: ally.id, distance: 15 }
  }
  if (allyDistance < 10) {
    return {
      action: 'move',
      position: context.moveAway(creature, ally)
    }
  }

  return { action: 'idle' }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find the enemy that an ally is currently targeting
 * (based on proximity and facing)
 */
function findAllyTarget(
  ally: EntityToken,
  possibleTargets: EntityToken[],
  context: BehaviorContext
): EntityToken | null {
  // Find closest enemy to ally within melee range
  let closestEnemy: EntityToken | null = null
  let closestDistance = Infinity

  for (const enemy of possibleTargets) {
    const distance = context.getDistance(ally, enemy)
    if (distance <= ally.reach && distance < closestDistance) {
      closestEnemy = enemy
      closestDistance = distance
    }
  }

  return closestEnemy
}
