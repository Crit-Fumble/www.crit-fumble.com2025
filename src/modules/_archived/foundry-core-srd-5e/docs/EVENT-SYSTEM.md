# Event System

## Overview

The Event System captures things that **HAPPEN** in the game world, as opposed to the Activity System which captures things creatures **DO**. Events are triggered occurrences that affect the game state, often as results of activities, conditions, or game rules.

## Activity vs Event

### Activities (Things Creatures DO)
- **Definition**: Intentional actions taken by creatures
- **Agency**: Requires creature choice/decision
- **Duration**: Has a start and end controlled by the creature
- **Examples**: Reading, attacking, hiding, crafting, traveling
- **System**: Tracked in [ACTIVITY-SYSTEM.md](ACTIVITY-SYSTEM.md)

### Events (Things that HAPPEN)
- **Definition**: Occurrences triggered by game rules, conditions, or activities
- **Agency**: Happens automatically when conditions are met
- **Duration**: Instantaneous or state-based (ends when condition changes)
- **Examples**: Taking damage, rolling Initiative, death, sunrise/sunset, spell expiration
- **System**: Tracked in this document (EVENT-SYSTEM.md)

## Event Categories

### 1. Combat Events
Events that occur during combat encounters.

**Examples from SRD**:
- **Rolling Initiative**: Automatically triggered when combat starts
- **Taking Damage**: Result of successful attack or failed save
- **Death**: Triggered when creature fails death saves or HP drops below negative max HP
- **Unconsciousness**: Triggered when HP drops to 0
- **Opportunity Attack Trigger**: Movement provokes reaction
- **Concentration Break**: Triggered by damage or other conditions
- **Critical Hit**: Rolled natural 20 on attack roll
- **Critical Miss**: Rolled natural 1 on attack roll (if using variant rule)

**Properties**:
- Usually instantaneous
- Trigger combat-related rules
- May interrupt creature turns
- Often cause state changes (conditions, HP loss, etc.)

---

### 2. Rest Events
Events that occur during or related to rest periods.

**Examples from SRD**:
- **Rest Interruption**: Caused by Initiative, damage, spell casting, or 1hr exertion
- **Rest Completion**: Automatic when time elapses and conditions met
- **Short Rest Benefits Granted**: Automatic HP Die recovery when rest completes
- **Long Rest Benefits Granted**: Automatic HP/HD recovery, ability score restoration
- **Exhaustion Reduction**: Automatic after Long Rest completion
- **Spell Slot Recovery**: Automatic after Long Rest completion
- **Feature Recharge**: Automatic when rest type requirement is met

**Properties**:
- Time-based triggers
- Grant mechanical benefits
- Can be interrupted by other events
- State restoration

---

### 3. Environmental Events
Events triggered by environmental conditions or hazards.

**Examples from SRD**:
- **Extreme Cold Damage**: Triggered every hour in extreme cold without protection
- **Extreme Heat Exhaustion**: Triggered every hour in extreme heat without water
- **Falling Damage**: Triggered when creature falls (1d6 per 10 feet)
- **Suffocation**: Triggered when breath runs out
- **Burning Damage**: Triggered at start of turn while burning
- **Drowning**: Triggered when underwater without air
- **Starvation**: Triggered after days without food
- **Dehydration**: Triggered after days without water

**Properties**:
- Condition-based triggers
- Recurring (often hourly or per turn)
- Preventable by facilities or equipment
- Cause damage or conditions

---

### 4. Time Events
Events triggered by passage of time.

**Examples from SRD**:
- **Sunrise/Sunset**: Daily light level changes
- **Day/Night Cycle**: 24-hour period
- **Round End**: 6-second combat time
- **Turn End**: Individual creature turn in combat
- **Hour Passage**: Triggers rest interruption checks, environmental damage
- **Spell Duration Expiration**: Spell effect ends
- **Condition Duration Expiration**: Condition ends (e.g., Charmed until end of next turn)
- **Potion Effect Expiration**: Temporary effect ends

**Properties**:
- Automatic time-based triggers
- Predictable intervals
- May trigger other events (e.g., spell expiration may trigger concentration check)
- Game world state changes

