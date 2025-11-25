# Hazards - D&D 5e Core Concepts

## Overview

Hazards represent environmental dangers, traps, poisons, and other threats that characters may encounter during their adventures. This directory contains comprehensive JSON definitions for all hazards documented in the D&D 5e System Reference Document (SRD 5.2).

## Purpose

These hazard definitions serve multiple purposes:

1. **Rules Reference**: Provide accurate, easily-accessible mechanical data for all SRD hazards
2. **FoundryVTT Integration**: Enable automated hazard effects in virtual tabletop environments
3. **Game Design**: Support creation of adventures and encounters with properly-balanced hazards
4. **Cross-Referencing**: Link hazards to related core concepts (conditions, damage types, abilities, skills)
5. **Educational**: Help DMs and players understand hazard mechanics and interactions

## Hazard Types

### Environmental Hazards

Natural or environmental conditions that pose danger to creatures:

- **burning.json** - Fire damage from being ignited (1d4 fire damage per turn)
- **dehydration.json** - Exhaustion from inadequate water consumption
- **falling.json** - Bludgeoning damage from falling (1d6 per 10 feet, max 20d6)
- **malnutrition.json** - Exhaustion from inadequate food consumption
- **suffocation.json** - Exhaustion from inability to breathe
- **extreme-cold.json** - Exhaustion from temperatures 0°F or below
- **extreme-heat.json** - Exhaustion from temperatures 100°F or above without water

### Poison Hazards

Toxic substances delivered through various methods:

