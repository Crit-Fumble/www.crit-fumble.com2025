# Goal Tracking System

## Overview

The Goal Tracking system stores goals, tracks progress toward completion, and integrates with the Event system to automatically update progress based on gameplay events. Goals can be campaign-wide, character-specific, or session-specific.

## Purpose

- **Motivation**: Keep players focused on objectives
- **Progress Tracking**: Automatically track progress via events
- **Quest Management**: Organize quests, missions, and objectives
- **Character Development**: Track personal character goals
- **Campaign Structure**: Provide narrative structure and pacing
- **Completion Celebration**: Recognize achievements when goals are met

## Goal Types

### Campaign Goals

Overarching objectives for the entire campaign.

**Examples**:
- "Defeat the Dragon Lord"
- "Unite the Five Kingdoms"
- "Prevent the Apocalypse"
- "Discover the Ancient Artifact"

### Character Goals

Personal objectives for individual characters.

**Examples**:
- "Avenge my family"
- "Become a master swordsman"
- "Build a wizard tower"
- "Find my lost sibling"

### Session Goals

Objectives for a single game session.

**Examples**:
- "Explore the abandoned temple"
- "Rescue the kidnapped mayor"
- "Gather information about the cultists"
- "Reach the next town"

### Quest Goals

Structured quests with sub-objectives.

**Examples**:
- "The Missing Merchant"
  - Find clues in the marketplace
  - Track the kidnappers to their hideout
  - Rescue the merchant
  - Return for reward

## Goal Schema

### Core Goal Structure

```typescript
interface Goal {
  id: string;                      // Unique goal identifier
  campaignId: string;              // Campaign this goal belongs to
  sessionId?: string;              // Session (if session-specific goal)

  // Basic Info
  name: string;                    // Short goal name
  description: string;             // Detailed description
  type: GoalType;                  // campaign | character | session | quest
  category: GoalCategory;          // combat | exploration | social | personal | world

  // Ownership
  ownerId?: string;                // Character ID (for character goals)
  assignedTo?: string[];           // Character IDs (who is working on this)
  visibility: 'public' | 'gm-only' | 'character-specific';

  // Progress Tracking
  status: GoalStatus;              // not_started | in_progress | completed | failed | abandoned
  progress: {
    current: number;               // Current progress (0-100 or custom metric)
    target: number;                // Target value for completion
    unit?: string;                 // Unit of measurement (%, enemies, items, etc.)
    milestones?: Milestone[];      // Optional sub-objectives
  };

  // Event Integration
  trackedEvents?: {
    type: string;                  // Event type to track
    filter?: Record<string, any>;  // Filter criteria
    contribution: number;          // How much each event contributes to progress
  }[];

  // Hierarchy
  parentGoalId?: string;           // Parent goal (for sub-goals)
  childGoalIds?: string[];         // Child goals
  dependencies?: string[];         // Goals that must complete first

  // Rewards
  rewards?: {
    xp?: number;
    gold?: number;
    items?: string[];
    reputation?: { faction: string; amount: number }[];
    custom?: string;
  };

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  failedAt?: Date;
  tags?: string[];
  importance?: 'minor' | 'normal' | 'major' | 'critical';
}

type GoalType = 'campaign' | 'character' | 'session' | 'quest';
type GoalCategory = 'combat' | 'exploration' | 'social' | 'personal' | 'world' | 'mystery' | 'collection';
type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'failed' | 'abandoned';

interface Milestone {
  id: string;
  name: string;
  description?: string;
  completed: boolean;
  order: number;
}
```

## Goal Examples

### Campaign Goal: Defeat the Dragon