---

### 5. Mechanical Events
Events triggered by game mechanics and rules.

**Examples from SRD**:
- **Level Up**: Triggered when XP threshold reached
- **Proficiency Bonus Increase**: Automatic when level threshold reached
- **Death Saves**: Triggered when unconscious at 0 HP
- **Saving Throw Required**: Triggered by spell, trap, or hazard
- **Ability Check Required**: Triggered by GM for task resolution
- **Attack Roll Required**: Triggered by taking Attack action
- **Advantage/Disadvantage Granted**: Triggered by conditions or circumstances
- **Exhaustion Gained**: Triggered by various conditions
- **Condition Applied**: Triggered by spell, attack, or environmental effect
- **Condition Removed**: Triggered by restoration, rest, or spell

**Properties**:
- Rule-based triggers
- Often require dice rolls
- Can cascade (one event triggers another)
- Modify creature state

---

### 6. Social Events
Events that occur during social interactions.

**Examples from SRD**:
- **Attitude Change**: NPC attitude shifts from Hostile to Indifferent or vice versa
- **Influence Success**: Result of successful Influence action
- **Deception Discovered**: Result of Insight check beating Deception
- **Charm Effect Begins**: Triggered by spell or ability
- **Charm Effect Ends**: Triggered by duration expiration or damage
- **Reaction Triggered**: NPC responds to player action or statement

**Properties**:
- Result of social activities or checks
- Change relationship states
- May be persistent (attitude) or temporary (charm)
- Narrative impact

---

### 7. Exploration Events
Events that occur during exploration and discovery.

**Examples from SRD**:
- **Trap Triggered**: Creature steps on pressure plate, opens trapped chest
- **Hidden Object Discovered**: Result of successful Perception/Investigation check
- **Secret Door Revealed**: Result of successful Investigation check
- **Ambush Initiated**: Hidden enemies reveal themselves
- **Hazard Encountered**: Party enters hazardous terrain
- **Random Encounter**: GM-triggered based on exploration rules
- **Exhaustion from Travel**: Triggered by forced march or harsh conditions

**Properties**:
- Discovery-based or location-based triggers
- Often result of checks (Perception, Investigation)
- May be one-time or recurring
- Reveal information or initiate new situations

---

### 8. Downtime Events
Events that occur during extended downtime periods.

**Examples from SRD**:
- **Crafting Completion**: Item finished after required days
- **Training Completion**: Proficiency or language learned
- **Research Discovery**: Information found after required time
- **Business Profit/Loss**: Weekly or monthly business operation result
- **Building Construction Complete**: Stronghold or structure finished
- **Lifestyle Expenses Due**: Weekly or monthly payment trigger
- **Complication**: Random event during downtime activity

**Properties**:
- Extended time periods (days, weeks, months)
- Result of downtime activities
- May have success/failure outcomes
- Affect resources (gold, time, reputation)

---

## Event Schema

```typescript
/**
 * Event trigger type
 */
type EventTrigger =
  | 'automatic'        // Happens automatically when conditions met
  | 'dice_roll'        // Triggered by specific dice roll result
  | 'time_based'       // Triggered by passage of time
  | 'condition_based'  // Triggered by specific game state
  | 'location_based'   // Triggered by entering location
  | 'action_result';   // Triggered by result of activity/action

/**
 * Event duration type
 */
type EventDuration =
  | 'instantaneous'    // Happens immediately and ends
  | 'state_based'      // Continues while condition is true
  | 'time_limited';    // Lasts for specific duration

/**
 * Complete event definition
 */
interface GameEvent {
  id: string;
  name: string;
  description: string;

  // Classification
  category: 'combat' | 'rest' | 'environmental' | 'time' | 'mechanical' | 'social' | 'exploration' | 'downtime';
  triggerType: EventTrigger;
  duration: EventDuration;

  // Trigger Conditions
  trigger: {
    condition: string;           // Description of what triggers the event
    automatic: boolean;           // If true, happens without creature action
    resistable: boolean;          // If true, can be prevented/avoided
    savingThrow?: {              // If resistable, what save
      ability: 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';
      dc: number | string;       // DC value or formula
    };
  };

  // Effects
  effects: {
    description: string;
    mechanicalEffect?: string;   // Specific game rule effect
    damage?: {
      amount: string;            // Dice formula (e.g., "1d6")
      type: string;              // Damage type
    };
    conditionApplied?: string[]; // Condition IDs
    stateChange?: string;        // Description of state change
  }[];

  // Prevention
  prevention?: {
    activities?: string[];       // Activity IDs that prevent this event
    facilities?: string[];       // Facility IDs that prevent this event
    equipment?: string[];        // Equipment that prevents this event
    conditions?: string[];       // Conditions that grant immunity
  };

  // SRD References
  srdReferences: {
    source: string;
    quote?: string;
    lineNumber?: number;
  }[];

  // Related Systems
  interruptsRest?: boolean;
  triggersInitiative?: boolean;
  cascadeEvents?: string[];      // Event IDs triggered by this event
}
```

