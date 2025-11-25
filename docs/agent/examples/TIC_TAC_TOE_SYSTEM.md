# Tic-Tac-Toe RPG System Example

**Purpose:** Demonstrate the simplest possible RPG system implementation using Core Concepts.

**System Name:** `tic-tac-toe`

**Last Updated:** November 24, 2024

---

## System Overview

**Tic-Tac-Toe** is a minimal RPG system that allows a Game Master to set up a tic-tac-toe board and duel a player in a match. This serves as a reference implementation for creating custom game systems from scratch.

### System Constraints

- **Minimum World Scope:** `Interaction` (1 inch grid, 3x3 squares)
- **Maximum World Scope:** `Interaction` (cannot scale beyond single board)
- **Grid Type:** Square grid (3x3)
- **Grid Scale:** 1 inch per square
- **No Creatures:** This system has no creature types
- **No Character Classes:** Players use tokens (X or O)
- **No Stats:** Simple turn-based placement

### System Definition

```typescript
// RpgSystem record
{
  id: "ttt-001",
  systemName: "tic-tac-toe",
  displayName: "Tic-Tac-Toe",
  version: "1.0.0",
  description: "Classic tic-tac-toe game as an RPG system",

  // Core concepts definition
  coreConcepts: {
    // Scales this system supports
    scales: {
      min: "Interaction",
      max: "Interaction",
      default: "Interaction"
    },

    // Grid configuration
    gridConfig: {
      type: "square", // square, hex, voxel
      defaultSize: 3,
      minSize: 3,
      maxSize: 3,
      scale: "1 inch"
    },

    // No creatures in this system
    creatureTypes: [],

    // Token types (what players control)
    tokenTypes: [
      {
        id: "token-x",
        name: "X Token",
        symbol: "X",
        color: "#3B82F6", // blue
        playerRole: "challenger"
      },
      {
        id: "token-o",
        name: "O Token",
        symbol: "O",
        color: "#EF4444", // red
        playerRole: "opponent"
      }
    ],

    // Activities (game actions)
    activityTypes: [
      {
        id: "place-token",
        name: "Place Token",
        description: "Place your token on an empty square",
        actionType: "placement",
        requiresTarget: true,
        targetType: "empty-square"
      },
      {
        id: "check-win",
        name: "Check Win Condition",
        description: "Check if a player has won",
        actionType: "system",
        triggeredBy: "after-placement"
      }
    ],

    // Win conditions
    winConditions: [
      {
        id: "three-in-row",
        name: "Three in a Row",
        description: "Three tokens in a row (horizontal, vertical, or diagonal)",
        patterns: [
          // Rows
          [[0,0], [0,1], [0,2]],
          [[1,0], [1,1], [1,2]],
          [[2,0], [2,1], [2,2]],
          // Columns
          [[0,0], [1,0], [2,0]],
          [[0,1], [1,1], [2,1]],
          [[0,2], [1,2], [2,2]],
          // Diagonals
          [[0,0], [1,1], [2,2]],
          [[0,2], [1,1], [2,0]]
        ]
      },
      {
        id: "draw",
        name: "Draw",
        description: "All squares filled with no winner",
        condition: "board-full && no-winner"
      }
    ],

    // Turn order
    turnSystem: {
      type: "alternating",
      firstPlayer: "challenger", // X goes first
      timeLimit: null // no time limit by default
    }
  }
}
```

---

## Data Model Implementation

### 1. RpgWorld (The Game Instance)

```typescript
{
  id: "world-ttt-001",
  name: "Tic-Tac-Toe Match #1",
  description: "A friendly game of tic-tac-toe",
  systemName: "tic-tac-toe",
  worldScale: "Interaction",
  containerWorldId: "world-tavern-games", // Could be nested in a larger campaign
  ownerId: "gm-user-id",

  settings: {
    timeLimit: 30, // seconds per turn (optional)
    allowUndo: false,
    spectatorMode: true
  },

  metadata: {
    gameState: "in-progress", // "setup", "in-progress", "completed"
    winner: null, // "challenger", "opponent", "draw"
    totalMoves: 0,
    startedAt: "2024-11-24T12:00:00Z"
  }
}
```

### 2. RpgLocation (The Board)

```typescript
{
  id: "loc-ttt-board-001",
  name: "Tic-Tac-Toe Board",
  title: "Game Board",
  description: "3x3 grid for tic-tac-toe",
  locationType: "game-board",
  locationScale: "Interaction",
  worldId: "world-ttt-001",

  // Use board template
  boardTemplateId: "template-ttt-board",

  // Use card for grid layout
  mapCardIds: ["card-ttt-grid"],

  metadata: {
    gridState: [
      [null, null, null], // Row 0
      [null, null, null], // Row 1
      [null, null, null]  // Row 2
    ],
    // null = empty, "X" = X token, "O" = O token

    lastMove: null,
    moveHistory: []
  }
}
```

