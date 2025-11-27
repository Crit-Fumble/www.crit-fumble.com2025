# Safe Rules Guide - Foundry Core Concepts

## Overview

As of v0.3.0, the Rules Engine uses a **safe template-based system** instead of arbitrary code execution. This prevents security vulnerabilities while providing powerful rule functionality.

---

## Quick Start

### Creating a Safe Rule

```javascript
await game.coreConcepts.rules.createRule(
  "Rule Name",                    // Name
  "updateActor",                  // Trigger hook
  {                               // Condition (optional)
    operator: "greaterThan",
    left: "args[0].system.attributes.hp.value",
    right: 0
  },
  {                               // Effect (template-based)
    template: "notify",
    params: {
      message: "Actor HP updated!",
      level: "info"
    }
  },
  {                               // Options (optional)
    priority: 100,
    enabled: true,
    description: "Shows notification when actor HP changes",
    category: "automation",
    tags: ["hp", "notification"]
  }
);
```

---

## Available Templates

### 1. notify - Show Notifications

Display a notification to users.

**Parameters:**
- `message` (string, required) - The notification message
- `level` (string, optional) - Notification level: "info", "warn", "error" (default: "info")

**Example:**
```javascript
{
  template: "notify",
  params: {
    message: "Combat has started!",
    level: "warn"
  }
}
```

---

### 2. modifyAttribute - Modify Actor/Item Attributes

Safely modify an attribute value with validation.

**Parameters:**
- `actorId` (string, required) - ID of the actor (use "args[0].id" for trigger actor)
- `attributePath` (string, required) - Dot-notation path (e.g., "system.attributes.hp.value")
- `operation` (string, required) - Operation: "add", "subtract", "multiply", "divide", "set"
- `value` (number, required) - Value to use in the operation

**Example:**
```javascript
{
  template: "modifyAttribute",
  params: {
    actorId: "args[0].id",
    attributePath: "system.attributes.hp.value",
    operation: "add",
    value: 10
  }
}
```

---

### 3. createChatMessage - Post to Chat

Create a chat message.

**Parameters:**
- `content` (string, required) - The message content (HTML supported)
- `speaker` (object, optional) - Speaker object (default: "Core Concepts")
- `whisper` (array, optional) - Array of user IDs to whisper to

**Example:**
```javascript
{
  template: "createChatMessage",
  params: {
    content: "<h2>Critical Hit!</h2><p>Double damage applied.</p>",
    speaker: { alias: "Game Master" }
  }
}
```

---

### 4. rollDice - Roll Dice

Roll dice and optionally show the result in chat.

**Parameters:**
- `formula` (string, required) - Dice formula (e.g., "2d6+3")
- `showInChat` (boolean, optional) - Show roll in chat (default: true)
- `flavor` (string, optional) - Flavor text for the roll

**Example:**
```javascript
{
  template: "rollDice",
  params: {
    formula: "1d20+5",
    showInChat: true,
    flavor: "Initiative Roll"
  }
}
```

---

### 5. triggerHook - Trigger Custom Hooks

Trigger a custom Core Concepts hook.

**Parameters:**
- `hookName` (string, required) - Hook name (must start with "coreConcepts.")
- `data` (object, optional) - Data to pass to the hook

**Example:**
```javascript
{
  template: "triggerHook",
  params: {
    hookName: "coreConcepts.customEvent",
    data: { eventType: "treasure-found", value: 100 }
  }
}
```

---

### 6. conditionalNotify - User-Specific Notifications

Show notification only to specific users.

**Parameters:**
- `message` (string, required) - The notification message
- `userIds` (array, required) - Array of user IDs who should see the notification
- `level` (string, optional) - Notification level (default: "info")

**Example:**
```javascript
{
  template: "conditionalNotify",
  params: {
    message: "Secret door discovered!",
    userIds: [game.user.id],
    level: "info"
  }
}
```

---

### 7. playSound - Play Audio

Play an audio file.

**Parameters:**
- `soundPath` (string, required) - Path to the audio file
- `volume` (number, optional) - Volume level 0-1 (default: 0.8)

**Example:**
```javascript
{
  template: "playSound",
  params: {
    soundPath: "sounds/combat-start.mp3",
    volume: 0.6
  }
}
```

---

## Safe Conditions

### Condition Format

Conditions are objects with an operator and operands (no code execution).

```javascript
{
  operator: "operatorName",
  left: "path.to.value",    // or literal value
  right: "comparison.value"  // or literal value
}
```

### Available Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `equals` | Strict equality (===) | `{ operator: "equals", left: "args[0].name", right: "Dragon" }` |
| `notEquals` | Strict inequality (!==) | `{ operator: "notEquals", left: "args[0].type", right: "npc" }` |
| `greaterThan` | Greater than (>) | `{ operator: "greaterThan", left: "args[0].system.hp.value", right: 50 }` |
| `lessThan` | Less than (<) | `{ operator: "lessThan", left: "args[0].system.hp.value", right: 10 }` |
| `greaterOrEqual` | Greater or equal (>=) | `{ operator: "greaterOrEqual", left: "args[0].level", right: 5 }` |
| `lessOrEqual` | Less or equal (<=) | `{ operator: "lessOrEqual", left: "args[0].level", right: 3 }` |
| `contains` | String contains | `{ operator: "contains", left: "args[0].name", right: "Dragon" }` |
| `startsWith` | String starts with | `{ operator: "startsWith", left: "args[0].name", right: "Ancient" }` |
| `endsWith` | String ends with | `{ operator: "endsWith", left: "args[0].name", right: "Wyrm" }` |
| `matches` | Regex match | `{ operator: "matches", left: "args[0].name", right: "^Dragon" }` |