```json
{
  "id": "goal-campaign-dragon",
  "campaignId": "campaign-001",
  "name": "Defeat the Ancient Red Dragon",
  "description": "The Ancient Red Dragon Vermithrax has terrorized the kingdom for decades. Defeat it to save the realm.",
  "type": "campaign",
  "category": "combat",
  "visibility": "public",
  "status": "in_progress",
  "progress": {
    "current": 0,
    "target": 1,
    "unit": "dragon defeated",
    "milestones": [
      {
        "id": "milestone-1",
        "name": "Learn dragon's location",
        "completed": true,
        "order": 1
      },
      {
        "id": "milestone-2",
        "name": "Gather legendary weapons",
        "completed": true,
        "order": 2
      },
      {
        "id": "milestone-3",
        "name": "Reach level 15",
        "completed": false,
        "order": 3
      },
      {
        "id": "milestone-4",
        "name": "Defeat the dragon",
        "completed": false,
        "order": 4
      }
    ]
  },
  "trackedEvents": [
    {
      "type": "creature_death",
      "filter": { "creatureId": "vermithrax-dragon" },
      "contribution": 100
    }
  ],
  "rewards": {
    "xp": 50000,
    "gold": 100000,
    "items": ["dragon-hoard-legendary-items"],
    "reputation": [
      { "faction": "kingdom", "amount": 100 }
    ]
  },
  "tags": ["dragon", "boss", "campaign-finale"],
  "importance": "critical",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-19T15:00:00Z"
}
```

### Character Goal: Avenge Family

```json
{
  "id": "goal-char-avenge",
  "campaignId": "campaign-001",
  "name": "Avenge My Family",
  "description": "Find and defeat the bandits who destroyed my village and killed my family.",
  "type": "character",
  "category": "personal",
  "ownerId": "fighter-pc",
  "assignedTo": ["fighter-pc"],
  "visibility": "character-specific",
  "status": "in_progress",
  "progress": {
    "current": 3,
    "target": 5,
    "unit": "bandit leaders defeated",
    "milestones": [
      {
        "id": "milestone-1",
        "name": "Find the bandit camp",
        "completed": true,
        "order": 1
      },
      {
        "id": "milestone-2",
        "name": "Defeat the bandit captain",
        "completed": false,
        "order": 2
      }
    ]
  },
  "trackedEvents": [
    {
      "type": "creature_death",
      "filter": { "tags": ["bandit-leader"] },
      "contribution": 1
    }
  ],
  "rewards": {
    "xp": 5000,
    "custom": "Closure and peace of mind"
  },
  "tags": ["revenge", "personal", "backstory"],
  "importance": "major",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-15T12:00:00Z"
}
```

### Session Goal: Explore the Temple

```json
{
  "id": "goal-session-temple",
  "campaignId": "campaign-001",
  "sessionId": "session-015",
  "name": "Explore the Abandoned Temple",
  "description": "Thoroughly explore the temple ruins and discover what happened to the priests.",
  "type": "session",
  "category": "exploration",
  "visibility": "public",
  "status": "in_progress",
  "progress": {
    "current": 12,
    "target": 20,
    "unit": "rooms explored",
    "milestones": [
      {
        "id": "milestone-1",
        "name": "Enter the temple",
        "completed": true,
        "order": 1
      },
      {
        "id": "milestone-2",
        "name": "Explore the main hall",
        "completed": true,
        "order": 2
      },
      {
        "id": "milestone-3",
        "name": "Discover the hidden catacombs",
        "completed": false,
        "order": 3
      }
    ]
  },
  "trackedEvents": [
    {
      "type": "location_discovered",
      "filter": { "parentLocationId": "abandoned-temple" },
      "contribution": 1
    }
  ],
  "rewards": {
    "xp": 1000
  },
  "tags": ["exploration", "temple", "mystery"],
  "importance": "normal",
  "createdAt": "2025-01-19T13:00:00Z",
  "updatedAt": "2025-01-19T15:30:00Z"
}
```

### Quest Goal with Sub-Goals