### 3. RpgBoard (Template)

```typescript
{
  id: "template-ttt-board",
  name: "Tic-Tac-Toe Board Template",
  description: "Standard 3x3 tic-tac-toe board",
  sessionId: "system-template", // System-provided template

  // Board dimensions (in card coordinates)
  centerX: 1, // Center of 3x3 grid
  centerY: 1,
  centerZ: 0,
  sizeX: 3,
  sizeY: 3,
  sizeZ: 1,

  metadata: {
    systemName: "tic-tac-toe",

    // Generation rules
    generationRules: {
      gridSize: { width: 3, height: 3 },
      gridType: "square",
      gridScale: "1 inch",

      // Initial board state
      initialState: {
        squares: [
          [null, null, null],
          [null, null, null],
          [null, null, null]
        ]
      },

      // Placement rules
      placementRules: {
        allowOverwrite: false,
        requireEmpty: true,
        onePerTurn: true
      },

      // Visual theme
      theme: {
        boardColor: "#1F2937", // dark gray
        lineColor: "#FFFFFF", // white
        lineWidth: 2,
        squareSize: 96 // pixels (1 inch at 96 DPI)
      }
    }
  }
}
```

### 4. RpgCard (Grid Layout)

```typescript
{
  id: "card-ttt-grid",
  name: "Tic-Tac-Toe Grid",
  title: "3x3 Game Grid",
  description: "Standard tic-tac-toe grid with lines",
  cardType: "location",
  systemName: "tic-tac-toe",

  properties: {
    mapData: {
      gridWidth: 3,
      gridHeight: 3,
      scale: "Interaction",
      gridType: "square",

      // Tile layout (using RpgTile IDs)
      tiles: [
        ["tile-ttt-square", "tile-ttt-square", "tile-ttt-square"],
        ["tile-ttt-square", "tile-ttt-square", "tile-ttt-square"],
        ["tile-ttt-square", "tile-ttt-square", "tile-ttt-square"]
      ],

      // Visual layers
      layers: {
        base: [
          ["bg-wood", "bg-wood", "bg-wood"],
          ["bg-wood", "bg-wood", "bg-wood"],
          ["bg-wood", "bg-wood", "bg-wood"]
        ],
        grid: [
          ["grid-line", "grid-line", "grid-line"],
          ["grid-line", "grid-line", "grid-line"],
          ["grid-line", "grid-line", "grid-line"]
        ]
      },

      // No doors or lighting needed
      doors: [],
      lighting: [],

      // Interactive areas (clickable squares)
      interactionZones: [
        { id: "square-0-0", x: 0, y: 0, type: "placement" },
        { id: "square-0-1", x: 0, y: 1, type: "placement" },
        { id: "square-0-2", x: 0, y: 2, type: "placement" },
        { id: "square-1-0", x: 1, y: 0, type: "placement" },
        { id: "square-1-1", x: 1, y: 1, type: "placement" },
        { id: "square-1-2", x: 1, y: 2, type: "placement" },
        { id: "square-2-0", x: 2, y: 0, type: "placement" },
        { id: "square-2-1", x: 2, y: 1, type: "placement" },
        { id: "square-2-2", x: 2, y: 2, type: "placement" }
      ]
    }
  },

  imageUrl: "/assets/tic-tac-toe/board-preview.png"
}
```

### 5. RpgSheet (Specific Instance)

```typescript
{
  id: "sheet-ttt-001",
  name: "Tic-Tac-Toe Match #1 Board",
  description: "Active game board for match #1",
  sessionId: "session-ttt-001",
  sheetId: "sheet-ttt-001",

  // Links to board template and cards
  boardId: "template-ttt-board",
  cardIds: ["card-ttt-grid"],

  // Current viewport state
  centerX: 1,
  centerY: 1,
  centerZ: 0,
  viewportZoom: 1.0,

  // Active tokens on board
  activeTokens: [
    // Populated as players place tokens
    // Example after 3 moves:
    {
      id: "token-instance-1",
      tokenType: "token-x",
      x: 0,
      y: 0,
      placedBy: "player-1-id",
      placedAt: "2024-11-24T12:01:00Z"
    },
    {
      id: "token-instance-2",
      tokenType: "token-o",
      x: 1,
      y: 1,
      placedBy: "player-2-id",
      placedAt: "2024-11-24T12:01:30Z"
    },
    {
      id: "token-instance-3",
      tokenType: "token-x",
      x: 0,
      y: 1,
      placedBy: "player-1-id",
      placedAt: "2024-11-24T12:02:00Z"
    }
  ],

  // Turn tracking
  turnOrder: ["player-1-id", "player-2-id"], // X, then O
  currentTurn: 1, // Player 2's turn
  currentRound: 2, // Round 2 (each round = both players go)

  metadata: {
    gameState: "in-progress",
    moveCount: 3,
    lastMove: {
      playerId: "player-1-id",
      position: [0, 1],
      timestamp: "2024-11-24T12:02:00Z"
    }
  }
}
```

