# Activity (Core Concept)

## Overview

An **Activity** is an intentional action taken by a creature that requires agency, choice, and has a controllable duration. Activities are things creatures **DO**, as opposed to Events (things that **HAPPEN**).

This is a **system-agnostic** core concept that can be extended by specific TTRPG system implementations.

## Definition

### Activity Characteristics
- **Intentional**: Requires creature choice/decision
- **Agency**: Creature controls when to start and stop
- **Duration**: Has a beginning and end controlled by the creature
- **Complexity**: More complex than a single action (typically multi-step or extended time)

### Activity vs Action
- **Action**: Single-step discrete task (e.g., Attack, Dash, Hide)
- **Activity**: Multi-step or extended task (e.g., Crafting, Reading, Travel, Standing Watch)

### Activity vs Event
- **Activity**: Creature **DOES** something (requires choice)
- **Event**: Something **HAPPENS** (automatic when conditions met)

## Core Activity Properties

All TTRPG activities share these fundamental properties:

### Classification
- **Intensity**: Physical/mental demand level
- **Category**: Type of activity (combat, social, mental, physical, etc.)
- **Modes**: Which gameplay modes allow this activity

### Duration
- **Minimum Duration**: Shortest meaningful period
- **Maximum Duration**: Longest sustainable period (if any)
- **Interruptible**: Whether activity can be stopped mid-execution
- **Resumable**: Whether activity can continue after interruption

### Requirements
- **Prerequisites**: What creature needs to perform activity
- **Resources**: What is consumed during activity
- **Facilities**: Environmental requirements or enhancements

### Effects
- **Immediate Effects**: What happens when started
- **Ongoing Effects**: What happens during execution
- **Completion Effects**: What happens when finished
- **Interruption Effects**: What happens if stopped early

## Core Activity Schema

```typescript
/**
 * System-agnostic activity intensity classification
 */
type ActivityIntensity =
  | 'passive'      // Minimal physical/mental demand
  | 'light'        // Low physical/mental demand
  | 'moderate'     // Medium physical/mental demand
  | 'strenuous'    // High physical/mental demand
  | 'extreme';     // Maximum physical/mental demand

/**
 * System-agnostic activity category
 */
type ActivityCategory =
  | 'mental'       // Thinking, studying, planning
  | 'social'       // Interaction with other creatures
  | 'physical'     // Movement, exertion, athletics
  | 'sustenance'   // Eating, drinking, sleeping
  | 'vigilance'    // Watching, guarding, observing
  | 'crafting'     // Creating or modifying items
  | 'spellcasting' // Magical effects (system-specific)
  | 'combat'       // Fighting and tactical actions
  | 'rest'         // Recovery and recuperation
  | 'exploration'  // Discovery and investigation
  | 'travel';      // Movement between locations

/**
 * Gameplay mode during which activity occurs
 */
type GameplayMode =
  | 'combat'       // During structured combat
  | 'exploration'  // During investigation/discovery
  | 'social'       // During interaction/roleplay
  | 'downtime'     // During extended rest periods
  | 'rest'         // During short/long rest
  | 'travel';      // During movement between locations

/**
 * Core activity definition (system-agnostic)
 */
interface Activity {
  id: string;
  name: string;
  description: string;

  // Classification
  intensity: ActivityIntensity;
  category: ActivityCategory;
  modes: GameplayMode[];

  // Duration
  duration: {
    minimum?: string;          // Minimum time (e.g., "1 hour", "1 round")
    maximum?: string;          // Maximum time (e.g., "8 hours", "unlimited")
    typical?: string;          // Typical time spent
    interruptible: boolean;    // Can be stopped mid-execution
    resumable: boolean;        // Can continue after interruption
  };

  // Requirements
  requirements: {
    prerequisites?: string[];  // What's needed to start
    resources?: {              // What's consumed
      type: string;
      amount: string;
    }[];
    consciousness: boolean;    // Requires being conscious
    mobility?: 'none' | 'limited' | 'full'; // Movement requirement
  };

  // Effects (system-specific details in extensions)
  effects?: {
    onStart?: string;          // What happens when started
    ongoing?: string;          // What happens during
    onComplete?: string;       // What happens when finished
    onInterrupt?: string;      // What happens if interrupted
  };

  // Related concepts
  relatedActivities?: string[]; // Other activity IDs
  preventedBy?: string[];       // Event IDs that prevent this
  enables?: string[];           // Activity IDs this enables

  // System extensions
  system?: Record<string, unknown>; // System-specific properties
}
```

## Common Activity Categories

### Mental Activities
**Characteristics**:
- Low physical demand
- High mental demand
- Usually interruptible
- Often require materials (books, maps, etc.)

**Examples**:
- Reading
- Studying
- Planning
- Researching
- Memorizing

### Social Activities
**Characteristics**:
- Low to moderate physical demand
- Moderate mental demand
- Require other conscious creatures
- Success often depends on relationship/skill

**Examples**:
- Talking/Conversation
- Negotiating
- Performing
- Teaching
- Influencing