## Event Examples

### Combat Event: Rolling Initiative

```json
{
  "id": "event-roll-initiative",
  "name": "Rolling Initiative",
  "description": "Combat begins and all participants roll for turn order",
  "category": "combat",
  "triggerType": "condition_based",
  "duration": "instantaneous",
  "trigger": {
    "condition": "Combat starts, whether by ambush, declaration, or hostile action",
    "automatic": true,
    "resistable": false
  },
  "effects": [
    {
      "description": "All combatants make a Dexterity check to determine Initiative order",
      "mechanicalEffect": "Determines turn order for combat rounds"
    },
    {
      "description": "Surprised combatants have Disadvantage on Initiative roll",
      "mechanicalEffect": "Disadvantage on Dexterity check if surprised"
    }
  ],
  "srdReferences": [
    {
      "source": "playingthegame/07-Combat.md",
      "quote": "When combat starts, every participant rolls Initiative",
      "lineNumber": 23
    },
    {
      "source": "rulesglossary/rulesdefinitions/96-LongRest.md",
      "quote": "Rolling Initiative" interrupts Long Rest,
      "lineNumber": 19
    }
  ],
  "interruptsRest": true,
  "triggersInitiative": true
}
```

### Environmental Event: Extreme Cold

```json
{
  "id": "event-extreme-cold-damage",
  "name": "Extreme Cold Damage",
  "description": "Exposure to extreme cold causes cold damage every hour",
  "category": "environmental",
  "triggerType": "time_based",
  "duration": "state_based",
  "trigger": {
    "condition": "At the end of each hour in extreme cold without protection",
    "automatic": true,
    "resistable": true,
    "savingThrow": {
      "ability": "CON",
      "dc": 10
    }
  },
  "effects": [
    {
      "description": "Creature takes cold damage on failed save",
      "damage": {
        "amount": "1d4",
        "type": "cold"
      }
    }
  ],
  "prevention": {
    "facilities": ["facility-warmth"],
    "equipment": ["Cold weather clothing", "Cold resistance"],
    "conditions": ["Immunity to cold damage"]
  },
  "srdReferences": [
    {
      "source": "gameplaytoolbox/03-EnvironmentalEffects.md",
      "quote": "A creature exposed to extreme cold must succeed on a DC 10 Constitution saving throw at the end of each hour or gain 1 Exhaustion level"
    }
  ]
}
```

### Rest Event: Long Rest Completion

```json
{
  "id": "event-long-rest-complete",
  "name": "Long Rest Completion",
  "description": "Benefits granted when a Long Rest successfully completes",
  "category": "rest",
  "triggerType": "time_based",
  "duration": "instantaneous",
  "trigger": {
    "condition": "8 hours of rest (6 sleep + 2 light activity) without more than 1 interruption per hour",
    "automatic": true,
    "resistable": false
  },
  "effects": [
    {
      "description": "Regain all lost Hit Points",
      "mechanicalEffect": "HP restored to maximum"
    },
    {
      "description": "Regain all spent Hit Point Dice",
      "mechanicalEffect": "Hit Dice restored to maximum"
    },
    {
      "description": "Reduce Exhaustion level by 1",
      "mechanicalEffect": "Exhaustion level decreases"
    },
    {
      "description": "Restore reduced ability scores",
      "mechanicalEffect": "Ability scores return to normal"
    },
    {
      "description": "Recharge features that require Long Rest",
      "mechanicalEffect": "Class/race features recharged"
    }
  ],
  "srdReferences": [
    {
      "source": "rulesglossary/rulesdefinitions/96-LongRest.md",
      "quote": "When you finish the rest, you gain the following benefits",
      "lineNumber": 7
    }
  ]
}
```