### 6. RpgThing (Tokens)

Since tokens are placed dynamically, we define the token types but they're instantiated as part of the sheet's `activeTokens`.

```typescript
// RpgThing definition for X token (template)
{
  id: "thing-token-x",
  name: "X Token",
  title: "X",
  description: "Player X's game piece",
  thingType: "token",
  systemName: "tic-tac-toe",

  properties: {
    symbol: "X",
    color: "#3B82F6",
    size: 0.8, // 80% of square size
    asset: "token-x.svg",
    playerRole: "challenger"
  },

  placeable: true,
  moveable: false, // Once placed, cannot move
  destructible: false
}

// RpgThing definition for O token (template)
{
  id: "thing-token-o",
  name: "O Token",
  title: "O",
  description: "Player O's game piece",
  thingType: "token",
  systemName: "tic-tac-toe",

  properties: {
    symbol: "O",
    color: "#EF4444",
    size: 0.8,
    asset: "token-o.svg",
    playerRole: "opponent"
  },

  placeable: true,
  moveable: false,
  destructible: false
}
```

### 7. RpgActivity (Game Actions)

```typescript
// Activity: Place Token
{
  id: "activity-place-token",
  name: "Place Token",
  title: "Place Your Token",
  description: "Click an empty square to place your token",
  activityType: "placement",
  systemName: "tic-tac-toe",

  triggerConditions: {
    requiresPlayerTurn: true,
    requiresEmptySquare: true
  },

  executionRules: {
    steps: [
      {
        step: 1,
        action: "validate-placement",
        checks: [
          "is-player-turn",
          "is-square-empty",
          "is-valid-position"
        ]
      },
      {
        step: 2,
        action: "place-token",
        params: {
          tokenType: "current-player-token",
          position: "clicked-square"
        }
      },
      {
        step: 3,
        action: "trigger-activity",
        activityId: "activity-check-win"
      },
      {
        step: 4,
        action: "advance-turn",
        nextPlayer: "other-player"
      }
    ]
  },

  metadata: {
    uiHints: {
      cursorStyle: "pointer",
      highlightEmptySquares: true,
      showPreview: true
    }
  }
}

// Activity: Check Win Condition
{
  id: "activity-check-win",
  name: "Check Win Condition",
  title: "Check for Winner",
  description: "Evaluate if a player has won or if the game is a draw",
  activityType: "system",
  systemName: "tic-tac-toe",

  triggerConditions: {
    triggeredBy: "after-placement"
  },

  executionRules: {
    steps: [
      {
        step: 1,
        action: "check-patterns",
        patterns: "three-in-row"
      },
      {
        step: 2,
        action: "if-winner",
        then: {
          action: "end-game",
          winner: "current-player",
          announcement: "{player} wins!"
        }
      },
      {
        step: 3,
        action: "check-board-full",
        ifTrue: {
          action: "end-game",
          winner: "draw",
          announcement: "It's a draw!"
        }
      }
    ]
  }
}

// Activity: New Game
{
  id: "activity-new-game",
  name: "New Game",
  title: "Start New Game",
  description: "Reset the board and start a new match",
  activityType: "system",
  systemName: "tic-tac-toe",

  executionRules: {
    steps: [
      {
        step: 1,
        action: "clear-board",
        clearTokens: true
      },
      {
        step: 2,
        action: "reset-turn-order",
        firstPlayer: "challenger"
      },
      {
        step: 3,
        action: "set-game-state",
        state: "in-progress"
      }
    ]
  }
}
```

---

## Core Concepts Implementation

### File Structure

```
src/modules/foundry-core-concepts/systems/tic-tac-toe/
├── index.ts                    # System registration
├── system-definition.ts        # RpgSystem configuration
├── board-template.ts           # RpgBoard template
├── grid-card.ts               # RpgCard for 3x3 grid
├── tokens.ts                  # RpgThing definitions (X and O)
├── activities/
│   ├── place-token.ts         # Place token activity
│   ├── check-win.ts           # Win condition check
│   └── new-game.ts            # Reset game
├── rules/
│   ├── placement-rules.ts     # Token placement validation
│   ├── win-conditions.ts      # Win pattern matching
│   └── turn-management.ts     # Turn order logic
└── assets/
    ├── token-x.svg            # X token graphic
    ├── token-o.svg            # O token graphic
    └── board-bg.png           # Board background
```

### System Registration

