# Session Tracking System

## Overview

The Session Tracking system associates ranges of game time with particular real-world game sessions, allowing players to review time tracking and event logs by session. This creates a structured history of gameplay that can be browsed session-by-session.

## Purpose

- **Session Organization**: Group gameplay by real-world play sessions
- **Historical Review**: Review what happened in previous sessions
- **Session Summaries**: Automatically generate session recaps
- **Time Management**: Track real-world time and in-game time per session
- **Attendance Tracking**: Record which players attended each session
- **Session Planning**: Set goals and objectives for upcoming sessions

## Session Schema

### Core Session Structure

```typescript
interface Session {
  id: string;                      // Unique session identifier
  campaignId: string;              // Campaign this session belongs to
  number: number;                  // Session number (1, 2, 3, ...)

  // Timing
  realTime: {
    startTime: Date;               // Real-world start time
    endTime?: Date;                // Real-world end time (null if in progress)
    durationMinutes?: number;      // Total session duration in minutes
  };

  gameTime: {
    startTime: GameTime;           // In-game time when session started
    endTime?: GameTime;            // In-game time when session ended
    elapsed?: {                    // How much game time passed
      rounds?: number;
      minutes?: number;
      hours?: number;
      days?: number;
    };
  };

  // Participants
  participants: {
    gm: string;                    // GM user ID
    players: SessionPlayer[];      // Players who attended
    characters: string[];          // Character IDs involved
  };

  // Session Content
  title?: string;                  // Session title/name
  description?: string;            // Brief description
  location?: string;               // Where session was played (online, in-person, etc.)

  // Planning
  plannedObjectives?: string[];   // Goals planned before session
  actualObjectives?: string[];    // Goals completed during session

  // Summary
  summary?: {
    auto: string;                  // Auto-generated summary
    gm?: string;                   // GM-written summary
    highlights?: string[];         // Key moments
    npcsIntroduced?: string[];     // NPCs met this session
    locationsVisited?: string[];   // Locations explored
    itemsAcquired?: string[];      // Items obtained
    questsStarted?: string[];      // Quests begun
    questsCompleted?: string[];    // Quests completed
  };

  // Statistics
  stats?: {
    eventCount: number;            // Total events logged
    combatEncounters: number;      // Number of combats
    totalDamageDealt: number;      // Total damage across all combats
    totalHealingDone: number;      // Total healing
    npcsKilled: number;            // Creatures defeated
    treasureGained: number;        // Gold/treasure acquired
    xpEarned: number;              // XP awarded
  };

  // Metadata
  status: SessionStatus;           // planned | in_progress | completed | cancelled
  tags?: string[];                 // Searchable tags
  notes?: string;                  // GM/player notes
  createdAt: Date;
  updatedAt: Date;
}

type SessionStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

interface SessionPlayer {
  userId: string;                  // Player user ID
  characterIds: string[];          // Characters played
  attended: boolean;               // Did they attend?
  arrivedLate?: boolean;
  leftEarly?: boolean;
}

interface GameTime {
  rounds?: number;
  minutes?: number;
  hours?: number;
  days?: number;
  total: number;                   // Total seconds
  formatted: string;               // "Day 15, 3:30 PM"
}
```

## Session Lifecycle

### 1. Session Planning

Before the session, create a planned session:

```json
{
  "id": "session-015",
  "campaignId": "campaign-001",
  "number": 15,
  "status": "planned",
  "realTime": {
    "startTime": "2025-01-20T18:00:00Z"
  },
  "participants": {
    "gm": "user-gm-1",
    "players": [
      {
        "userId": "user-player-1",
        "characterIds": ["fighter-pc"],
        "attended": false
      },
      {
        "userId": "user-player-2",
        "characterIds": ["wizard-pc"],
        "attended": false
      }
    ]
  },
  "plannedObjectives": [
    "Explore the abandoned temple",
    "Find the lost artifact",
    "Confront the cult leader"
  ],
  "tags": ["dungeon-crawl", "temple", "cult"],
  "createdAt": "2025-01-18T10:00:00Z"
}
```