## Integration with Activity System

### Activities Can Trigger Events

**Example**: Taking the Attack action (activity) → Hit/Miss (event) → Damage taken (event)

**Flow**:
1. **Activity**: Creature takes Attack action
2. **Event**: Attack roll made (dice roll event)
3. **Event**: Hit or miss determined (mechanical event)
4. **Event**: If hit, damage dealt (combat event)
5. **Event**: If damage taken, concentration may break (cascade event)

### Events Can Interrupt Activities

**Example**: Long Rest (activity) → Taking damage (event) → Rest interrupted (event)

**Flow**:
1. **Activity**: Creature performs Long Rest
2. **Event**: Creature takes damage (combat event)
3. **Event**: Rest interruption (rest event)
4. **State Change**: Long Rest activity status changes to interrupted

### Events Can Enable Activities

**Example**: Sunrise (event) → End of Long Rest (event) → Can take new actions (activities available)

**Flow**:
1. **Event**: Sunrise occurs (time event)
2. **Event**: 8 hours elapsed, Long Rest completes (rest event)
3. **State Change**: Creature regains abilities, activities now available

## Foundry VTT Integration

### Event Tracking

```typescript
interface EventLog {
  "foundry-core-srd-5e": {
    events: {
      log: GameEventInstance[];
      activeConditions: ActiveConditionEvent[];
      pendingTriggers: PendingEvent[];
    }
  }
}

interface GameEventInstance {
  eventId: string;
  timestamp: number;           // Game time when occurred
  targetIds: string[];         // Actor/Item UUIDs affected
  triggeredBy?: string;        // Activity or Event ID that triggered this
  cascadedTo?: string[];       // Event IDs triggered by this event
  results?: {
    savingThrows?: {
      actorId: string;
      roll: number;
      success: boolean;
    }[];
    damageDealt?: {
      actorId: string;
      amount: number;
      type: string;
    }[];
    conditionsApplied?: {
      actorId: string;
      conditionId: string;
    }[];
  };
}

interface ActiveConditionEvent {
  eventId: string;
  startTime: number;
  endCondition: string;        // What ends this state-based event
  affectedActorIds: string[];
}

interface PendingEvent {
  eventId: string;
  triggerCondition: string;
  willTriggerAt?: number;      // Game time (for time-based)
  checkEachRound: boolean;     // For condition-based events
}
```

### Event Hooks

Foundry VTT hooks that can trigger events:

- `updateWorldTime` → Time events (sunrise, spell expiration)
- `createCombatant` → Roll Initiative event
- `updateActor` (HP change) → Damage taken, death, unconsciousness events
- `preCreateChatMessage` (damage roll) → Damage dealt event
- `updateCombat` (round/turn change) → Turn end, round end events

## Implementation Notes

1. **Event Logging**: Maintain chronological log of all events for game history
2. **Cascade Prevention**: Track event chains to prevent infinite loops
3. **State-Based Events**: Continuously check conditions, remove when no longer valid
4. **Time-Based Events**: Use game time system to schedule future events
5. **Event Priorities**: Define resolution order when multiple events trigger simultaneously

## Future Expansion (cfg-5e Module)

- **Event Chains**: Visual display of cascading events
- **Event History**: Searchable log of past events
- **Conditional Triggers**: Complex multi-condition event triggers
- **Event Templates**: Pre-configured event sets for common scenarios
- **Event Automation**: Auto-apply effects when events trigger
- **Event Notifications**: Alert players/GM when significant events occur
