# TTRPG Core Concepts Web API

> Client library for connecting web applications to TTRPG Core Concepts Bridge API

## Overview

This package provides a framework-agnostic client library for web applications to communicate with TTRPG games running in Foundry VTT. It includes:

- **WebSocket client** - Real-time connection to bridge server
- **React hooks** - Optional React integration
- **TypeScript types** - Full type safety
- **Event system** - Subscribe to game events
- **Command API** - Send commands to game instances

## Installation

```bash
npm install @crit-fumble/ttrpg-core-concepts-web-api
```

### With React

```bash
npm install @crit-fumble/ttrpg-core-concepts-web-api react
```

## Usage

### Vanilla JavaScript

```typescript
import { CoreConceptsClient } from '@crit-fumble/ttrpg-core-concepts-web-api';

// Create client
const client = new CoreConceptsClient({
  bridgeUrl: 'wss://bridge.crit-fumble.com',
  campaignId: 'campaign-123',
  auth: {
    token: 'your_auth_token'
  }
});

// Connect
await client.connect();

// Subscribe to events
client.on('character.update', (character) => {
  console.log('Character updated:', character);
});

client.on('dice.roll', (roll) => {
  console.log('Dice rolled:', roll);
});

// Send commands
await client.send('character.heal', {
  characterId: 'char-456',
  amount: 10
});

// Disconnect
await client.disconnect();
```

### React Hooks

```typescript
import { useCoreConceptsClient, useGameEvent, useCharacter } from '@crit-fumble/ttrpg-core-concepts-web-api/react';

function MyComponent() {
  // Connect to bridge
  const client = useCoreConceptsClient({
    bridgeUrl: process.env.NEXT_PUBLIC_BRIDGE_URL,
    campaignId: 'campaign-123'
  });

  // Subscribe to specific event
  useGameEvent('dice.roll', (roll) => {
    console.log('Dice rolled:', roll);
  });

  // Get character data with real-time updates
  const character = useCharacter('char-456');

  // Send commands
  const healCharacter = async () => {
    await client.send('character.heal', {
      characterId: 'char-456',
      amount: 10
    });
  };

  return (
    <div>
      <h2>{character?.name}</h2>
      <p>HP: {character?.hp.current}/{character?.hp.max}</p>
      <button onClick={healCharacter}>Heal</button>
    </div>
  );
}
```

### Next.js Integration

```typescript
// app/providers.tsx
'use client';

import { CoreConceptsProvider } from '@crit-fumble/ttrpg-core-concepts-web-api/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CoreConceptsProvider
      bridgeUrl={process.env.NEXT_PUBLIC_BRIDGE_URL!}
      auth={{
        getToken: async () => {
          // Get auth token from your session
          const response = await fetch('/api/auth/token');
          const { token } = await response.json();
          return token;
        }
      }}
    >
      {children}
    </CoreConceptsProvider>
  );
}
```

## API Reference

### CoreConceptsClient

#### Constructor Options

```typescript
interface ClientOptions {
  // Bridge server URL
  bridgeUrl: string;

  // Campaign/game ID
  campaignId: string;

  // Authentication
  auth?: {
    token?: string;
    getToken?: () => Promise<string>;
  };

  // Reconnection settings
  reconnect?: {
    enabled: boolean;
    maxAttempts: number;
    delayMs: number;
  };

  // Debug mode
  debug?: boolean;
}
```

#### Methods

```typescript
// Connect to bridge
await client.connect(): Promise<void>

// Disconnect
await client.disconnect(): Promise<void>

// Subscribe to event
client.on(event: string, handler: (data: any) => void): () => void

// Unsubscribe from event
client.off(event: string, handler: Function): void

// Send command to game
await client.send(command: string, data: any): Promise<void>

// Get connection status
client.isConnected(): boolean

// Get current campaign ID
client.getCampaignId(): string
```

### React Hooks

#### useCoreConceptsClient

```typescript
const client = useCoreConceptsClient(options: ClientOptions)
```

Returns the client instance.

#### useGameEvent

```typescript
useGameEvent(event: string, handler: (data: any) => void)
```

Subscribe to a specific game event.

#### useCharacter

```typescript
const character = useCharacter(characterId: string): Character | null
```

Get character data with real-time updates.

#### useCombat

```typescript
const combat = useCombat(combatId: string): Combat | null
```

Get combat encounter data with real-time updates.

#### useGameState

```typescript
const gameState = useGameState(): GameState
```

Get overall game state (current scene, active players, etc.).

#### useConnectionStatus

```typescript
const { connected, reconnecting } = useConnectionStatus()
```

Get WebSocket connection status.

## Event Types

### Character Events

```typescript
// Character created
character.create: {
  characterId: string;
  name: string;
  playerId: string;
}

// Character updated
character.update: {
  characterId: string;
  changes: Partial<Character>;
}

// Character deleted
character.delete: {
  characterId: string;
}

// Character healed
character.heal: {
  characterId: string;
  amount: number;
  newHp: number;
}

// Character damaged
character.damage: {
  characterId: string;
  amount: number;
  newHp: number;
  source?: string;
}
```

### Combat Events