### 2. Session Start

When the session begins, update status and record start times:

```json
{
  "id": "session-015",
  "status": "in_progress",
  "realTime": {
    "startTime": "2025-01-20T18:05:00Z"
  },
  "gameTime": {
    "startTime": {
      "days": 15,
      "hours": 9,
      "total": 1296000,
      "formatted": "Day 15, 9:00 AM"
    }
  },
  "participants": {
    "players": [
      {
        "userId": "user-player-1",
        "attended": true
      },
      {
        "userId": "user-player-2",
        "attended": true,
        "arrivedLate": true
      }
    ]
  }
}
```

### 3. During Session

Events are logged with `sessionId`:

```json
{
  "id": "event-001",
  "sessionId": "session-015",
  "timestamp": {
    "realTime": "2025-01-20T18:30:00Z",
    "gameTime": {
      "days": 15,
      "hours": 10,
      "total": 1299600,
      "formatted": "Day 15, 10:00 AM"
    }
  },
  "event": {
    "type": "combat_start",
    "name": "Ambushed by cultists"
  }
}
```

### 4. Session End

When the session ends, finalize the session:

```json
{
  "id": "session-015",
  "status": "completed",
  "realTime": {
    "startTime": "2025-01-20T18:05:00Z",
    "endTime": "2025-01-20T22:15:00Z",
    "durationMinutes": 250
  },
  "gameTime": {
    "startTime": {
      "days": 15,
      "hours": 9,
      "total": 1296000,
      "formatted": "Day 15, 9:00 AM"
    },
    "endTime": {
      "days": 15,
      "hours": 18,
      "total": 1328400,
      "formatted": "Day 15, 6:00 PM"
    },
    "elapsed": {
      "hours": 9
    }
  },
  "actualObjectives": [
    "Explored 15/20 rooms of the temple",
    "Defeated the cult leader",
    "Found the artifact"
  ],
  "summary": {
    "highlights": [
      "Epic battle with the cult leader",
      "Wizard's clutch Counterspell saved the party",
      "Fighter discovered hidden treasure room"
    ],
    "npcsIntroduced": ["Cult Leader Malachar", "Priestess Elara"],
    "locationsVisited": ["Temple Main Hall", "Hidden Catacombs", "Artifact Chamber"],
    "itemsAcquired": ["Ancient Artifact of Power", "Cult Leader's Spellbook"],
    "questsCompleted": ["Recover the Artifact"]
  },
  "stats": {
    "eventCount": 247,
    "combatEncounters": 3,
    "totalDamageDealt": 385,
    "totalHealingDone": 142,
    "npcsKilled": 12,
    "treasureGained": 1500,
    "xpEarned": 4000
  }
}
```

## PostgreSQL Schema

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  number INTEGER NOT NULL,

  -- Real-world timing
  real_start_time TIMESTAMP WITH TIME ZONE,
  real_end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,

  -- Game time
  game_start_time BIGINT, -- Total seconds since campaign start
  game_end_time BIGINT,
  game_time_elapsed_seconds BIGINT,

  -- Participants
  gm_user_id UUID NOT NULL REFERENCES users(id),
  player_data JSONB, -- Array of SessionPlayer objects
  character_ids UUID[],

  -- Content
  title TEXT,
  description TEXT,
  location TEXT,

  -- Planning and objectives
  planned_objectives TEXT[],
  actual_objectives TEXT[],

  -- Summary
  summary JSONB,

  -- Statistics
  stats JSONB,

  -- Metadata
  status TEXT NOT NULL DEFAULT 'planned', -- planned, in_progress, completed, cancelled
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(campaign_id, number)
);

