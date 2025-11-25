# Template Integration with Official dnd5e System

## Overview

The `foundry-cfg-5e` module integrates with the official dnd5e system's templates to link UI elements with Core Concepts (rules, activities, subsystems).

## Strategy

### Template Mapping

Each subsystem can define mappings to official dnd5e templates, specifying:
- Which template file to enhance
- What rules/activities are relevant
- What configuration dialogs exist
- What step in the workflow this represents

### Example: Character Creation

The Character Creation subsystem maps to multiple official templates:

```javascript
templates: {
  mappings: [
    {
      template: 'character-ability-scores.hbs',
      step: 3,
      subsystem: 'character-creation',
      relatedRules: ['ability-score', 'ability-check', 'd20-test'],
      activities: ['roll-abilities', 'assign-abilities'],
      config: 'config/ability-config.hbs'
    },
    {
      template: 'character-header.hbs',
      step: [1, 2],
      subsystem: 'character-creation',
      relatedRules: ['class', 'species', 'level'],
      activities: ['choose-class', 'choose-species', 'set-level']
    }
    // ... more mappings
  ]
}
```

## Official dnd5e Templates

### Character Sheet Templates

**Location**: `systems/dnd5e/templates/actors/`

#### Core UI Components

1. **`character-header.hbs`**
   - Displays: Class, level, species
   - Related subsystems: character-creation
   - Related activities: choose-class, choose-species, set-level
   - Related rules: class, species, level

2. **`character-ability-scores.hbs`**
   - Displays: Six ability scores with modifiers
   - Related subsystems: character-creation, action-economy
   - Related activities: roll-abilities, assign-abilities, ability-check
   - Related rules: ability-score, ability-check, d20-test
   - Config template: `config/ability-config.hbs`

3. **`character-sidebar.hbs`**
   - Displays: AC, HP, initiative, speed
   - Related subsystems: combat, movement
   - Related rules: armor-class, hit-points, initiative, speed
   - Config templates: Various in `config/` folder

#### Configuration Dialogs

**Location**: `systems/dnd5e/templates/actors/config/`

- **`ability-config.hbs`** - Configure ability scores
- **`armor-class-config.hbs`** - Configure AC
- **`hit-points-config.hbs`** - Configure HP
- **`initiative-config.hbs`** - Configure initiative
- **`skills-config.hbs`** - Configure skill proficiencies
- **`languages-config.hbs`** - Choose languages
- **`spell-slots-config.hbs`** - Configure spell slots

Each config dialog relates to specific rules and can show related activities.

#### Tab Components

**Location**: `systems/dnd5e/templates/actors/tabs/`

- **`character-details.hbs`** - Background, alignment, appearance
- **`character-inventory.hbs`** - Equipment and items
- **`character-features.hbs`** - Class features and feats
- **`character-biography.hbs`** - Character history and notes
- **`character-bastion.hbs`** - PHB 2024 bastion rules

## Integration Approach

### Phase 1: Data Layer (Current)

✅ **Completed**:
- Subsystems define which templates they relate to
- Templates mapped to rules and activities
- Configuration dialogs identified

### Phase 2: Hook Integration (Next)

Inject Core Concepts data into templates via Foundry hooks:

```javascript
// Hook into sheet rendering
Hooks.on('renderActorSheet5eCharacter2', (app, html, data) => {
  const subsystem = game.coreConcepts.subsystems.find(s => s.id === 'character-creation');

  // Find ability score section
  const abilitySection = html.find('.ability-scores');

  // Add rule references
  subsystem.templates.mappings
    .filter(m => m.template === 'character-ability-scores.hbs')
    .forEach(mapping => {
      // Add tooltips with rule descriptions
      mapping.relatedRules.forEach(ruleId => {
        const rule = game.coreConcepts.rules.getById(ruleId);
        // Inject rule info into template
      });
    });
});
```

### Phase 3: Enhanced UI (Future)

Add visual indicators and tooltips:

```html
<!-- Example enhanced template -->
<div class="ability-score" data-ability="str" data-rules="ability-score,ability-check,d20-test">
  <a class="label" data-action="roll" data-type="ability">
    STR
    <!-- Injected by our module -->
    <i class="fa fa-info-circle rule-reference"
       data-tooltip="Related rules: Ability Score, Ability Check, D20 Test"></i>
  </a>
  <div class="mod">...</div>
  <div class="score">...</div>
</div>
```

## Template → Rule Mapping Examples

### Ability Scores

**Template**: `character-ability-scores.hbs`

**Related Rules**:
- `ability-score` (SRD 5.2 glossary entry)
- `ability-check` (D20 Test using ability)
- `d20-test` (Core mechanic)

**Related Activities**:
- `roll-abilities` (Character creation)
- `ability-check` (Action economy)

**User Benefit**: Clicking info icon shows rule descriptions and when to use each ability.

### Skills

**Template**: `config/skills-config.hbs`

**Related Rules**:
- `skill` (Each skill definition)
- `proficiency` (Proficiency bonus)
- `ability-check` (How skills are rolled)

**Related Activities**:
- `choose-skills` (Character creation)
- `search`, `study` (Action economy)

**User Benefit**: Skill selection shows which activities use each skill.

### Spell Slots

**Template**: `config/spell-slots-config.hbs`

**Related Subsystem**: `magic-system`

**Related Rules**:
- `spell-slot` (Slot system)
- `spell-level` (Spell levels 0-9)
- `long-rest` (Slot recovery)

**Related Activities**:
- `magic` (Cast a spell)
- `rest-long` (Recover slots)

**User Benefit**: Spell slot UI links to magic system documentation.

## Benefits

### For Players

✅ **Contextual Help**: UI elements link directly to relevant rules
✅ **Guided Creation**: Character creation shows step-by-step activities
✅ **Rule Discovery**: Hover over UI to see which rules apply

### For GMs

✅ **Rule Reference**: Quick access to SRD rules from character sheets
✅ **Activity Tracking**: See what activities are available in each mode
✅ **System Consistency**: Official templates enhanced, not replaced

### For Developers

✅ **Non-Invasive**: Hooks-based approach doesn't modify official module
✅ **Maintainable**: Works across official module updates
✅ **Extensible**: Easy to add new template mappings

## Implementation Roadmap

### ✅ Phase 1: Data Layer (Complete)

- [x] Subsystems define template mappings
- [x] Rules extracted from SRD (156 rules)
- [x] Activities defined per subsystem
- [x] Template paths documented

### ⏳ Phase 2: Hook Integration (Next)

- [ ] Create template enhancement system
- [ ] Hook into `renderActorSheet` events
- [ ] Inject rule references into templates
- [ ] Add data attributes for rules/activities

### ⏳ Phase 3: UI Enhancements (Future)

- [ ] Add visual rule reference icons
- [ ] Create hover tooltips with rule descriptions
- [ ] Link to full rule documentation
- [ ] Activity suggestions based on context

### ⏳ Phase 4: Interactive Features (Future)

- [ ] Guided character creation wizard
- [ ] Rule validation and suggestions
- [ ] Activity automation where appropriate
- [ ] Integration with platform API

## Template Compatibility

**Target System**: `dnd5e` v5.2.0+

**Sheet Classes**:
- `dnd5e.ActorSheet5eCharacter2` (PHB 2024 sheet)
- `dnd5e.ActorSheet5eCharacter` (Legacy sheet)

**Approach**: Detect which sheet is being used and adapt accordingly.

---

**Clean integration with official templates!** 🎲✨