### Boolean Conditions

For simple true/false conditions:

```javascript
// Always execute
condition: true

// Never execute
condition: false
```

---

## Allowed Trigger Hooks

For security, only the following hooks are allowed:

**Document Hooks:**
- `updateActor`, `createActor`, `deleteActor`
- `updateToken`, `createToken`, `deleteToken`
- `updateItem`, `createItem`, `deleteItem`
- `updateScene`, `createScene`, `deleteScene`
- `updateCombat`, `createCombat`, `deleteCombat`
- `updateJournalEntry`, `createJournalEntry`, `deleteJournalEntry`

**Chat Hooks:**
- `preCreateChatMessage`, `createChatMessage`

**Game State Hooks:**
- `updateWorldTime`
- `combatRound`, `combatTurn`
- `canvasReady`, `ready`

---

## Complete Examples

### Example 1: Low HP Warning

```javascript
await game.coreConcepts.rules.createRule(
  "Low HP Warning",
  "updateActor",
  {
    operator: "lessThan",
    left: "args[0].system.attributes.hp.value",
    right: 10
  },
  {
    template: "notify",
    params: {
      message: "Warning: Actor HP is critically low!",
      level: "warn"
    }
  },
  {
    description: "Warns when an actor's HP drops below 10",
    category: "combat",
    tags: ["hp", "warning"]
  }
);
```

### Example 2: Combat Start Notification

```javascript
await game.coreConcepts.rules.createRule(
  "Combat Start",
  "createCombat",
  true,  // Always execute
  {
    template: "playSound",
    params: {
      soundPath: "sounds/combat-horn.mp3",
      volume: 0.7
    }
  },
  {
    description: "Plays sound when combat starts",
    category: "combat"
  }
);
```

### Example 3: Level Up Celebration

```javascript
await game.coreConcepts.rules.createRule(
  "Level Up Celebration",
  "updateActor",
  {
    operator: "greaterThan",
    left: "args[0].system.details.level",
    right: "args[1].system.details.level"  // Compare with old value
  },
  {
    template: "createChatMessage",
    params: {
      content: `<h2>🎉 Level Up!</h2><p><strong>${"args[0].name"}</strong> has reached level ${"args[0].system.details.level"}!</p>`
    }
  }
);
```

### Example 4: Automatic Healing

```javascript
await game.coreConcepts.rules.createRule(
  "Auto-Heal on Rest",
  "updateWorldTime",
  {
    operator: "greaterThan",
    left: "args[0]",  // Current time
    right: 28800000   // 8 hours in milliseconds
  },
  {
    template: "modifyAttribute",
    params: {
      actorId: game.user.character?.id,
      attributePath: "system.attributes.hp.value",
      operation: "add",
      value: 10
    }
  }
);
```

---

## Managing Rules

### List All Rules

```javascript
const allRules = game.coreConcepts.rules.getAllRules();
console.log(allRules);
```

### Get Rule by ID

```javascript
const rule = game.coreConcepts.rules.getRule(ruleId);
```

### Enable/Disable Rule

```javascript
await game.coreConcepts.rules.enableRule(ruleId);
await game.coreConcepts.rules.disableRule(ruleId);
```

### Delete Rule

```javascript
await game.coreConcepts.rules.deleteRule(ruleId);  // GM only
```

### Get Rules by Category

```javascript
const combatRules = game.coreConcepts.rules.getRulesByCategory("combat");
```

### Get Rules by Tag

```javascript
const hpRules = game.coreConcepts.rules.getByTag("hp");
```

---

## Permissions

**Rule Creation:** GM only
**Rule Editing:** GM or rule author
**Rule Deletion:** GM only

---

## Troubleshooting

### "Template not found" Error

Make sure you're using one of the available templates:
- notify
- modifyAttribute
- createChatMessage
- rollDice
- triggerHook
- conditionalNotify
- playSound

### "Invalid trigger hook" Error

Use only allowed hooks from the list above.

### "Rule condition failed" Error

Check your condition object format. Ensure:
- Operator is valid
- Paths resolve correctly
- Values are the correct type

### Legacy String Rules Not Working

String-based rules from v0.2.0 and earlier are no longer supported for security reasons. See CHANGELOG.md for migration guide.

---

## Future Enhancements

Coming in future versions:
- Visual rule builder (ApplicationV2 UI)
- Active Effects integration
- More templates (apply damage, create tokens, etc.)
- Rule testing/preview feature
- Automatic migration utility

---

## Support

- **Documentation:** See [README.md](README.md)
- **Issues:** https://github.com/Crit-Fumble/foundry-core-concepts/issues
- **Security:** See [SECURITY_AUDIT_2025-01-26.md](SECURITY_AUDIT_2025-01-26.md)

---

*Last Updated: v0.3.0 (January 26, 2025)*
