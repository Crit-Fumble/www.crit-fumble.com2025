# Event (Core Concept)

## Overview

An **Event** is an occurrence that happens automatically when specific conditions are met. Events are things that **HAPPEN**, as opposed to Activities (things creatures **DO**).

This is a **system-agnostic** core concept that can be extended by specific TTRPG system implementations.

## Definition

### Event Characteristics
- **Automatic**: Happens when conditions are met (no creature choice required)
- **Triggered**: Has specific trigger conditions
- **Instantaneous or State-Based**: Either happens immediately or persists while conditions are true
- **Consequential**: Changes game state, triggers other events, or affects creatures/objects

### Event vs Activity
- **Event**: Something **HAPPENS** (automatic when conditions met)
- **Activity**: Creature **DOES** something (requires choice and agency)

### Event vs Condition
- **Event**: Discrete occurrence at a point in time
- **Condition**: Ongoing state that persists over time

## Core Event Properties

All TTRPG events share these fundamental properties:

### Classification
- **Category**: Type of event (combat, environmental, time-based, etc.)
- **Trigger Type**: What causes the event
- **Duration**: Instantaneous or state-based

### Triggering
- **Trigger Condition**: What must be true for event to occur
- **Automatic**: Whether event happens without intervention
- **Resistible**: Whether event can be prevented or avoided

### Effects
- **Immediate Effects**: What happens when event triggers
- **Ongoing Effects**: What happens while event persists (state-based only)
- **End Conditions**: What ends a state-based event

### Cascading
- **Triggers Other Events**: Events that this event causes
- **Triggered By**: Events or activities that cause this event

## Core Event Schema

```typescript
/**
 * System-agnostic event trigger type
 */
type EventTrigger =
  | 'automatic'        // Happens automatically when conditions met
  | 'dice_roll'        // Triggered by specific dice roll result
  | 'time_based'       // Triggered by passage of time
  | 'condition_based'  // Triggered by specific game state
  | 'location_based'   // Triggered by entering location
  | 'activity_result'  // Triggered by result of activity
  | 'threshold'        // Triggered when value crosses threshold
  | 'manual';          // Triggered by GM/player decision

/**
 * System-agnostic event duration type
 */
type EventDuration =
  | 'instantaneous'    // Happens immediately and ends
  | 'state_based'      // Continues while condition is true
  | 'time_limited';    // Lasts for specific duration

/**
 * System-agnostic event category
 */
type EventCategory =
  | 'combat'           // Combat-related events
  | 'environmental'    // Environmental hazards/effects
  | 'time'             // Time passage events
  | 'mechanical'       // Game mechanic events
  | 'social'           // Social interaction events
  | 'exploration'      // Discovery/exploration events
  | 'rest'             // Rest-related events
  | 'downtime'         // Downtime-related events
  | 'character'        // Character state changes
  | 'world';           // World state changes

/**
 * Core event definition (system-agnostic)
 */
interface GameEvent {
  id: string;
  name: string;
  description: string;

  // Classification
  category: EventCategory;
  triggerType: EventTrigger;
  duration: EventDuration;

  // Trigger Conditions
  trigger: {
    condition: string;           // Description of what triggers the event
    automatic: boolean;           // If true, happens without creature action
    resistible: boolean;          // If true, can be prevented/avoided
    checkRequired?: {            // If resistible, what check
      type: 'save' | 'check' | 'contest';
      against?: string;          // What creature rolls against
    };
  };

  // Effects
  effects: {
    immediate?: string[];        // What happens when triggered
    ongoing?: string[];          // What happens during (state-based only)
    onEnd?: string[];            // What happens when ends (state-based only)
  };

  // State-based specific
  stateBased?: {
    persistWhile: string;        // Condition that must remain true
    endWhen: string;             // Condition that ends the event
  };

  // Time-based specific
  timeBased?: {
    interval?: string;           // How often event repeats
    duration?: string;           // How long event lasts
  };

  // Cascading
  cascade?: {
    triggersEvents?: string[];   // Event IDs triggered by this
    triggeredBy?: string[];      // Event/Activity IDs that trigger this
    preventedBy?: string[];      // Activity/Condition IDs that prevent this
  };

  // Related Concepts
  affectedBy?: {
    locations?: string[];        // Location IDs that modify this event
    facilities?: string[];       // Facility IDs that prevent/modify this
    equipment?: string[];        // Equipment that prevents/modifies this
  };

  // System extensions
  system?: Record<string, unknown>; // System-specific properties
}
```

