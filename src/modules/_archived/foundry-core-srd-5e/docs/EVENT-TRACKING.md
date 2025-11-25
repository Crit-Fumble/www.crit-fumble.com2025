# Event Tracking System

## Overview

The Event Tracking system stores all game events in a structured log, capturing prompts, rolls, results, outcomes, and game time. This provides a complete history of gameplay that can be reviewed by players and used for session summaries, analytics, and campaign management.

## Purpose

- **Historical Record**: Complete log of all significant game events
- **Session Review**: Players can review what happened in previous sessions
- **Analytics**: Track patterns, frequency, and trends in gameplay
- **Integration**: Events tie together Activities, Goals, Sessions, and Time Tracking
- **Debugging**: GMs can review event sequences to understand game state

## Event Schema

### Core Event Structure

```typescript
interface GameEventLog {
  id: string;                    // Unique event identifier
  timestamp: {
    realTime: Date;              // Real-world timestamp
    gameTime: GameTime;          // In-game time when event occurred
  };
  sessionId?: string;            // Associated session (if during active session)

  event: {
    type: string;                // Event type (from EVENT-SYSTEM.md)
    category: EventCategory;     // combat, environmental, time, etc.
    name: string;                // Human-readable event name
    description: string;         // Event description
  };

  participants: {
    actor?: string;              // Creature/object causing the event
    targets?: string[];          // Creatures/objects affected by event
    location?: string;           // Where event occurred
  };

  mechanics?: {
    prompt?: string;             // What triggered the event ("Roll initiative")
    roll?: DiceRoll;             // Dice roll information (if applicable)
    result?: string;             // Mechanical result ("19 vs AC 15")
    outcome?: string;            // Narrative outcome ("Hit! 8 damage")
  };

  effects?: {
    immediate?: EventEffect[];   // Immediate effects
    ongoing?: EventEffect[];     // Ongoing effects
    cascade?: string[];          // IDs of events triggered by this event
  };

  metadata?: {
    tags?: string[];             // Searchable tags
    importance?: 'trivial' | 'normal' | 'significant' | 'critical';
    visibility?: 'public' | 'gm-only' | 'player-specific';
  };
}

interface GameTime {
  rounds?: number;               // Combat rounds
  minutes?: number;              // Minutes
  hours?: number;                // Hours
  days?: number;                 // Days
  total: number;                 // Total seconds since campaign start
  formatted: string;             // Human-readable format
}

interface DiceRoll {
  expression: string;            // "1d20+5"
  rolls: number[];               // Individual die results [15]
  modifiers: number;             // +5
  total: number;                 // 20
  type?: 'attack' | 'damage' | 'save' | 'check' | 'initiative';
  advantage?: boolean;
  disadvantage?: boolean;
}

interface EventEffect {
  type: 'damage' | 'healing' | 'condition' | 'resource' | 'status';
  target: string;                // Creature/object ID
  value?: number;                // Numeric value (damage, healing, etc.)
  condition?: string;            // Condition applied (Charmed, Frightened, etc.)
  duration?: string;             // "Until end of next turn", "1 hour", etc.
}
```

## Event Categories

### Combat Events

Events that occur during combat encounters.

**Examples**:
- Initiative rolls
- Attack rolls (hit/miss)
- Damage dealt
- Healing received
- Spell cast
- Condition applied/removed
- Death/unconsciousness
- Combat start/end

```json
{
  "id": "event-combat-attack-001",
  "timestamp": {
    "realTime": "2025-01-19T14:32:15Z",
    "gameTime": {
      "rounds": 2,
      "total": 12,
      "formatted": "Round 2, Turn 3"
    }
  },
  "event": {
    "type": "attack",
    "category": "combat",
    "name": "Goblin attacks Fighter",
    "description": "Goblin makes melee attack with scimitar"
  },
  "participants": {
    "actor": "goblin-1",
    "targets": ["fighter-pc"],
    "location": "dungeon-room-5"
  },
  "mechanics": {
    "prompt": "Roll attack",
    "roll": {
      "expression": "1d20+4",
      "rolls": [12],
      "modifiers": 4,
      "total": 16,
      "type": "attack"
    },
    "result": "16 vs AC 18",
    "outcome": "Miss"
  },
  "metadata": {
    "tags": ["combat", "attack", "miss"],
    "importance": "normal"
  }
}
```