- **poison-basic.json** - General overview of poison mechanics and types
- **poison-contact.json** - Poisons activated by touch (e.g., Crawler Mucus, Oil of Taggit)
- **poison-ingested.json** - Poisons consumed in food/drink (e.g., Assassin's Blood, Midnight Tears)
- **poison-inhaled.json** - Gaseous/powder poisons (e.g., Burnt Othur Fumes, Essence of Ether)
- **poison-injury.json** - Poisons delivered via weapons (e.g., Purple Worm Poison, Wyvern Poison)

### Trap Hazards

Deliberately-placed hazards to protect areas or harm intruders:

- **traps-mechanical.json** - Physical traps using mechanical components (pits, nets, darts, etc.)
- **traps-magical.json** - Traps using magical energy and spell effects (glyphs, elemental discharge)

## JSON Structure

Each hazard file follows a standardized structure:

```json
{
  "id": "unique-identifier",
  "name": "Display Name",
  "description": "Brief summary of the hazard",
  "type": "environmental | trap | poison",
  "category": "specific-subcategory",
  "trigger": "What activates this hazard",
  "damage": {
    "amount": "dice formula or description",
    "type": "damage type",
    "frequency": "how often damage occurs",
    "timing": "when damage occurs"
  },
  "savingThrow": {
    "ability": "ability used for save",
    "dc": "difficulty class",
    "onSuccess": "effect on successful save",
    "onFailure": "effect on failed save"
  },
  "duration": "how long hazard lasts",
  "effects": {
    "immediate": ["instant effects"],
    "ongoing": ["continuing effects"],
    "conditions": ["conditions applied"]
  },
  "detection": {
    "difficulty": "how hard to detect",
    "method": "how to detect it"
  },
  "mitigation": ["ways to avoid or reduce hazard"],
  "srdReference": {
    "file": "source file path",
    "section": "section name",
    "lines": "line numbers",
    "quote": "exact SRD text"
  },
  "examples": ["specific usage scenarios"],
  "relatedConcepts": {
    "damageTypes": [],
    "conditions": [],
    "abilities": [],
    "skills": [],
    "actions": []
  }
}
```

## Core Concept Integration

Hazards interact with and reference other core game concepts:

### Conditions

Many hazards inflict conditions:
- **Exhaustion**: dehydration, malnutrition, suffocation, extreme cold, extreme heat
- **Prone**: falling, slippery ice
- **Poisoned**: all poison types
- **Paralyzed**: some contact poisons (Crawler Mucus)
- **Unconscious**: some poisons (Essence of Ether, Oil of Taggit)
- **Blinded**: some poisons (Malice)
- **Restrained**: some traps (Falling Net)

### Damage Types

Hazards can deal various damage types:
- **Fire**: burning, fire-casting statue trap, extreme heat environments
- **Cold**: extreme cold environments (via exhaustion)
- **Bludgeoning**: falling, collapsing roof, rolling stone, pit falls
- **Piercing**: spiked pit, poisoned darts
- **Poison**: all poison hazards

### Abilities & Saving Throws

Hazards primarily use:
- **Constitution**: Most common for resisting poisons, environmental effects, survival hazards
- **Dexterity**: Avoiding trap damage, falling into water gracefully, pressure plates
- **Strength**: Climbing out of pits, slowing rolling stones, escaping nets
- **Wisdom**: Detecting traps (Perception)
- **Intelligence**: Analyzing trap mechanisms (Investigation, Arcana)

### Skills

Key skills for hazard interaction:
- **Perception**: Detecting traps, noticing hazards
- **Investigation**: Analyzing trap mechanisms, identifying poisons
- **Arcana**: Understanding magical traps and glyphs
- **Athletics**: Climbing out of pits, swimming, physical saves
- **Acrobatics**: Avoiding falls, landing safely
- **Nature**: Identifying natural poisons, foraging for food/water
- **Survival**: Finding food and water, tracking, navigating dangerous environments
- **Sleight of Hand**: Disarming traps

### Actions

Hazards interact with the action economy:
- **Action**: Extinguishing fire on self, searching for traps, disarming traps
- **Bonus Action**: Applying injury poison to weapons
- **Reaction**: Landing safely when falling into water
- **Search Action**: Detecting traps (special action type)
- **Study Action**: Analyzing trap mechanisms (special action type)

### Tools

Certain tools aid in hazard interaction:
- **Thieves' Tools**: Disarming mechanical traps
- **Poisoner's Kit**: Safely handling poisons, identifying poisons, harvesting venom
- **Herbalism Kit**: Creating remedies for some poisons
- **Climber's Kit**: Escaping from pits

## Usage in FoundryVTT

These JSON files can be integrated into FoundryVTT in several ways:

### Active Effects

Hazards that apply ongoing conditions can be implemented as Active Effects:
- Burning: Apply 1d4 fire damage at start of each turn
- Poisoned condition: Apply status icon and mechanical effects
- Exhaustion levels: Track and apply cumulative penalties

### Macros

Common hazard checks can be automated:
```javascript
// Example: Extreme Heat Save
const hour = 1; // Track hours exposed
const dc = 4 + hour; // DC 5 first hour, increases by 1 each hour
const hasArmor = actor.items.some(i =>
  i.type === "equipment" &&
  (i.system.armor.type === "medium" || i.system.armor.type === "heavy")
);
const rollMode = hasArmor ? "2d20kl" : "1d20"; // Disadvantage for armor

// Execute save
actor.rollAbilitySave("con", {
  targetValue: dc,
  flavor: `Extreme Heat - Hour ${hour}`,
  disadvantage: hasArmor
});
```

### Traps as Actors

Traps can be implemented as special actors:
- Place trap tokens on map (hidden from players)
- Configure trigger conditions
- Automate damage and save rolls
- Track trap state (triggered, reset, destroyed)

### Environmental Effects

Use FoundryVTT's tile/region effects for environmental hazards:
- Burning areas that apply fire damage
- Extreme temperature zones
- Poison gas regions
- Falling zones at cliff edges

### Journals

Link hazard JSON files to Journal Entries for quick DM reference during play.

## SRD References

All hazards are sourced from official D&D 5e SRD 5.2 documents:

### Rules Glossary (08_RulesGlossary.md)
- Burning [Hazard] (lines 194-196)
- Dehydration [Hazard] (lines 396-407)
- Falling [Hazard] (lines 483-487)
- Malnutrition [Hazard] (lines 724-740)
- Suffocation [Hazard] (lines 1020-1022)
- Hazard definition (line 531)

### Gameplay Toolbox (09_GameplayToolbox.md)
- Environmental Effects (lines 183-230)
  - Deep Water
  - Extreme Cold (lines 189-192)
  - Extreme Heat (lines 193-196)
  - Frigid Water (lines 202-206)
  - Heavy Precipitation
  - High Altitude
  - Slippery Ice (lines 220-222)
  - Strong Wind
  - Thin Ice (lines 228-230)
- Poison (lines 275-382)
  - Poison types (Contact, Ingested, Inhaled, Injury)
  - Sample poisons with mechanics
  - Purchasing and harvesting rules
- Traps (lines 383-576)
  - Trap design principles
  - Trap components (severity, trigger, duration, detection)
  - Sample mechanical traps
  - Sample magical traps

## Design Principles

### Accuracy
- All mechanical details are exact quotes or direct interpretations from SRD
- SRD references include file, section, and line numbers for verification
- No homebrew or modified rules unless explicitly noted

### Completeness
- Each hazard includes all mechanical details needed for gameplay
- Examples demonstrate common usage scenarios
- Mitigation strategies help players make informed decisions
- Related concepts enable cross-referencing with other game systems

### Organization
- Consistent JSON structure across all files
- Clear categorization (environmental, poison, trap)
- Subcategories for refined searches (survival, temperature, injury, etc.)
- Progressive complexity from simple (burning) to complex (traps)

### Accessibility
- Human-readable JSON with clear field names
- Extensive comments and descriptions
- Examples ground abstract rules in concrete scenarios
- Related concepts facilitate learning connections

## Hazard Severity & Scaling

### Environmental Hazards
Most environmental hazards use:
- Fixed DCs (typically DC 10)
- Exhaustion as primary threat (accumulating levels)
- Time-based progression (hourly checks)

### Poisons
Poisons scale by:
- DC range: 10-21 (from Assassin's Blood to Purple Worm Poison)
- Damage range: None to 35 (10d6)
- Cost range: 150 GP to 2,000 GP
- Duration range: Minutes to days
- Effect complexity: Simple damage to multi-day recurring effects

### Traps
Traps explicitly scale by character level:
- **Levels 1-4**: Entry-level damage and DCs
- **Levels 5-10**: Increased damage (~2x), higher DCs (+2)
- **Levels 11-16**: Major damage (~5x), higher DCs (+4)
- **Levels 17-20**: Extreme damage (~9x), highest DCs (+6)

Severity categories:
- **Nuisance**: Unlikely to seriously harm characters of indicated level
- **Deadly**: Can grievously damage characters of indicated level

## Common Patterns

### Exhaustion Hazards
Multiple hazards cause exhaustion (special condition with 6 cumulative levels):
1. **Dehydration**: 1 level per day without adequate water
2. **Malnutrition**: 1 level per day (if eating <50%) or day 5+ (if eating nothing)
3. **Suffocation**: 1 level per turn when out of breath
4. **Extreme Cold**: 1 level per hour (DC 10 CON save)
5. **Extreme Heat**: 1 level per hour (DC 5+hour CON save)

Special rule: Dehydration and malnutrition exhaustion can't be removed until full food/water requirement met.

### Poison Patterns
All poisons require Constitution saves but differ in:
- **Contact**: Touch-activated, often incapacitating (paralysis, unconsciousness)
- **Ingested**: Delayed or recurring, often subtle (poison duration, truth serum)
- **Inhaled**: Area effect (5-foot Cube), affects external membranes, can't hold breath
- **Injury**: Applied to weapons (Bonus Action), delivered via Piercing/Slashing damage

### Trap Patterns
Most traps include:
- **Trigger**: Pressure plate or trip wire most common
- **Detect**: Search action (Perception) to find trigger
- **Disarm**: Action with tools or simple intervention
- **Scaling**: Provided for all character level ranges
- **Reset**: Some traps reset, others are single-use

## Integration Checklist

When implementing hazards in FoundryVTT or other VTT:

### Data Structure
- [ ] Import hazard JSON files into compendium
- [ ] Link to condition definitions
- [ ] Link to damage type definitions
- [ ] Link to ability score/save mechanics
- [ ] Link to skill check mechanics

### Automation
- [ ] Auto-apply damage on trigger
- [ ] Auto-roll saving throws with proper modifiers
- [ ] Track ongoing effects (burning, exhaustion)
- [ ] Handle condition interactions
- [ ] Reset traps after duration expires

### User Interface
- [ ] Display hazard descriptions to DM
- [ ] Show player-visible information (when detected)
- [ ] Track exhaustion levels on character sheet
- [ ] Indicate active hazards on tokens/map
- [ ] Provide buttons for common actions (extinguish fire, make save)

### Documentation
- [ ] Include SRD references in item descriptions
- [ ] Create quick-reference cards for common hazards
- [ ] Link to related conditions, damage types, skills
- [ ] Provide examples and scenarios

## Future Enhancements

Potential additions to this hazard system:

### Additional Environmental Hazards
- Heavy precipitation effects
- Strong wind mechanics
- High altitude travel
- Deep water swimming
- Slippery ice details
- Thin ice weight calculations

### Expanded Trap Examples
- More mechanical trap variations
- Combination traps
- Trap design guidelines
- Custom trap creation templates

### Poison Variations
- Disease mechanics (separate from poison)
- Antidote systems
- Custom poison creation
- Poison crafting rules

### Interactive Tools
- Hazard encounter builder
- Damage calculator with level scaling
- Exhaustion tracker
- Trap difficulty estimator

## Contributing

When adding new hazards or updating existing ones:

1. **Source Accuracy**: Always cite exact SRD text with line numbers
2. **Consistency**: Follow the established JSON structure
3. **Completeness**: Include all fields, even if null/empty
4. **Examples**: Provide at least 3-5 concrete usage examples
5. **Cross-Reference**: Link to all related core concepts
6. **Testing**: Verify JSON syntax and structure validity

## Related Documentation

- **Conditions**: `../conditions/README.md` - All condition definitions referenced by hazards
- **Damage Types**: Core damage type definitions (fire, cold, poison, etc.)
- **Activities**: `../activities/README.md` - Actions and their interactions with hazards
- **Core Concepts**: `../CORE-CONCEPTS.md` - Overview of all interconnected game systems

## License

All content is derived from the D&D 5e System Reference Document (SRD 5.2), which is released under the Creative Commons Attribution 4.0 International License.

Original SRD: © Wizards of the Coast LLC

## Version History

- **v1.0** (2024): Initial comprehensive hazard definitions
  - 14 hazard files covering all SRD hazards
  - Complete environmental, poison, and trap categories
  - Full SRD references with line numbers
  - Integration with core concepts (conditions, damage types, skills)
  - FoundryVTT implementation guidelines