## Common Event Categories

### Combat Events
**Characteristics**:
- Trigger during combat
- Often instantaneous
- Affect creature hit points, conditions, or position
- May cascade (attack → hit → damage → unconsciousness → death)

**Examples**:
- Initiative rolled
- Attack hits/misses
- Damage taken
- Critical hit
- Death
- Unconsciousness

### Environmental Events
**Characteristics**:
- Triggered by location or environmental conditions
- Often state-based (persist while in environment)
- Resistible via saves or equipment
- Can be prevented by facilities

**Examples**:
- Extreme cold damage
- Extreme heat exhaustion
- Falling damage
- Suffocation
- Drowning
- Starvation
- Dehydration

### Time Events
**Characteristics**:
- Triggered by passage of time
- Predictable intervals
- Often trigger other events
- Affect world state

**Examples**:
- Round ends
- Turn ends
- Hour passes
- Day/night cycle
- Sunrise/sunset
- Spell duration expires
- Condition duration expires

### Mechanical Events
**Characteristics**:
- Triggered by game rules
- Often involve dice rolls or thresholds
- Can cascade extensively
- Modify creature/object state

**Examples**:
- Level up (XP threshold)
- Saving throw required
- Ability check required
- Proficiency bonus increases
- Condition applied
- Condition removed
- Advantage/disadvantage granted

### Social Events
**Characteristics**:
- Result of social interactions
- Often change relationship states
- May have lasting consequences
- Can trigger narrative branches

**Examples**:
- Attitude change (hostile → neutral)
- Reputation gained/lost
- Alliance formed
- Contract agreed
- Oath sworn
- Trust broken

### Exploration Events
**Characteristics**:
- Triggered by location or discovery
- Often one-time occurrences
- May initiate new situations
- Reveal information

**Examples**:
- Trap triggered
- Secret door discovered
- Hidden object found
- Ambush initiated
- Random encounter
- Hazard encountered

### Rest Events
**Characteristics**:
- Triggered during or at completion of rest
- Grant mechanical benefits
- Can be interrupted by other events
- Restore resources

**Examples**:
- Short rest completed
- Long rest completed
- Hit points restored
- Spell slots recovered
- Exhaustion reduced
- Rest interrupted

### Character Events
**Characteristics**:
- Affect individual creature state
- Often triggered by thresholds
- May be permanent or temporary
- Impact creature capabilities

**Examples**:
- Ability score increase
- Proficiency gained
- Feature unlocked
- Multiclass acquired
- Background event
- Character arc milestone

## Event Lifecycle

### 1. Trigger Evaluation
```
Condition Check → Trigger Met? → Yes → Proceed to Step 2
                               → No → Event does not occur
```

### 2. Resistance Check (if resistible)
```
Saving Throw/Check → Success? → Yes → Event prevented/reduced
                              → No → Proceed to Step 3
```

### 3. Event Occurrence
```
Instantaneous → Apply immediate effects → Done
State-Based → Apply immediate effects → Begin persistence → Monitor end conditions
Time-Limited → Apply immediate effects → Schedule end time → Apply ongoing effects
```

### 4. Cascade Resolution
```
Check for triggered events → Evaluate each → Repeat from Step 1 for each
```

### 5. State-Based Persistence (if applicable)
```
Each round/turn/interval:
  Check persist condition → Still true? → Yes → Apply ongoing effects
                                       → No → End event, apply end effects
```

## Integration Points

### With Activity System
Events can:
- **Be Triggered by Activities**: Combat activity → Damage event
- **Interrupt Activities**: Damage event → Interrupts rest activity
- **Be Prevented by Activities**: Standing watch activity → Detects ambush event early

### With Location System
Events can:
- **Be Location-Specific**: Extreme cold event only in arctic locations
- **Be Modified by Facilities**: Warmth facility prevents cold exposure event
- **Change Locations**: Earthquake event damages structures

### With Time System
Events can:
- **Be Time-Triggered**: Spell expiration event at specific game time
- **Advance Time**: Long rest completion event advances 8 hours
- **Repeat on Intervals**: Hourly environmental damage events