### Environmental Events

Events triggered by the environment or passage of time.

**Examples**:
- Extreme cold/heat effects
- Falling damage
- Suffocation
- Exhaustion
- Weather changes
- Natural hazards

```json
{
  "id": "event-env-cold-001",
  "timestamp": {
    "realTime": "2025-01-19T14:15:00Z",
    "gameTime": {
      "hours": 6,
      "total": 21600,
      "formatted": "Day 3, 6:00 AM"
    }
  },
  "event": {
    "type": "extreme_cold",
    "category": "environmental",
    "name": "Hourly cold exposure check",
    "description": "Characters without cold weather gear make CON saves"
  },
  "participants": {
    "targets": ["fighter-pc", "wizard-pc"],
    "location": "frozen-wasteland"
  },
  "mechanics": {
    "prompt": "DC 10 CON save or take 1d4 cold damage",
    "roll": {
      "expression": "1d20+2",
      "rolls": [8],
      "modifiers": 2,
      "total": 10,
      "type": "save"
    },
    "result": "10 vs DC 10",
    "outcome": "Success - no damage"
  },
  "metadata": {
    "tags": ["environmental", "cold", "save", "success"],
    "importance": "normal"
  }
}
```

### Rest Events

Events related to resting and recovery.

**Examples**:
- Short rest started/completed/interrupted
- Long rest started/completed/interrupted
- Hit dice spent
- Spell slots recovered
- HP recovered

```json
{
  "id": "event-rest-long-complete-001",
  "timestamp": {
    "realTime": "2025-01-19T15:00:00Z",
    "gameTime": {
      "hours": 14,
      "total": 50400,
      "formatted": "Day 3, 2:00 PM"
    }
  },
  "event": {
    "type": "long_rest_complete",
    "category": "rest",
    "name": "Long rest completed",
    "description": "Party completes 8-hour long rest at inn"
  },
  "participants": {
    "targets": ["fighter-pc", "wizard-pc", "rogue-pc"],
    "location": "inn-room-3"
  },
  "effects": {
    "immediate": [
      {
        "type": "healing",
        "target": "fighter-pc",
        "value": 45
      },
      {
        "type": "resource",
        "target": "wizard-pc",
        "value": 4,
        "condition": "spell_slots_recovered"
      }
    ]
  },
  "metadata": {
    "tags": ["rest", "long-rest", "recovery"],
    "importance": "significant"
  }
}
```

### Time Events

Events marking the passage of time or time-based triggers.

**Examples**:
- Round end
- Turn end
- Spell duration expires
- Condition duration expires
- Time-based effect triggers

```json
{
  "id": "event-time-spell-expire-001",
  "timestamp": {
    "realTime": "2025-01-19T14:45:00Z",
    "gameTime": {
      "rounds": 10,
      "total": 60,
      "formatted": "Round 10, End of Turn"
    }
  },
  "event": {
    "type": "spell_duration_end",
    "category": "time",
    "name": "Bless spell expires",
    "description": "Bless spell (1 minute duration) ends"
  },
  "participants": {
    "actor": "cleric-pc",
    "targets": ["fighter-pc", "wizard-pc", "rogue-pc"]
  },
  "effects": {
    "immediate": [
      {
        "type": "status",
        "target": "fighter-pc",
        "condition": "bless_removed"
      }
    ]
  },
  "metadata": {
    "tags": ["time", "spell", "duration", "bless"],
    "importance": "normal"
  }
}
```

## Event Storage

### PostgreSQL Schema

