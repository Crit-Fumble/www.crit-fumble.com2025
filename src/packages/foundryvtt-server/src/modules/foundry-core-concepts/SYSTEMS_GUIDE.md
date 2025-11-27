# Systems Framework Guide

**Creating Extensible Game Systems for Foundry Core Concepts**

---

## 📖 Overview

The Systems Framework allows Game Masters to extend their games with modular systems captured from books and sources. Systems can be:

1. **Built-in** - Shipped with foundry-core-concepts (Weather, Travel, etc.)
2. **External Modules** - Separate FoundryVTT modules that extend the framework
3. **Custom** - Created by GMs via journal entries and the rules engine

---

## 🎯 What is a System?

A **System** is a self-contained game mechanic that:
- Tracks state (weather conditions, travel progress, crafting queues, etc.)
- Updates over time
- Applies effects to gameplay
- Can be enabled/disabled
- Persists across sessions

**Examples:**
- Weather System (temperature, precipitation, environmental effects)
- Travel System (pace, fatigue, random encounters)
- Crafting System (recipes, materials, time tracking)
- Economy System (shops, dynamic pricing)
- Reputation System (factions, standing)

---

## 🏗️ Creating a Built-In System

### Step 1: Extend BaseSystem

Create a new file in `scripts/systems/`:

```javascript
// scripts/systems/my-system.mjs
import { BaseSystem } from './base-system.mjs';

export class MySystem extends BaseSystem {
  constructor() {
    super('my-system', 'My System Name', {
      description: 'What this system does',
      version: '1.0.0',
      author: 'Your Name',
      enabled: true,
      config: {
        // System configuration options
        updateInterval: 60, // seconds
        enableFeature: true
      }
    });

    // Initialize state
    this.state = {
      // System state variables
      currentValue: 0,
      lastUpdate: 0
    };
  }

  /**
   * Start the system
   */
  async start() {
    await super.start();

    // Register hooks, create UI, etc.
    Hooks.on('someEvent', this.handleEvent.bind(this));

    console.log('My System | Started');
  }

  /**
   * Update system over time
   */
  async update(deltaTime) {
    // deltaTime is in seconds
    // This is called periodically by SystemsManager

    // Update system state
    this.state.currentValue += deltaTime;

    // Apply effects if needed
    if (this.state.currentValue > 100) {
      await this.applyEffects();
      this.state.currentValue = 0;
    }

    // Save state
    await this.saveState();
  }

  /**
   * Apply system effects
   */
  async applyEffects() {
    // Apply effects to actors, scenes, etc.
  }

  /**
   * Handle events
   */
  handleEvent(event) {
    // Handle game events
  }

  /**
   * Cleanup
   */
  async cleanup() {
    // Remove UI, effects, etc.
    await super.cleanup();
  }
}
```

### Step 2: Register in SystemsManager

Edit `scripts/systems-manager.mjs`:

```javascript
async loadBuiltInSystems() {
  // ... existing systems ...

  try {
    const { MySystem } = await import('./systems/my-system.mjs');
    this.registerSystem(new MySystem());
  } catch (error) {
    console.log('Systems Manager | My System not available (optional)');
  }
}
```

---

## 🔌 Creating an External System Module

External systems are separate FoundryVTT modules that extend the core framework.

### Step 1: Create Module Structure

```
my-weather-system/
├── module.json
├── scripts/
│   └── weather-system.mjs
└── README.md
```

### Step 2: Create module.json

```json
{
  "id": "my-weather-system",
  "title": "Advanced Weather System",
  "description": "Extended weather system with advanced features",
  "version": "1.0.0",
  "compatibility": {
    "minimum": "11",
    "verified": "11"
  },
  "esmodules": ["scripts/init.mjs"],
  "relationships": {
    "requires": [{
      "id": "foundry-core-concepts",
      "type": "module",
      "compatibility": {
        "minimum": "0.1.0"
      }
    }]
  },
  "flags": {
    "foundry-core-concepts": {
      "providesSystem": true,
      "systemId": "advanced-weather"
    }
  }
}
```

### Step 3: Create System Class

```javascript
// scripts/weather-system.mjs
import { BaseSystem } from '../foundry-core-concepts/scripts/systems/base-system.mjs';

export class AdvancedWeatherSystem extends BaseSystem {
  constructor() {
    super('advanced-weather', 'Advanced Weather', {
      description: 'Advanced weather with hurricanes, tornadoes, etc.',
      version: '1.0.0',
      author: 'Your Name'
    });

    // ... implement system ...
  }

  // ... override methods ...
}
```

### Step 4: Register via init.mjs

```javascript
// scripts/init.mjs
import { AdvancedWeatherSystem } from './weather-system.mjs';

Hooks.once('ready', () => {
  // Wait for core concepts to be ready
  if (game.coreConcepts?.systems) {
    const system = new AdvancedWeatherSystem();
    game.coreConcepts.systems.registerSystem(system);
    console.log('Advanced Weather System | Registered');
  } else {
    console.error('Foundry Core Concepts module not found!');
  }
});
```

---

## 📝 Creating Custom Systems via Journal Entries

GMs can create simple systems without coding using journal entries.

### Step 1: Create Journal Entry