### With Creature System
Events can:
- **Affect Creatures**: Damage events reduce HP
- **Be Resisted by Creatures**: Saving throw determines event outcome
- **Track Creature State**: Event log shows what happened to creature

## Event Logging

All events should be logged for game history tracking:

```typescript
interface EventLog {
  timestamp: number;             // Game time when occurred
  eventId: string;               // Event definition ID
  targets: string[];             // Creature/object UUIDs affected
  source?: string;               // What triggered the event
  results?: {
    resistanceRolls?: {
      targetId: string;
      roll: number;
      success: boolean;
    }[];
    effectsApplied?: {
      targetId: string;
      effect: string;
      value?: number;
    }[];
  };
  cascaded?: string[];           // Event IDs this triggered
}
```

## System-Specific Extensions

TTRPG systems should extend the core Event concept with system-specific properties:

### D&D 5e Extension Example
```typescript
interface DnD5eEvent extends GameEvent {
  system: {
    "dnd5e": {
      // 5e-specific properties
      damage?: {
        amount: string;          // Dice formula (e.g., "1d6")
        type: string;            // Damage type
      };
      savingThrow?: {
        ability: 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';
        dc: number | string;     // DC value or formula
      };
      conditionApplied?: string; // Condition name
      interruptsRest?: boolean;
      triggersInitiative?: boolean;
    }
  }
}
```

### Pathfinder 2e Extension Example
```typescript
interface Pathfinder2eEvent extends GameEvent {
  system: {
    "pf2e": {
      // Pathfinder 2e-specific properties
      degreeOfSuccess?: 'critical_success' | 'success' | 'failure' | 'critical_failure';
      actionCost?: number;       // Actions triggered
      traits?: string[];         // Event traits
    }
  }
}
```

## Implementation Guidelines

### For Core Concepts Module
1. Define base Event interface
2. Provide common event categories
3. Establish event lifecycle
4. Define event logging structure
5. Document integration with other concepts

### For System Modules (e.g., foundry-core-srd-5e)
1. Import core Event interface
2. Extend with system-specific properties
3. Implement system-specific events
4. Define cascade relationships
5. Create event data files

### For Campaign Modules (e.g., foundry-cfg-5e)
1. Import system events
2. Add campaign-specific events
3. Implement event tracking/logging
4. Create UI for event history
5. Automate event cascade resolution

## Usage Examples

### Creating a System-Agnostic Event
```typescript
const sunriseEvent: GameEvent = {
  id: 'event-sunrise',
  name: 'Sunrise',
  description: 'The sun rises, bringing daylight',
  category: 'time',
  triggerType: 'time_based',
  duration: 'instantaneous',
  trigger: {
    condition: 'Game time reaches dawn time for current location',
    automatic: true,
    resistible: false
  },
  effects: {
    immediate: ['Light level changes to bright', 'Darkvision advantage lost']
  },
  timeBased: {
    interval: '24 hours'
  },
  cascade: {
    triggersEvents: ['event-nocturnal-creatures-rest']
  }
};
```

### Extending for D&D 5e
```typescript
const dnd5eFallingEvent: DnD5eEvent = {
  id: 'event-falling-damage',
  name: 'Falling Damage',
  description: 'Creature takes damage from falling',
  category: 'environmental',
  triggerType: 'automatic',
  duration: 'instantaneous',
  trigger: {
    condition: 'Creature falls 10 or more feet',
    automatic: true,
    resistible: false
  },
  effects: {
    immediate: ['Take bludgeoning damage', 'Land prone']
  },
  system: {
    "dnd5e": {
      damage: {
        amount: '1d6 per 10 feet (max 20d6)',
        type: 'bludgeoning'
      },
      conditionApplied: 'prone'
    }
  }
};
```

## Related Core Concepts

- **[Activity](ACTIVITY.md)**: Things creatures DO (vs events that HAPPEN)
- **[Location](LOCATION.md)**: Where events occur, can trigger or prevent events
- **[Time](TIME.md)**: When events occur, triggers time-based events
- **[Creature](CREATURE.md)**: Targets of events, event resistance

## See Also

- System implementations: `foundry-core-srd-5e/docs/EVENT-SYSTEM.md`
- Campaign implementations: `foundry-cfg-5e/docs/EVENT-TRACKING.md`
