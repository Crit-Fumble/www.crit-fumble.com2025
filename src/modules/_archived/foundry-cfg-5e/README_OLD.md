# Foundry Behaviors

**AI-Driven Creature Behavior System for Foundry VTT**

---

## Overview

Foundry Behaviors brings autonomous NPC behaviors to your Foundry VTT games. Give your creatures personalities, goals, schedules, and realistic reactions that make your world feel alive.

**Requires:** [Foundry Core Concepts](../foundry-core-concepts) module

---

## Features

- **Autonomous AI Behaviors** - NPCs act independently based on their assigned behaviors
- **Personality & Goals** - Creatures have motivations that drive their actions
- **Reactive Behaviors** - NPCs respond to player actions and environmental changes
- **Patrol System** - Creatures patrol between waypoints with configurable patterns
- **Combat Behaviors** - Flee, guard, aggressive, defensive tactics
- **Social Behaviors** - Trade, converse, follow, escort
- **Extensible** - Create custom behaviors or use built-in ones

---

## Installation

### Automatic Installation

1. Open Foundry VTT
2. Go to **Add-on Modules**
3. Click **Install Module**
4. Search for **"Foundry Behaviors"**
5. Click **Install**

### Manual Installation

1. Download the latest release
2. Extract to `Data/modules/foundry-behaviors/`
3. Enable in your world's module settings

**Dependencies:**
- Foundry Core Concepts (required)

---

## Quick Start

### 1. Assign Behaviors to NPCs

1. Right-click an actor in the Actors directory
2. Select **Manage Behaviors**
3. Check the behaviors you want to assign
4. Click **Save**

### 2. Configure Patrol Routes

For patrol behaviors:

```javascript
// In browser console (as GM)
const goblin = game.actors.getName('Goblin Guard');

await goblin.setFlag('foundry-behaviors', 'patrolWaypoints', [
  { x: 1000, y: 1000, pause: 5 },  // Pause 5 seconds
  { x: 1500, y: 1000, pause: 0 },
  { x: 1500, y: 1500, pause: 3 },
  { x: 1000, y: 1500, pause: 0 }
]);

await goblin.setFlag('foundry-behaviors', 'patrolPattern', 'loop');
await goblin.setFlag('foundry-behaviors', 'patrolSpeed', 100);
```

### 3. Start Behaviors

Behaviors start automatically when assigned. You can also manually trigger:

```javascript
await game.foundryBehaviors.manager.executeBehavior('patrol', goblin);
```

---

## Built-In Behaviors

### Patrol
- **Type:** Utility
- **Description:** Patrol between designated waypoints
- **Configuration:**
  - `patrolWaypoints`: Array of `{x, y, pause}` waypoints
  - `patrolPattern`: `loop` (default), `bounce`, or `once`
  - `patrolSpeed`: Pixels per second (default: 100)

### Flee (Coming Soon)
- **Type:** Combat
- **Description:** Flee when health drops below threshold
- **Configuration:**
  - `fleeThreshold`: HP % to trigger flee (default: 25)
  - `fleeDuration`: How long to flee (seconds)

### Guard (Coming Soon)
- **Type:** Combat
- **Description:** Guard a specific location or actor
- **Configuration:**
  - `guardTarget`: Location or actor to guard
  - `guardRadius`: Detection radius

---

## Creating Custom Behaviors

### Method 1: Extend Behavior Class

```javascript
// my-custom-behavior.mjs
import { Behavior } from './behavior.mjs';

export class CustomBehavior extends Behavior {
  constructor() {
    super('custom', 'Custom Behavior', {
      description: 'My custom behavior',
      type: 'general',
      priority: 100
    });
  }

  async update(actor, deltaTime) {
    // Your behavior logic here
    console.log(`Updating ${actor.name}`);
  }

  canExecute(actor) {
    // Check if behavior can run
    return super.canExecute(actor);
  }
}
```

### Method 2: Via Journal Entry

1. Create a Journal Entry
2. Set flags via console:

```javascript
const journal = game.journal.getName('My Behavior');

await journal.setFlag('foundry-behaviors', 'isBehavior', true);
await journal.setFlag('foundry-behaviors', 'behaviorId', 'my-custom');
await journal.setFlag('foundry-behaviors', 'behaviorType', 'general');
await journal.setFlag('foundry-behaviors', 'description', 'My custom behavior');
await journal.setFlag('foundry-behaviors', 'priority', 100);
```

