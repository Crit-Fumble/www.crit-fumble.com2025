/**
 * Creature Behavior System - Type Definitions
 *
 * All types for the rule-based behavior script system.
 * No AI/LLM dependencies - pure deterministic logic.
 */

// ============================================================================
// Core Types
// ============================================================================

export type Position = {
  x: number
  y: number
  z: number
}

export type EntityToken = {
  id: string
  position: Position
  type: 'player' | 'npc' | 'enemy' | 'ally'
  name: string

  // Combat stats
  hp: number
  maxHp: number
  ac: number
  reach: number  // Attack reach in feet (default 5)

  // Movement
  speed: number  // feet per round
  flying: boolean

  // Behavior
  script?: string  // Name of behavior script
  scriptConfig?: Record<string, any>
  scriptEnabled: boolean

  // Alignment metrics (affects behavior)
  lawfulness: number  // 0 = chaotic, 50 = neutral, 100 = lawful
  goodness: number    // 0 = evil, 50 = neutral, 100 = good

  // Attitudes: map of entity ID -> attitude score (0-100)
  attitudes: Record<string, number>

  // Manual GM control
  manualControl?: {
    override: boolean
    queuedAction?: BehaviorAction
  }

  // Faction (optional)
  faction?: string
}

export type HexTile = {
  x: number
  y: number
  z: number
  terrainType: string
  isBlocked: boolean
  isHazard: boolean  // Fire, lava, acid, etc.
}

// ============================================================================
// Behavior Context
// ============================================================================

export type BehaviorContext = {
  // Self
  self: EntityToken

  // Awareness (all entities this creature can see/sense)
  visibleEntities: EntityToken[]
  knownEnemies: EntityToken[]   // Attitude <= 50
  knownAllies: EntityToken[]    // Attitude > 50

  // Environment
  currentHex: HexTile
  nearbyHexes: HexTile[]  // Within movement range
  hazards: HexTile[]      // Dangerous terrain

  // Combat state
  inCombat: boolean
  initiative: number
  currentTurn: string  // Entity ID

  // Memory (what happened last turn)
  previousAction?: BehaviorAction
  damageLastTurn?: number
  attackedBy?: string[]  // Entity IDs that attacked this turn

  // Spatial query helpers
  findNearest: (filter: (e: EntityToken) => boolean) => EntityToken | null
  findInRange: (range: number, filter: (e: EntityToken) => boolean) => EntityToken[]
  getDistance: (from: EntityToken, to: EntityToken) => number
  canReach: (from: EntityToken, to: EntityToken) => boolean

  // Movement helpers
  moveToward: (from: EntityToken, to: EntityToken) => Position
  moveAway: (from: EntityToken, to: EntityToken) => Position
  findCover: (from: Position) => HexTile | null
}

// ============================================================================
// Behavior Actions
// ============================================================================

export type BehaviorAction =
  | AttackAction
  | MoveAction
  | FleeAction
  | HideAction
  | FollowAction
  | CastSpellAction
  | UseItemAction
  | InteractAction
  | IdleAction
  | PatrolAction
  | SearchAction
  | CallForHelpAction

export type AttackAction = {
  action: 'attack'
  target: string  // Entity ID
}

export type MoveAction = {
  action: 'move'
  position: Position
}

export type FleeAction = {
  action: 'flee'
  direction: Position  // Direction to flee toward
}

export type HideAction = {
  action: 'hide'
  position: Position  // Where to hide
}

export type FollowAction = {
  action: 'follow'
  target: string      // Entity ID to follow
  distance?: number   // Preferred following distance (default 10ft)
}

export type CastSpellAction = {
  action: 'cast_spell'
  spell: string       // Spell name
  target?: string     // Entity ID (for targeted spells)
  position?: Position // Area target (for AoE spells)
}

export type UseItemAction = {
  action: 'use_item'
  item: string        // Item name (e.g., "potion_healing")
}

export type InteractAction = {
  action: 'interact'
  target: string      // Entity ID
  type: 'talk' | 'trade' | 'help' | 'pickpocket'
}

export type IdleAction = {
  action: 'idle'
}

export type PatrolAction = {
  action: 'patrol'
  waypoints: Position[]  // Patrol route
}

export type SearchAction = {
  action: 'search'
  area: HexTile[]  // Area to search
}

export type CallForHelpAction = {
  action: 'call_for_help'
  range: number  // Alert range in feet
}

// ============================================================================
// Behavior Script Function Type
// ============================================================================

export type BehaviorScript = (
  creature: EntityToken,
  context: BehaviorContext
) => BehaviorAction

// ============================================================================
// Attitude System
// ============================================================================

export type AttitudeRange = 'hostile' | 'neutral' | 'friendly' | 'loyal'

export function getAttitudeRange(attitude: number): AttitudeRange {
  if (attitude <= 25) return 'hostile'
  if (attitude <= 50) return 'neutral'
  if (attitude <= 75) return 'friendly'
  return 'loyal'
}

export enum AttitudeEventType {
  ATTACKED = 'attacked',                    // -30
  ATTACKED_ALLY = 'attacked_ally',          // -20
  HEALED = 'healed',                        // +15
  OFFERED_GIFT = 'offered_gift',            // +10
  DEFENDED = 'defended',                    // +20
  INSULTED = 'insulted',                    // -15
  COMPLETED_QUEST = 'completed_quest',      // +25
  TRESPASSED = 'trespassed',                // -10
  STOLE = 'stole',                          // -25
  HELPED = 'helped',                        // +10
}

export type AttitudeChangeEvent = {
  source: string          // Entity ID that triggered event
  target: string          // Entity ID affected
  eventType: AttitudeEventType
  modifier: number        // Change to attitude (-30 to +30)
}

export const ATTITUDE_MODIFIERS: Record<AttitudeEventType, number> = {
  [AttitudeEventType.ATTACKED]: -30,
  [AttitudeEventType.ATTACKED_ALLY]: -20,
  [AttitudeEventType.HEALED]: +15,
  [AttitudeEventType.OFFERED_GIFT]: +10,
  [AttitudeEventType.DEFENDED]: +20,
  [AttitudeEventType.INSULTED]: -15,
  [AttitudeEventType.COMPLETED_QUEST]: +25,
  [AttitudeEventType.TRESPASSED]: -10,
  [AttitudeEventType.STOLE]: -25,
  [AttitudeEventType.HELPED]: +10,
}

// ============================================================================
// Script Configuration
// ============================================================================

export type ScriptConfig = {
  // Common configs for all scripts
  aggressionLevel?: number    // 0-100 (higher = more aggressive)
  fleeThreshold?: number      // HP percentage to flee (default 25%)
  callForHelpRange?: number   // Range to alert allies (default 30ft)
  pursuitRange?: number       // Max distance to pursue (default 60ft)

  // Script-specific configs
  [key: string]: any
}