-- Indexes
CREATE INDEX idx_sessions_campaign ON sessions(campaign_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_real_time ON sessions(real_start_time);
CREATE INDEX idx_sessions_number ON sessions(campaign_id, number);
CREATE INDEX idx_sessions_tags ON sessions USING GIN(tags);
```

## Auto-Generated Session Summary

The system can automatically generate session summaries by analyzing events:

```typescript
async function generateSessionSummary(sessionId: string): Promise<string> {
  // Get all events for this session
  const events = await getSessionEvents(sessionId);

  // Categorize events
  const combatEvents = events.filter(e => e.category === 'combat');
  const explorationEvents = events.filter(e => e.category === 'exploration');
  const socialEvents = events.filter(e => e.category === 'social');

  // Extract key information
  const npcsIntroduced = events
    .filter(e => e.type === 'npc_introduced')
    .map(e => e.participants.actor);

  const locationsVisited = events
    .filter(e => e.type === 'location_discovered')
    .map(e => e.participants.location);

  const combatCount = combatEvents.filter(e => e.type === 'combat_start').length;

  // Generate summary text
  return `
Session ${session.number}: ${session.title}

The party continued their adventure, exploring ${locationsVisited.length} new locations including ${locationsVisited.slice(0, 3).join(', ')}.

They encountered ${npcsIntroduced.length} NPCs: ${npcsIntroduced.join(', ')}.

The session featured ${combatCount} combat encounters, with the party dealing ${stats.totalDamageDealt} total damage and taking ${stats.totalDamageReceived} damage in return.

Notable achievements:
${session.actualObjectives.map(obj => `- ${obj}`).join('\n')}

The party earned ${stats.xpEarned} XP and ${stats.treasureGained} gp in treasure.
  `.trim();
}
```

## Session Review Interface

Players can review previous sessions through the website:

**Features**:
- List of all sessions with date, duration, and objectives
- Session detail page showing:
  - Event timeline (all events in chronological order)
  - Combat summaries (rounds, damage, outcomes)
  - Exploration progress (locations discovered, rooms explored)
  - Social interactions (NPCs met, dialogue highlights)
  - Treasure and XP gained
  - Goal progress updates

## Integration with Other Systems

### Events

- All events logged during a session have `sessionId`
- Session timeline shows all events in order
- Event search can filter by session

### Goals

- Session goals created at session start
- Goal progress tracked across sessions
- Session summary shows goal updates

### Time Tracking

- Sessions mark clear boundaries in game time
- Easy to see "what happened on Day 15" by checking Session 15
- Time jumps between sessions clearly marked

### Campaign Management

- Campaign progress tracked session-by-session
- Session history shows campaign arc
- Analytics across sessions show trends

## Session Attendance Tracking

Track which players attended each session:

```sql
-- Get attendance for a player
SELECT
  s.number,
  s.real_start_time,
  (player_data->'attended')::boolean as attended
FROM sessions s,
  jsonb_array_elements(s.player_data) as player_data
WHERE player_data->>'userId' = 'user-player-1'
ORDER BY s.number;

-- Get attendance statistics
SELECT
  player_data->>'userId' as user_id,
  COUNT(*) FILTER (WHERE (player_data->>'attended')::boolean) as sessions_attended,
  COUNT(*) as total_sessions,
  ROUND(
    COUNT(*) FILTER (WHERE (player_data->>'attended')::boolean) * 100.0 / COUNT(*),
    2
  ) as attendance_percentage
FROM sessions s,
  jsonb_array_elements(s.player_data) as player_data
WHERE s.campaign_id = 'campaign-001'
GROUP BY player_data->>'userId';
```

## See Also

- [CORE-CONCEPTS.md](../../foundry-core-concepts/docs/CORE-CONCEPTS.md) - Sessions as core concept
- [EVENT-TRACKING.md](EVENT-TRACKING.md) - Event integration with sessions
- [GOAL-TRACKING.md](GOAL-TRACKING.md) - Session goals
- [TODO-FoundryVTT.md](../../../todo/TODO-FoundryVTT.md) - Implementation roadmap