### Physical Activities
**Characteristics**:
- High physical demand
- Low to moderate mental demand
- May cause exhaustion
- Often have movement component

**Examples**:
- Walking/Travel
- Combat
- Athletics (climbing, swimming)
- Heavy labor
- Dancing

### Sustenance Activities
**Characteristics**:
- Essential for survival
- Low physical/mental demand
- Regular intervals required
- Consume resources (food/water)

**Examples**:
- Eating
- Drinking
- Sleeping
- Grooming

### Vigilance Activities
**Characteristics**:
- Low physical demand
- Moderate to high mental demand (alertness)
- Continuous perception required
- Enable detection of threats/events

**Examples**:
- Standing watch
- Guarding
- Sentry duty
- Observing

### Crafting Activities
**Characteristics**:
- Moderate physical/mental demand
- Require tools and materials
- Extended duration (hours to days)
- Produce tangible results

**Examples**:
- Creating items
- Repairing equipment
- Brewing potions
- Scribing scrolls
- Building structures

## Integration Points

### With Event System
Activities can:
- **Trigger Events**: Combat activity → Damage taken event
- **Be Interrupted by Events**: Crafting activity → Combat starts event
- **Prevent Events**: Rest activity + Shelter facility → Prevents exposure event

### With Location System
Activities can:
- **Require Locations**: Crafting may require workshop
- **Modify Locations**: Building activity creates new structures
- **Be Enhanced by Locations**: Inn facility improves rest activity effectiveness

### With Time System
Activities can:
- **Consume Time**: All activities advance game time
- **Be Time-Limited**: Maximum duration constraints
- **Trigger Time Events**: 8-hour rest → New day event

### With Creature System
Activities can:
- **Require Abilities**: Some activities need specific skills/proficiencies
- **Modify Creature State**: Rest restores HP, combat causes damage
- **Track Creature Actions**: Activity log shows what creature has done

## System-Specific Extensions

TTRPG systems should extend the core Activity concept with system-specific properties:

### D&D 5e Extension Example
```typescript
interface DnD5eActivity extends Activity {
  system: {
    "dnd5e": {
      // 5e-specific properties
      interruptsRest?: {
        short: boolean;
        long: boolean;
      };
      skillsUsed?: string[];        // Skill proficiencies
      abilityChecks?: string[];     // Ability checks required
      savingThrows?: string[];      // Saving throws required
      spellSlots?: number;          // Spell slots consumed
      actionEconomy?: 'action' | 'bonus' | 'reaction' | 'free';
    }
  }
}
```

### Pathfinder 2e Extension Example
```typescript
interface Pathfinder2eActivity extends Activity {
  system: {
    "pf2e": {
      // Pathfinder 2e-specific properties
      actions: number;              // Number of actions (1-3)
      traits: string[];             // Activity traits
      trigger?: string;             // Reaction trigger
      requirements?: string[];      // Specific requirements
    }
  }
}
```

## Implementation Guidelines

### For Core Concepts Module
1. Define base Activity interface
2. Provide common activity categories
3. Establish integration points with other core concepts
4. Document extension pattern for systems

### For System Modules (e.g., foundry-core-srd-5e)
1. Import core Activity interface
2. Extend with system-specific properties
3. Implement system-specific activities
4. Define system-specific activity rules (what interrupts what, etc.)
5. Create activity data files for all activities in system

### For Campaign Modules (e.g., foundry-cfg-5e)
1. Import system activities
2. Add campaign-specific custom activities
3. Implement automation and tracking
4. Create UI for activity management

## Usage Examples

### Creating a System-Agnostic Activity
```typescript
const readingActivity: Activity = {
  id: 'activity-reading',
  name: 'Reading',
  description: 'Studying texts, scrolls, maps, or other written materials',
  intensity: 'light',
  category: 'mental',
  modes: ['downtime', 'rest'],
  duration: {
    minimum: '5 minutes',
    interruptible: true,
    resumable: true
  },
  requirements: {
    prerequisites: ['Light source (if dark)', 'Literacy', 'Reading material'],
    consciousness: true,
    mobility: 'none'
  },
  effects: {
    onComplete: 'Information gained from material'
  }
};
```

### Extending for D&D 5e
```typescript
const dnd5eReadingActivity: DnD5eActivity = {
  ...readingActivity,
  system: {
    "dnd5e": {
      interruptsRest: {
        short: false,
        long: false  // Allowed during long rest (max 2 hours)
      },
      skillsUsed: ['Investigation', 'Arcana', 'History', 'Religion']
    }
  }
};
```

## Related Core Concepts

- **[Event](EVENT.md)**: Things that HAPPEN (vs activities that creatures DO)
- **[Location](LOCATION.md)**: Where activities take place, facilities that enhance activities
- **[Time](TIME.md)**: Duration tracking, activity scheduling
- **[Creature](CREATURE.md)**: Who performs activities, tracks activity state

## See Also

- System implementations: `foundry-core-srd-5e/docs/ACTIVITY-SYSTEM.md`
- Campaign implementations: `foundry-cfg-5e/docs/ACTIVITY-TRACKING.md`