1. Create a new Journal Entry
2. Set flags via console or module API

### Step 2: Configure System via Flags

```javascript
// In browser console (as GM)
const journal = game.journal.getName('My Custom System');

await journal.setFlag('foundry-core-concepts', 'isSystem', true);
await journal.setFlag('foundry-core-concepts', 'systemId', 'my-custom');
await journal.setFlag('foundry-core-concepts', 'systemDescription', 'My custom system description');
await journal.setFlag('foundry-core-concepts', 'systemConfig', {
  updateInterval: 3600
});
await journal.setFlag('foundry-core-concepts', 'systemRules', [
  {
    name: 'System Rule 1',
    trigger: 'updateWorldTime',
    condition: 'args[1] > 3600',
    effect: 'ui.notifications.info("System triggered!")'
  }
]);
```

### Step 3: Reload

Reload the world and the system will be loaded automatically.

---

## 🔧 API Reference

### BaseSystem Class

```javascript
class BaseSystem {
  constructor(id, name, options)

  // Lifecycle
  async start()
  async stop()
  async update(deltaTime)
  async cleanup()

  // State Management
  getState()
  setState(newState)
  async saveState()
  async loadState()
  onStateChange(state)

  // Configuration
  getConfig()
  setConfig(newConfig)
  onConfigChange(config)

  // Settings
  registerSettings()

  // Metadata
  getMetadata()
  validate()
  getDependencies()

  // Import/Export
  exportData()
  async importData(data)
}
```

### SystemsManager API

```javascript
// Get systems manager
const manager = game.coreConcepts.systems;

// Register a system
manager.registerSystem(mySystem);

// Get system
const weather = manager.getSystem('weather');

// Enable/disable
await manager.enableSystem('weather');
await manager.disableSystem('weather');

// Get all systems
const all = manager.getAllSystems();
const enabled = manager.getEnabledSystems();

// Export/import
const data = manager.exportAllSystems();
await manager.importSystemData('weather', data);
```

### Global API

```javascript
// For external modules
import { registerGameSystem } from './systems-manager.mjs';

registerGameSystem(mySystem);
```

---

## 🎨 Examples

### Simple Timer System

```javascript
export class TimerSystem extends BaseSystem {
  constructor() {
    super('timer', 'Game Timer', {
      description: 'Tracks elapsed game time'
    });

    this.state = { elapsed: 0 };
  }

  async update(deltaTime) {
    this.state.elapsed += deltaTime;
    await this.saveState();

    // Update UI
    const widget = document.getElementById('timer-widget');
    if (widget) {
      widget.textContent = `Time: ${Math.floor(this.state.elapsed)}s`;
    }
  }
}
```

### Resource Consumption System

```javascript
export class ResourceSystem extends BaseSystem {
  constructor() {
    super('resources', 'Resource Consumption', {
      description: 'Tracks food and water consumption'
    });

    this.config = {
      foodPerDay: 1,
      waterPerDay: 1
    };
  }

  async update(deltaTime) {
    // Every 24 hours (86400 seconds)
    if (deltaTime >= 86400) {
      for (const actor of game.actors) {
        await this.consumeResources(actor);
      }
    }
  }

  async consumeResources(actor) {
    // Remove food and water items
    // Apply exhaustion if insufficient
  }
}
```

---

## 📚 System Ideas from Books/Sources

Here are systems you can extract from various TTRPG sources:

### D&D 5e SRD
- **Resting System** (short rest, long rest mechanics)
- **Exhaustion System** (6 levels of exhaustion)
- **Madness System** (short-term, long-term, indefinite)
- **Diseases System** (infection, recovery)
- **Poisons System** (damage, effects over time)

### Pathfinder
- **Kingdom Building** (settlements, resources, events)
- **Downtime Activities** (crafting, research, training)
- **Mass Combat** (army units, battlefield)

### Cypher System
- **Cyphers Management** (temporary powerful items)
- **Intrusions** (GM intrusions for XP)

### Custom
- **Survival System** (temperature, hunger, thirst)
- **Sanity System** (mental health tracking)
- **Alignment Drift** (actions affect alignment)
- **Age and Aging** (effects of time)

---

## 🚀 Best Practices

1. **Keep Systems Modular** - Systems should work independently
2. **Use State Wisely** - Save only essential data
3. **Respect Performance** - Don't update too frequently
4. **Document Well** - Help others understand your system
5. **Test Thoroughly** - Especially state persistence
6. **Handle Errors** - Don't crash the game
7. **Provide UI** - Make state visible to players
8. **Support Import/Export** - Let GMs share configurations

---

## 📦 Publishing Your System

### As a Module

1. Create proper module.json
2. Test with foundry-core-concepts
3. Publish to FoundryVTT package system
4. Add "foundry-core-concepts" as dependency

### As a Compendium

1. Export system configuration
2. Create compendium pack
3. Share JSON files
4. Users can import via journal entries

---

## 🔗 Resources

- [BaseSystem Source](scripts/systems/base-system.mjs)
- [SystemsManager Source](scripts/systems-manager.mjs)
- [Weather System Example](scripts/systems/weather-system.mjs)
- [FoundryVTT Module Development](https://foundryvtt.com/article/module-development/)

---

**Ready to create your own systems!** 🎲