```json
{
  "id": "goal-quest-merchant",
  "campaignId": "campaign-001",
  "name": "The Missing Merchant",
  "description": "Find and rescue the kidnapped merchant Aldric Thornwood.",
  "type": "quest",
  "category": "social",
  "visibility": "public",
  "status": "in_progress",
  "childGoalIds": [
    "goal-quest-merchant-clues",
    "goal-quest-merchant-track",
    "goal-quest-merchant-rescue"
  ],
  "progress": {
    "current": 1,
    "target": 3,
    "unit": "sub-goals completed"
  },
  "rewards": {
    "xp": 2000,
    "gold": 500,
    "reputation": [
      { "faction": "merchants-guild", "amount": 25 }
    ]
  },
  "tags": ["quest", "rescue", "merchant"],
  "importance": "major",
  "createdAt": "2025-01-18T10:00:00Z",
  "updatedAt": "2025-01-19T14:00:00Z"
}
```

## PostgreSQL Schema

```sql
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  session_id UUID REFERENCES sessions(id),

  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- campaign, character, session, quest
  category TEXT NOT NULL, -- combat, exploration, social, personal, world, mystery, collection

  -- Ownership
  owner_id UUID REFERENCES creatures(id), -- For character goals
  assigned_to UUID[], -- Character IDs
  visibility TEXT DEFAULT 'public', -- public, gm-only, character-specific

  -- Progress
  status TEXT NOT NULL DEFAULT 'not_started', -- not_started, in_progress, completed, failed, abandoned
  progress_current INTEGER DEFAULT 0,
  progress_target INTEGER,
  progress_unit TEXT,
  milestones JSONB,

  -- Event Integration
  tracked_events JSONB,

  -- Hierarchy
  parent_goal_id UUID REFERENCES goals(id),
  dependencies UUID[], -- Goal IDs that must complete first

  -- Rewards
  rewards JSONB,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  tags TEXT[],
  importance TEXT DEFAULT 'normal' -- minor, normal, major, critical
);

-- Child goals lookup table
CREATE TABLE goal_children (
  parent_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  PRIMARY KEY (parent_id, child_id)
);

-- Indexes
CREATE INDEX idx_goals_campaign ON goals(campaign_id);
CREATE INDEX idx_goals_session ON goals(session_id);
CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_goals_type ON goals(type);
CREATE INDEX idx_goals_owner ON goals(owner_id);
CREATE INDEX idx_goals_tags ON goals USING GIN(tags);
CREATE INDEX idx_goals_parent ON goals(parent_goal_id);
```

## Goal Progress Updates

### Manual Updates

Goals can be updated manually by the GM or players:

```typescript
function updateGoalProgress(goalId: string, delta: number) {
  // Increment progress by delta
  // Check if goal is completed (current >= target)
  // Trigger completion events if completed
  // Update parent goal if this is a sub-goal
}
```

### Automatic Updates via Events

Goals track specific events and update automatically:

```typescript
// When an event is logged
function onEventLogged(event: GameEventLog) {
  // Find all goals tracking this event type
  const trackingGoals = await findGoalsTrackingEvent(event);

  for (const goal of trackingGoals) {
    // Check if event matches filter criteria
    if (eventMatchesFilter(event, goal.trackedEvents.filter)) {
      // Update goal progress
      await updateGoalProgress(goal.id, goal.trackedEvents.contribution);
    }
  }
}
```

## Integration with Other Systems

### Events

- Events trigger goal progress updates
- Goal completion creates "goal_completed" event
- Goal failure creates "goal_failed" event

### Sessions

- Session goals are associated with specific sessions
- Session summary shows goal progress
- New session goals created at session start

### Character Progression

- Goals grant XP and rewards upon completion
- Personal goals tied to character backstory
- Character advancement tied to goal completion

### Campaign Management

- Campaign goals provide overall structure
- Quest chains created via parent/child goals
- Goal dependencies ensure proper order

## See Also

- [CORE-CONCEPTS.md](../../foundry-core-concepts/docs/CORE-CONCEPTS.md) - Goals as core concept
- [EVENT-TRACKING.md](EVENT-TRACKING.md) - Event integration
- [SESSION-TRACKING.md](SESSION-TRACKING.md) - Session integration
- [TODO-FoundryVTT.md](../../../todo/TODO-FoundryVTT.md) - Implementation roadmap