3. Reload the world

---

## API Reference

### BehaviorManager

```javascript
const manager = game.foundryBehaviors.manager;

// Register a behavior
manager.registerBehavior(myBehavior);

// Assign to actor
await manager.assignBehaviorToActor(behavior, actor);

// Remove from actor
await manager.removeBehaviorFromActor(behavior, actor);

// Get actor's behaviors
const behaviors = manager.getActorBehaviors(actor);

// Execute behavior
await manager.executeBehavior('patrol', actor);

// Get all behaviors
const all = manager.getAllBehaviors();
const byType = manager.getBehaviorsByType('combat');
```

### Behavior Class

```javascript
class MyBehavior extends Behavior {
  constructor(id, name, options)

  // Lifecycle
  async onAssign(actor)
  async onRemove(actor)
  async update(actor, deltaTime)
  async execute(actor)

  // State
  getState(actor)
  setState(actor, state)
  resetState(actor)

  // Conditions
  canExecute(actor)
  getPriority(actor)

  // Metadata
  getMetadata()
  validate()
}
```

---

## Configuration

### Module Settings

- **Enable Creature Behaviors**: Toggle behaviors on/off
- **Behavior Update Interval**: How often behaviors update (milliseconds)
- **Debug Mode**: Enable detailed logging

### Per-Actor Flags

Behaviors are stored as flags on actors:

```javascript
// Get actor's behaviors
const behaviors = actor.getFlag('foundry-behaviors', 'behaviors');

// Set behaviors
await actor.setFlag('foundry-behaviors', 'behaviors', ['patrol', 'flee']);
```

---

## Examples

### Goblin Patrol

```javascript
const goblin = game.actors.getName('Goblin');

// Assign patrol behavior
const patrol = game.foundryBehaviors.manager.getBehavior('patrol');
await game.foundryBehaviors.manager.assignBehaviorToActor(patrol, goblin);

// Configure waypoints
await goblin.setFlag('foundry-behaviors', 'patrolWaypoints', [
  { x: 1000, y: 1000, pause: 3 },
  { x: 2000, y: 1000, pause: 3 },
  { x: 2000, y: 2000, pause: 3 },
  { x: 1000, y: 2000, pause: 3 }
]);
```

### Wolf Pack

```javascript
const wolves = game.actors.filter(a => a.name.includes('Wolf'));

// Assign aggressive behavior to all wolves
const aggressive = game.foundryBehaviors.manager.getBehavior('aggressive');
for (const wolf of wolves) {
  await game.foundryBehaviors.manager.assignBehaviorToActor(aggressive, wolf);
}
```

---

## Integration with Core Concepts

Behaviors integrate seamlessly with Foundry Core Concepts:

- **Modes**: Behaviors can respond to mode changes (combat, exploration, etc.)
- **Rules**: Trigger behaviors based on rule conditions
- **Systems**: Behaviors can interact with game systems (weather, travel, etc.)

```javascript
// React to mode changes
Hooks.on('modeChange', (newMode) => {
  if (newMode === 'combat') {
    // Switch to combat behaviors
  }
});
```

---

## Performance

- Behaviors update on configurable intervals (default: 1 second)
- Only active behaviors consume resources
- Behaviors are sorted by priority for efficient execution
- State is cached per actor for fast access

---

## Troubleshooting

### Behaviors Not Running

1. Check that the module is enabled
2. Verify behaviors are assigned to actors
3. Check that `canExecute()` returns true
4. Enable debug mode for detailed logs

### Token Not Moving

1. Ensure you're GM or own the token
2. Check that waypoints are valid
3. Verify `patrolSpeed` is set
4. Check for token collision

---

## Roadmap

- [ ] Behavior Trees for complex decision making
- [ ] Visual waypoint editor
- [ ] More built-in behaviors (flee, guard, trade, etc.)
- [ ] Behavior schedules (time-based activation)
- [ ] Group behaviors (coordinated actions)
- [ ] Memory system (remember player actions)

---

## Support

- **Issues**: [GitHub Issues](https://github.com/crit-fumble/foundry-behaviors/issues)
- **Discussions**: [GitHub Discussions](https://github.com/crit-fumble/foundry-behaviors/discussions)
- **Discord**: [Crit-Fumble Server](https://discord.gg/crit-fumble)

---

## License

MIT License - See LICENSE file for details

---

**Make your NPCs come alive with Foundry Behaviors!** 🧠✨
