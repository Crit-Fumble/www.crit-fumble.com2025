# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2025-01-26

### 🚨 CRITICAL SECURITY FIX

This release addresses a **critical security vulnerability** that could allow arbitrary code execution. **All users should upgrade immediately.**

### Security

- **CRITICAL**: Removed `eval()` and `new Function()` from Rules Engine to prevent code injection attacks
- Replaced arbitrary code execution with safe, predefined rule templates
- Added comprehensive input validation across all managers
- Added permission enforcement (GM-only) for creating rules, types, and books
- Sanitized all user inputs to prevent XSS attacks

### Added

- **New File**: `scripts/validators.mjs` - Input validation and permission guards
  - `InputValidator` class for validating rule names, triggers, templates, and entities
  - `PermissionGuard` class for enforcing user permissions
- **New File**: `scripts/rule-templates.mjs` - Safe rule template system
  - 8 predefined safe templates: notify, modifyAttribute, createChatMessage, rollDice, applyEffect (placeholder), triggerHook, conditionalNotify, playSound
  - Safe condition evaluation with operators: equals, notEquals, greaterThan, lessThan, etc.
  - Template-based effect execution with parameter validation
- Custom hooks for monitoring rule execution:
  - `coreConcepts.ruleExecuted` - Triggered when a rule executes successfully
  - `coreConcepts.ruleExecutionFailed` - Triggered when a rule execution fails

### Changed

- **BREAKING**: Rules Engine no longer accepts string-based conditions and effects
- Rules must now use template-based effects with the format: `{ template: "templateName", params: {...} }`
- Legacy string-based rules will display warnings and be blocked from execution
- Rule creation now requires GM permissions
- Type registration now requires GM permissions
- Book creation now requires GM permissions
- All user inputs are now validated and sanitized

### Deprecated

- String-based rule conditions (use condition objects instead)
- String-based rule effects (use template-based effects instead)

### Migration Guide

**For Existing Rules:**

If you have existing rules using string-based effects, they will no longer execute. You need to migrate them to the new template-based format.

**Old Format (INSECURE - NO LONGER WORKS):**
```javascript
await game.coreConcepts.rules.createRule(
  "Healing Rule",
  "updateActor",
  "args[0].system.attributes.hp.value < 0",
  "args[0].update({'system.attributes.hp.value': 1})"
);
```

**New Format (SECURE):**
```javascript
await game.coreConcepts.rules.createRule(
  "Healing Rule",
  "updateActor",
  {
    operator: "lessThan",
    left: "args[0].system.attributes.hp.value",
    right: 0
  },
  {
    template: "modifyAttribute",
    params: {
      actorId: "args[0].id",
      attributePath: "system.attributes.hp.value",
      operation: "set",
      value: 1
    }
  }
);
```

**Available Templates:** notify, modifyAttribute, createChatMessage, rollDice, triggerHook, conditionalNotify, playSound

For more details, see `scripts/rule-templates.mjs`.

---

## [0.1.0] - 2025-11-19

### Added
- **Types Registry**: Unified type definitions (classes, creature types, etc.)
  - Apply types to actors and items as templates
  - Store types in journal entries
  - Category-based organization

- **Books Manager**: Enhanced books with linked content
  - Link cards, tables, rules, actors, and items to books
  - Convert journal entries to books
  - Book management interface

- **Rules Engine**: Formal rules system with triggers and effects
  - Hook-based rule triggers
  - Conditional logic
  - Effect execution
  - Enable/disable rules dynamically

- **Modes Manager**: Game mode system
  - Six default modes: Character Creation, Combat, Exploration, Social, Travel, Downtime
  - Mode-specific UI configurations
  - Custom mode support
  - Mode switching with notifications

- **Decks Manager**: Deck and hand management
  - Integration with FoundryVTT Cards system
  - Create decks from compendiums
  - Draw cards to player hands
  - Play and discard cards

- Initial release
- Core module structure
- Module settings and configuration
- Localization support (English)

### Changed
- N/A

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- N/A