```sql
CREATE TABLE game_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  session_id UUID REFERENCES sessions(id),

  -- Timestamp
  real_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  game_time_total BIGINT NOT NULL,  -- Total seconds since campaign start
  game_time_formatted TEXT,

  -- Event data
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_description TEXT,

  -- Participants
  actor_id UUID REFERENCES creatures(id),
  target_ids UUID[],
  location_id UUID REFERENCES locations(id),

  -- Mechanics (JSONB for flexibility)
  mechanics JSONB,
  effects JSONB,

  -- Metadata
  tags TEXT[],
  importance TEXT DEFAULT 'normal',
  visibility TEXT DEFAULT 'public',

  -- Indexing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_game_events_campaign ON game_events(campaign_id);
CREATE INDEX idx_game_events_session ON game_events(session_id);
CREATE INDEX idx_game_events_real_time ON game_events(real_time);
CREATE INDEX idx_game_events_game_time ON game_events(game_time_total);
CREATE INDEX idx_game_events_category ON game_events(event_category);
CREATE INDEX idx_game_events_type ON game_events(event_type);
CREATE INDEX idx_game_events_tags ON game_events USING GIN(tags);
```

### Query Examples

```sql
-- Get all events for a session
SELECT * FROM game_events
WHERE session_id = 'session-uuid'
ORDER BY game_time_total ASC;

-- Get combat events in a time range
SELECT * FROM game_events
WHERE campaign_id = 'campaign-uuid'
  AND event_category = 'combat'
  AND game_time_total BETWEEN 0 AND 3600
ORDER BY game_time_total ASC;

-- Search events by tag
SELECT * FROM game_events
WHERE campaign_id = 'campaign-uuid'
  AND 'critical-hit' = ANY(tags)
ORDER BY real_time DESC;

-- Get event statistics
SELECT
  event_category,
  event_type,
  COUNT(*) as count
FROM game_events
WHERE session_id = 'session-uuid'
GROUP BY event_category, event_type
ORDER BY count DESC;
```

## Integration with Other Systems

### Activities

Activities can trigger events:
- "Walking" activity → "Travel started" event
- "Combat" activity → Multiple combat events
- "Long Rest" activity → "Rest started", "Rest interrupted", "Rest completed" events

### Goals

Events track progress toward goals:
- "Defeat Dragon" goal → Track "damage dealt" and "enemy death" events
- "Explore Dungeon" goal → Track "location discovered" events

### Sessions

Events are associated with sessions:
- All events during a session have `session_id`
- Session summary aggregates events by type
- Session timeline shows events in order

### Time Tracking

Events record game time when they occurred:
- Events drive time advancement (combat rounds, travel hours, rest periods)
- Time-based queries show what happened when
- Event timeline visualization

## Event Cascade

Events can trigger other events:

```
Event: "Fireball spell cast"
  ↓ triggers
Event: "Damage dealt to Goblin 1" (8 HP, dies)
  ↓ triggers
Event: "Goblin 1 death"
  ↓ triggers
Event: "Goblin 2 morale check" (fails)
  ↓ triggers
Event: "Goblin 2 flees"
```

## Implementation Notes

### Event Creation

Events should be created automatically by the system whenever:
- Combat actions occur
- Environmental hazards trigger
- Time passes (round/turn end)
- Rests start/complete/interrupt
- Spells are cast
- Conditions are applied/removed
- Creatures take damage/healing
- Goals are updated

### Event Visibility

Events can have different visibility levels:
- **public**: All players can see (normal gameplay events)
- **gm-only**: Only GM can see (secret rolls, hidden information)
- **player-specific**: Specific players can see (perception checks, insight, etc.)

### Event Importance

Events are categorized by importance:
- **trivial**: Minor events (movement, simple checks)
- **normal**: Standard gameplay events (attacks, skill checks)
- **significant**: Important events (level up, quest completion, boss encounter start)
- **critical**: Campaign-defining events (character death, world-changing decisions)

## See Also

- [EVENT.md](../../foundry-core-concepts/docs/EVENT.md) - Core event concept
- [EVENT-SYSTEM.md](EVENT-SYSTEM.md) - 5e-specific event types
- [ACTIVITY-SYSTEM.md](ACTIVITY-SYSTEM.md) - Activities that trigger events
- [TODO-FoundryVTT.md](../../../todo/TODO-FoundryVTT.md) - Implementation roadmap