```typescript
// Combat started
combat.start: {
  combatId: string;
  participants: Combatant[];
}

// Combat ended
combat.end: {
  combatId: string;
  winner?: string;
}

// Turn changed
combat.turn: {
  combatId: string;
  currentTurn: number;
  activeCharacterId: string;
}

// Round changed
combat.round: {
  combatId: string;
  round: number;
}
```

### Dice Events

```typescript
// Dice rolled
dice.roll: {
  rollId: string;
  formula: string;
  result: number;
  rolls: number[];
  characterId?: string;
  characterName?: string;
}
```

### Scene Events

```typescript
// Scene changed
scene.change: {
  sceneId: string;
  name: string;
}

// Token moved
token.move: {
  tokenId: string;
  x: number;
  y: number;
}
```

## Command Types

### Character Commands

```typescript
// Heal character
character.heal: {
  characterId: string;
  amount: number;
}

// Damage character
character.damage: {
  characterId: string;
  amount: number;
  source?: string;
}

// Update character
character.update: {
  characterId: string;
  changes: Partial<Character>;
}
```

### Combat Commands

```typescript
// Start combat
combat.start: {
  participants: string[];
}

// End combat
combat.end: {
  combatId: string;
}

// Advance turn
combat.nextTurn: {
  combatId: string;
}
```

### Dice Commands

```typescript
// Roll dice
dice.roll: {
  formula: string;
  characterId?: string;
}
```

## TypeScript Types

```typescript
interface Character {
  id: string;
  name: string;
  playerId: string;
  hp: {
    current: number;
    max: number;
    temp: number;
  };
  ac: number;
  level: number;
  class: string;
  race: string;
  inventory: Item[];
  spells: Spell[];
  abilities: Ability[];
}

interface Combat {
  id: string;
  active: boolean;
  round: number;
  turn: number;
  combatants: Combatant[];
}

interface Combatant {
  id: string;
  characterId: string;
  initiative: number;
  hp: number;
  ac: number;
  conditions: string[];
}

interface DiceRoll {
  id: string;
  formula: string;
  result: number;
  rolls: number[];
  timestamp: string;
  characterId?: string;
  characterName?: string;
}

interface GameState {
  campaignId: string;
  currentSceneId: string;
  activePlayers: string[];
  activeCombat?: string;
  timestamp: string;
}
```

## Error Handling

```typescript
import { CoreConceptsError, ConnectionError, AuthenticationError } from '@crit-fumble/ttrpg-core-concepts-web-api';

try {
  await client.connect();
} catch (error) {
  if (error instanceof ConnectionError) {
    console.error('Failed to connect to bridge');
  } else if (error instanceof AuthenticationError) {
    console.error('Authentication failed');
  } else {
    console.error('Unknown error:', error);
  }
}

// Listen for connection errors
client.on('error', (error) => {
  console.error('Client error:', error);
});

// Listen for connection state changes
client.on('connect', () => {
  console.log('Connected to bridge');
});

client.on('disconnect', () => {
  console.log('Disconnected from bridge');
});

client.on('reconnecting', (attempt) => {
  console.log(`Reconnecting... attempt ${attempt}`);
});
```

## Configuration

### Environment Variables

```bash
# Bridge API URL
NEXT_PUBLIC_BRIDGE_URL=wss://bridge.crit-fumble.com

# Optional: Auth endpoint
NEXT_PUBLIC_AUTH_ENDPOINT=/api/auth/token

# Optional: Debug mode
NEXT_PUBLIC_DEBUG_BRIDGE=true
```

## Testing

### Mock Client

```typescript
import { createMockClient } from '@crit-fumble/ttrpg-core-concepts-web-api/testing';

const mockClient = createMockClient();

// Simulate events
mockClient.emit('character.update', {
  characterId: 'char-123',
  changes: { hp: { current: 25 } }
});

// Verify commands sent
expect(mockClient.commands).toContainEqual({
  type: 'character.heal',
  data: { characterId: 'char-123', amount: 10 }
});
```

### React Testing

```typescript
import { renderHook } from '@testing-library/react';
import { CoreConceptsProvider, useCharacter } from '@crit-fumble/ttrpg-core-concepts-web-api/react';

test('should update character HP', () => {
  const wrapper = ({ children }) => (
    <CoreConceptsProvider bridgeUrl="ws://mock" campaignId="test">
      {children}
    </CoreConceptsProvider>
  );

  const { result } = renderHook(() => useCharacter('char-123'), { wrapper });

  // Wait for character data
  await waitFor(() => {
    expect(result.current).toBeTruthy();
  });

  expect(result.current.hp.current).toBe(50);
});
```

## Examples

See the `/examples` directory for complete examples:

- `vanilla-js-example/` - Plain JavaScript usage
- `react-example/` - React component examples
- `next-js-example/` - Next.js integration
- `game-dashboard/` - Full featured dashboard

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Run tests
npm test
```

## License

MIT License - See LICENSE file for details

## Links

- [Documentation](https://docs.crit-fumble.com/web-api)
- [GitHub](https://github.com/crit-fumble/ttrpg-core-concepts-web-api)
- [NPM](https://www.npmjs.com/package/@crit-fumble/ttrpg-core-concepts-web-api)