```typescript
// src/modules/foundry-core-concepts/systems/tic-tac-toe/index.ts

import { RpgSystem } from '@/types/core-concepts';
import { systemDefinition } from './system-definition';
import { boardTemplate } from './board-template';
import { gridCard } from './grid-card';
import { tokenDefinitions } from './tokens';
import { activities } from './activities';

export const TicTacToeSystem: RpgSystem = {
  ...systemDefinition,

  // Register templates
  templates: {
    boards: [boardTemplate],
    cards: [gridCard],
    tokens: tokenDefinitions,
    activities: activities
  },

  // System hooks
  hooks: {
    onGameStart: async (worldId: string) => {
      // Initialize new game
      console.log(`Starting tic-tac-toe game: ${worldId}`);
    },

    onTokenPlaced: async (sheetId: string, position: [number, number], tokenType: string) => {
      // Validate placement and check win condition
      const sheet = await getSheet(sheetId);
      await validatePlacement(sheet, position);
      await checkWinCondition(sheet);
    },

    onGameEnd: async (worldId: string, winner: string) => {
      // Handle game completion
      console.log(`Game ${worldId} ended. Winner: ${winner}`);
    }
  }
};

// Register system with core concepts
export function registerTicTacToeSystem() {
  CoreConcepts.registerSystem(TicTacToeSystem);
}
```

---

## Usage Example

### 1. Create a Tic-Tac-Toe World

```typescript
// GM creates a new tic-tac-toe game
const world = await prisma.rpgWorld.create({
  data: {
    name: "Friendly Tic-Tac-Toe Match",
    systemName: "tic-tac-toe",
    worldScale: "Interaction",
    ownerId: gmUserId,
    settings: {
      timeLimit: 30 // 30 seconds per turn
    }
  }
});
```

### 2. Create Location and Board

```typescript
// System automatically creates location using template
const location = await prisma.rpgLocation.create({
  data: {
    name: "Game Board",
    locationType: "game-board",
    locationScale: "Interaction",
    worldId: world.id,
    boardTemplateId: "template-ttt-board",
    mapCardIds: ["card-ttt-grid"]
  }
});
```

### 3. Start Game Session

```typescript
// Create RpgSheet instance
const sheet = await CoreConcepts.instantiateBoard({
  boardTemplateId: "template-ttt-board",
  worldId: world.id,
  players: [player1Id, player2Id]
});

// Assign tokens
await CoreConcepts.assignToken(sheet.id, player1Id, "token-x");
await CoreConcepts.assignToken(sheet.id, player2Id, "token-o");
```

### 4. Gameplay

```typescript
// Player 1 places X at position [0, 0]
await CoreConcepts.executeActivity({
  activityId: "activity-place-token",
  sheetId: sheet.id,
  playerId: player1Id,
  params: {
    position: [0, 0]
  }
});

// System automatically:
// 1. Validates placement
// 2. Places token
// 3. Checks win condition
// 4. Advances turn to Player 2

// Player 2 places O at position [1, 1]
await CoreConcepts.executeActivity({
  activityId: "activity-place-token",
  sheetId: sheet.id,
  playerId: player2Id,
  params: {
    position: [1, 1]
  }
});

// Continue until win or draw...
```

---

## Key Takeaways

### Simplicity
- **No creatures**: This system has no creature types
- **No stats**: No hit points, armor class, damage, etc.
- **Minimal scope**: Only operates at Interaction scale
- **Single board**: 3x3 grid is the entire game

### Reusability
- **Board template**: Reusable for any tic-tac-toe game
- **Card layout**: 3x3 grid card can be reused
- **Token definitions**: X and O token templates
- **Activities**: Placement and win-check logic reused across all games

### Scale Flexibility
- This game could be nested in a larger world:
  - Inside a tavern in a D&D campaign
  - As a mini-game in a space station
  - As part of a "game night" world
- World leaping could take players from D&D combat into tic-tac-toe

### Data-Driven
- All game logic defined in core concepts
- No hardcoded rules in UI
- Easy to create variants (4x4 grid, different win conditions, etc.)

---

## Variants and Extensions

### Possible Extensions

1. **4x4 Tic-Tac-Toe**
   - Change `gridSize` to 4x4
   - Update win patterns to require 4 in a row

2. **Timed Turns**
   - Add `timeLimit` to system settings
   - Implement timer in UI
   - Auto-forfeit on timeout

3. **Undo Moves**
   - Add `allowUndo` setting
   - Store move history
   - Implement undo activity

4. **AI Opponent**
   - Add `aiDifficulty` setting
   - Implement minimax algorithm
   - Allow single-player games

5. **Tournament Mode**
   - Create universe containing multiple tic-tac-toe worlds
   - Track wins/losses across games
   - Implement bracket system

This demonstrates how even the simplest game can be fully represented in our data-driven system architecture!
