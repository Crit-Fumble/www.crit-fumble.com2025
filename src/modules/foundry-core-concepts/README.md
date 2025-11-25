# Foundry Core Concepts

**Version:** 0.1.0
**FoundryVTT Compatibility:** v11+
**License:** MIT

A comprehensive FoundryVTT module that implements unified TTRPG core concepts, extending Foundry with enhanced systems for types, books, rules, game modes, and deck management. Built for the [Crit-Fumble](https://crit-fumble.com) platform.

---

## 🎯 Overview

This module addresses the gap between FoundryVTT's excellent foundation and the structured core concepts needed for a universal TTRPG platform. It provides:

- **Types Registry** - Unified type definitions for actors and items
- **Books Manager** - Enhanced books linking cards, tables, rules, and more
- **Rules Engine** - Formal rules system with triggers and conditional logic
- **Modes Manager** - Game mode system (Combat, Exploration, Social, etc.)
- **Decks Manager** - Card deck and hand management

---

## 📦 Installation

### Option 1: Module Manager (Recommended)

1. In FoundryVTT, go to **Add-on Modules**
2. Click **Install Module**
3. Search for "Foundry Core Concepts"
4. Click **Install**

### Option 2: Manual Installation

1. Download the latest release from [GitHub](https://github.com/crit-fumble/foundry-core-concepts/releases)
2. Extract to `Data/modules/foundry-core-concepts/`
3. Restart FoundryVTT
4. Enable the module in your world

### Option 3: Development Setup

```bash
# Clone from your monorepo
cd www.crit-fumble.com/src/modules/foundry-core-concepts

# Symlink to Foundry modules directory
ln -s $(pwd) /path/to/foundry/Data/modules/foundry-core-concepts
```

---

## 🚀 Features

### 1. Types Registry

Unified type system for defining reusable templates (classes, creature types, item types, etc.).

**How it works:**
- Types are stored as journal entries with special flags
- Apply types to actors/items as templates
- Merge type data with existing actor/item data
- Organize by category

**Usage:**
```javascript
// Register a type
await game.coreConcepts.types.registerType(
  'Fighter',
  'class',
  { hitDie: 'd10', proficiencies: ['weapons', 'armor'] },
  { description: 'A martial warrior class' }
);

// Apply to an actor
await game.coreConcepts.types.applyTypeToActor(actor, typeId);
```

**UI Features:**
- "Apply Type" button on actor/item sheets
- Category-based type selection
- Track applied types on documents

---

### 2. Books Manager

Enhanced books that can contain and link cards, tables, rules, actors, and items.

**How it works:**
- Books are journal entries with enhanced metadata
- Link multiple document types to a single book
- Retrieve all linked content easily
- Convert existing journals to books

**Usage:**
```javascript
// Create a book
const book = await game.coreConcepts.books.createBook(
  'Player\'s Handbook',
  {
    author: 'Wizards of the Coast',
    version: '5.0',
    description: 'Core rulebook'
  }
);

// Link content
await game.coreConcepts.books.linkTable(book.id, tableId);
await game.coreConcepts.books.linkActor(book.id, actorId);

// Get all contents
const contents = await game.coreConcepts.books.getBookContents(book.id);
```

**UI Features:**
- "Convert to Book" button on journal entries
- "Manage Book" interface
- View all linked content

---

### 3. Rules Engine

Formal rules system with hook-based triggers, conditions, and effects.

**How it works:**
- Rules are journal entries with trigger/condition/effect
- Automatically registers hooks for rule triggers
- Evaluates conditions before executing effects
- Priority-based execution

**Usage:**
```javascript
// Create a rule
await game.coreConcepts.rules.createRule(
  'Critical Hit',
  'preCreateChatMessage',  // trigger hook
  'args[0].flags?.dnd5e?.roll?.type === "attack" && args[0].flags?.dnd5e?.roll?.isCritical',  // condition
  'ui.notifications.info("Critical hit!")',  // effect
  { priority: 50 }
);

// Enable/disable rules
await game.coreConcepts.rules.enableRule(ruleId);
await game.coreConcepts.rules.disableRule(ruleId);
```

**Available Context:**
- `game` - Game instance
- `args` - Hook arguments
- `rule` - Rule data
- Helper functions: `getActor()`, `getItem()`, `getToken()`, `roll()`

---

### 4. Modes Manager

Game mode system that changes UI and available actions based on current activity.

**Default Modes:**
- **Character Creation** - Create and configure characters
- **Combat** - Tactical combat encounters
- **Exploration** - Explore the world
- **Social Interaction** - Roleplay and NPC interaction
- **Travel** - Journey between locations
- **Downtime** - Perform downtime activities

**How it works:**
- Each mode has its own UI configuration
- Modes can define available actions
- Automatic mode switching with notifications
- Custom modes via journal entries

**Usage:**
```javascript
// Switch mode
await game.coreConcepts.modes.switchMode('combat');

// Get current mode
const mode = game.coreConcepts.modes.getCurrentMode();
console.log(mode.name); // "Combat"

// Register custom mode
game.coreConcepts.modes.registerMode('crafting', {
  name: 'Crafting',
  description: 'Craft items and equipment',
  icon: 'fas fa-hammer',
  ui: { showActorDirectory: true, showItemDirectory: true },
  actions: ['craft', 'disenchant'],
  onActivate: async () => { /* custom logic */ }
});
```

**UI Features:**
- Mode selector in player list (GM only)
- Mode indicator in scene controls
- Visual feedback on mode changes

---

### 5. Decks Manager

Card deck and hand management system.

**Concept Mapping:**
- **Deck (Compendium)** = Library of template cards
- **Deck (Active)** = Shuffled, drawable deck in the game
- **Hand** = Player's drawn cards
- **Sheet** = Can contain decks/hands

**How it works:**
- Integrates with FoundryVTT's native Cards system
- Create active decks from compendiums
- Draw cards to player hands
- Play/discard cards from hand

**Usage:**
```javascript
// Create deck from compendium
const deck = await game.coreConcepts.decks.createDeckFromCompendium(
  'world.spell-cards',
  'My Spell Deck'
);

// Draw cards to player hand
await game.coreConcepts.decks.drawCards(deck.id, userId, 5);

// Play a card
await game.coreConcepts.decks.playCard(userId, cardId);

// Get player hand
const hand = game.coreConcepts.decks.getHand(userId);
console.log(hand.cards); // Array of card IDs
```

---

## ⚙️ Configuration

### Module Settings

Access via **Game Settings → Module Settings → Foundry Core Concepts**

- **Enable Types System** - Toggle type registry (default: enabled)
- **Enable Books System** - Toggle enhanced books (default: enabled)
- **Enable Rules Engine** - Toggle rules system (default: enabled)
- **Enable Game Modes** - Toggle mode system (default: enabled)
- **Debug Mode** - Enable detailed logging (default: disabled)
- **Crit-Fumble API Token** - Platform integration token

---

## 🔌 API Reference

### Global API

The module exposes its API on `game.coreConcepts`:

```javascript
game.coreConcepts.types      // TypesRegistry
game.coreConcepts.books      // BooksManager
game.coreConcepts.rules      // RulesEngine
game.coreConcepts.modes      // ModesManager
game.coreConcepts.decks      // DecksManager
```

### Hooks

The module provides custom hooks for integration:

```javascript
// When game mode changes
Hooks.on('coreConcepts.modeChanged', (mode) => {
  console.log(`Switched to ${mode.name}`);
});

// When a card is played
Hooks.on('coreConcepts.cardPlayed', (userId, card) => {
  console.log(`${userId} played ${card.name}`);
});
```

---

## 🧩 Core Concepts Mapping

This module implements the following core TTRPG concepts:

| Concept | FoundryVTT Native | Module Enhancement |
|---------|-------------------|-------------------|
| **Sheets** | Actor/Item sheets | ✅ Native |
| **Attributes** | Actor/Item data fields | ✅ Native |
| **Types** | Actor/Item types | ✨ **Types Registry** |
| **Dice** | Roll API | ✅ Native |
| **Tables** | RollTable documents | ✅ Native |
| **Books** | JournalEntry | ✨ **Books Manager** |
| **Cards** | Card documents | ✅ Native |
| **Hand** | User flags | ✨ **Decks Manager** |
| **Deck** | Cards/Compendiums | ✨ **Decks Manager** |
| **Boards** | Scene documents | ✅ Native |
| **Tiles** | Tile documents + Grid | ✅ Native |
| **Rules** | Macros, Active Effects | ✨ **Rules Engine** |
| **Modes** | Combat tracker | ✨ **Modes Manager** |
| **Systems** | Game systems | 🔶 Partial (via rules) |
| **Creatures** | Actor documents | ✅ Native |
| **Locations** | Scene + Journal | ✅ Native |
| **Objects** | Item documents | ✅ Native |

**Legend:**
- ✅ Native = Already exists in FoundryVTT
- ✨ Module Enhancement = Added by this module
- 🔶 Partial = Partially implemented

---

## 🛠️ Development

### Project Structure

```
foundry-core-concepts/
├── module.json              # Module manifest
├── LICENSE                  # MIT License
├── README.md                # This file
├── CHANGELOG.md             # Version history
├── scripts/
│   ├── init.mjs            # Main entry point
│   ├── types-registry.mjs   # Types system
│   ├── books-manager.mjs    # Books system
│   ├── rules-engine.mjs     # Rules system
│   ├── modes-manager.mjs    # Modes system
│   └── decks-manager.mjs    # Decks system
├── styles/
│   └── core-concepts.css    # Module styles
├── lang/
│   └── en.json              # English localization
└── templates/               # Handlebars templates (future)
```

### Building

No build step required - pure ES modules.

### Testing

```bash
# Start Foundry with the module
cd /path/to/foundry
node main.mjs --dataPath=./Data

# Enable module in world
# Test features in console
game.coreConcepts.types.getAllTypes()
```

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

### Guidelines

- Follow existing code style
- Add comments for complex logic
- Update README/CHANGELOG
- Test with FoundryVTT v11

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file

---

## 🔗 Links

- **GitHub**: https://github.com/crit-fumble/foundry-core-concepts
- **Crit-Fumble Platform**: https://crit-fumble.com
- **FoundryVTT**: https://foundryvtt.com
- **Issues**: https://github.com/crit-fumble/foundry-core-concepts/issues

---

## 🙏 Credits

Built by [Crit-Fumble](https://crit-fumble.com)

Powered by [FoundryVTT](https://foundryvtt.com)

---

**Last Updated:** 2025-11-19
