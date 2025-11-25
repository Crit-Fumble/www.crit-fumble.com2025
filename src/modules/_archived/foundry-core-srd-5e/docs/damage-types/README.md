# D&D 5e Damage Types

This directory contains comprehensive JSON definitions for all 13 damage types in D&D 5e, extracted from the System Reference Document (SRD).

## Purpose

Damage types are fundamental to D&D 5e combat and interaction mechanics. While damage types themselves have no inherent rules, they are critical for:

- **Resistance**: Halving incoming damage of specific types
- **Immunity**: Negating damage of specific types entirely
- **Vulnerability**: Doubling incoming damage of specific types
- **Object Interaction**: Determining how damage affects objects and structures
- **Thematic Design**: Creating flavorful and mechanically distinct abilities

This collection provides structured, searchable data for integrating damage types into FoundryVTT, game tools, or reference applications.

## Damage Type Categories

### Physical Damage (3 types)
Physical damage comes from direct physical force and is the most common type from weapons and natural attacks.

1. **Bludgeoning** - Blunt force trauma (clubs, hammers, falling)
2. **Piercing** - Puncturing attacks (arrows, fangs, spears)
3. **Slashing** - Cutting attacks (swords, claws, axes)

**Common Traits**:
- All can affect objects
- Can critically hit
- Many creatures have resistance to "nonmagical bludgeoning, piercing, and slashing" damage
- Most common damage types from weapons

### Elemental Damage (5 types)
Elemental damage represents natural and magical forces associated with the elements.

4. **Acid** - Corrosive substances (dragon breath, oozes, acid vials)
5. **Cold** - Freezing temperatures (frost magic, white dragons, ice)
6. **Fire** - Flames and heat (fireball, red dragons, burning)
7. **Lightning** - Electrical energy (lightning bolt, blue dragons, storms)
8. **Thunder** - Concussive sound (thunderwave, sonic booms, shockwaves)

**Common Traits**:
- Can affect objects
- Can critically hit
- Often resisted by creatures aligned with that element
- Frequently found in evocation magic

### Supernatural Damage (5 types)
Supernatural damage represents magical, divine, or otherworldly forces beyond the physical or elemental.

9. **Force** - Pure magical energy (magic missile, wall of force)
10. **Necrotic** - Life-draining energy (inflict wounds, undead attacks)
11. **Poison** - Toxic substances (poison spray, venom, toxic gas)
12. **Psychic** - Mind-affecting energy (vicious mockery, mind flayer attacks)
13. **Radiant** - Holy/celestial energy (sacred flame, divine smite)

**Common Traits**:
- **Force**: Extremely rare resistance/immunity, most reliable damage type
- **Necrotic/Poison/Psychic**: Do not affect objects, target living creatures
- **Radiant**: Associated with divine magic and celestials
- **Necrotic**: Most undead are immune
- **Poison/Psychic**: Many creatures (constructs, undead) are immune

## Resistance, Immunity, and Vulnerability Mechanics

### Resistance
If you have **Resistance** to a damage type, damage of that type is **halved (rounded down)** against you.

**Rules**:
- Applied only once per instance of damage
- Multiple resistances to the same type don't stack
- Applied after modifiers but before vulnerability

**Example**: Taking 25 fire damage with fire resistance = 12 damage (25 ÷ 2 = 12.5, rounded down)

### Immunity
If you have **Immunity** to a damage type, you **take no damage** from that type.

**Rules**:
- Completely negates the damage
- No saving throw or roll needed
- Common among creatures aligned with specific damage types

**Example**: A fire elemental is immune to fire damage and takes 0 damage from a Fireball spell

### Vulnerability
If you have **Vulnerability** to a damage type, damage of that type is **doubled** against you.

**Rules**:
- Applied only once per instance of damage
- Multiple vulnerabilities don't stack
- Applied after resistance calculations
- Relatively rare in 5e

**Example**: Taking 10 fire damage with fire vulnerability = 20 damage

### Order of Application
When calculating damage with multiple modifiers:

1. **Adjustments First**: Apply bonuses, penalties, or multipliers
2. **Resistance Second**: Halve damage if resistant (round down)
3. **Vulnerability Third**: Double damage if vulnerable

**Complex Example**:
- Creature has Resistance to all damage AND Vulnerability to Fire
- Within an aura that reduces all damage by 5
- Takes 28 Fire damage

Calculation:
1. Apply reduction: 28 - 5 = 23
2. Apply resistance: 23 ÷ 2 = 11.5 → 11 (rounded down)
3. Apply vulnerability: 11 × 2 = 22 final damage

### No Stacking
Multiple instances of Resistance or Vulnerability to the same damage type **count as only one instance**.

**Example**: If you have Resistance to Necrotic damage AND Resistance to all damage, Necrotic damage is still only halved once, not quartered.

## JSON Structure

Each damage type file follows this structure:

```json
{
  "id": "damage-{type}",
  "name": "{Type}",
  "description": "Description of this damage type and its sources",
  "category": "physical|elemental|supernatural",
  "characteristics": {
    "sourceExamples": [
      "Common sources of this damage type"
    ],
    "resistanceCommon": [
      "Creatures commonly resistant to this type"
    ],
    "immunityCommon": [
      "Creatures commonly immune to this type"
    ],
    "vulnerabilityCommon": [
      "Creatures commonly vulnerable to this type"
    ]
  },
  "mechanics": {
    "affectsObjects": true|false,
    "canCritical": true|false,
    "specialRules": [
      "Unique mechanics or special considerations"
    ]
  },
  "srdReference": "path/to/srd/definition",
  "examples": [
    "Specific spells, weapons, or abilities dealing this damage"
  ]
}
```

### Field Descriptions

- **id**: Unique identifier for the damage type
- **name**: Display name of the damage type
- **description**: Comprehensive description of what this damage represents
- **category**: One of: `physical`, `elemental`, or `supernatural`
- **characteristics**: Common creatures with resistance/immunity/vulnerability
- **mechanics.affectsObjects**: Whether this damage type can harm objects
- **mechanics.canCritical**: Whether this damage type can be doubled on critical hits
- **mechanics.specialRules**: Array of special mechanical considerations
- **srdReference**: Path to the source SRD file
- **examples**: Array of specific game elements that deal this damage

## Available Damage Types

### Physical
1. [bludgeoning.json](./bludgeoning.json) - Blunt force trauma
2. [piercing.json](./piercing.json) - Puncturing attacks
3. [slashing.json](./slashing.json) - Cutting attacks

### Elemental
4. [acid.json](./acid.json) - Corrosive substances
5. [cold.json](./cold.json) - Freezing temperatures
6. [fire.json](./fire.json) - Flames and heat
7. [lightning.json](./lightning.json) - Electrical energy
8. [thunder.json](./thunder.json) - Concussive sound

### Supernatural
9. [force.json](./force.json) - Pure magical energy
10. [necrotic.json](./necrotic.json) - Life-draining energy
11. [poison.json](./poison.json) - Toxic substances
12. [psychic.json](./psychic.json) - Mind-affecting energy
13. [radiant.json](./radiant.json) - Holy/celestial energy

## Integration with Other Systems

### Weapons
Physical damage types (bludgeoning, piercing, slashing) are primarily associated with weapons:
- **Bludgeoning**: Clubs, maces, hammers, staves
- **Piercing**: Daggers, arrows, spears, rapiers
- **Slashing**: Swords, axes, scimitars, glaives

Many creatures have "Resistance to bludgeoning, piercing, and slashing damage from nonmagical attacks," making magical weapons essential at higher levels.

### Spells
Most damage-dealing spells use elemental or supernatural damage types:
- **Acid**: Acid Arrow, Acid Splash
- **Cold**: Cone of Cold, Ice Storm
- **Fire**: Fireball, Fire Bolt (most common elemental damage in spells)
- **Lightning**: Lightning Bolt, Chain Lightning
- **Thunder**: Thunderwave, Shatter
- **Force**: Magic Missile, Eldritch Blast
- **Necrotic**: Inflict Wounds, Blight
- **Poison**: Poison Spray, Cloudkill
- **Psychic**: Vicious Mockery, Psychic Scream
- **Radiant**: Sacred Flame, Guiding Bolt

### Hazards and Environments
Environmental hazards often deal specific damage types:
- **Fire**: Lava, burning buildings
- **Cold**: Extreme cold, icy water
- **Acid**: Acid pits, corrosive pools
- **Thunder**: Avalanches, sonic traps
- **Bludgeoning**: Falling, crushing traps

See the `hazards/` directory for more details on environmental damage.

### Creature Abilities
Many creatures have natural weapons or abilities that deal specific damage types:
- **Dragons**: Breath weapons deal damage matching their type (fire, cold, acid, lightning, poison)
- **Undead**: Often deal necrotic damage
- **Elementals**: Deal damage matching their element
- **Aberrations**: Frequently deal psychic damage
- **Celestials/Fiends**: Often deal radiant or necrotic damage

## Usage in FoundryVTT

These JSON files are designed for integration with FoundryVTT's DND5E system:

### Damage Rolls
```javascript
// Example: Rolling 2d6 fire damage
const roll = new Roll("2d6[fire]");
await roll.evaluate();
```

### Applying Resistance
```javascript
// Check if actor has fire resistance
const hasResistance = actor.system.traits.dr.value.includes("fire");
if (hasResistance) {
  damage = Math.floor(damage / 2);
}
```

### Checking Immunity
```javascript
// Check if actor is immune to poison
const isImmune = actor.system.traits.di.value.includes("poison");
if (isImmune) {
  damage = 0;
}
```

### Applying Vulnerability
```javascript
// Check if actor is vulnerable to cold
const isVulnerable = actor.system.traits.dv.value.includes("cold");
if (isVulnerable) {
  damage = damage * 2;
}
```

## Critical Hits and Damage Types

All damage types can be doubled on a critical hit. When you score a Critical Hit:
1. Roll the attack's damage dice **twice**
2. Add them together
3. Add relevant modifiers as normal

**Example**: Critical Hit with a Dagger (1d4 piercing)
- Roll 2d4 instead of 1d4
- Add ability modifier once

This applies to all damage types, including force damage from Magic Missile (though Magic Missile cannot normally crit as it doesn't require an attack roll).

## Objects and Damage Types

Not all damage types affect objects equally:

### Always Affects Objects
- Bludgeoning (effective for smashing)
- Piercing (can puncture)
- Slashing (can cut)
- Acid (dissolves materials)
- Cold (freezes and cracks)
- Fire (burns flammable materials)
- Lightning (can damage conductive materials)
- Thunder (shatters brittle objects)
- Force (pure energy damages anything)
- Radiant (burns with holy light)

### Does Not Affect Objects
- **Poison**: Objects are immune to poison damage
- **Psychic**: Objects are immune to psychic damage (no mind to affect)
- **Necrotic**: Generally does not affect inanimate objects

From the SRD (Breaking Objects): "Objects have Immunity to Poison and Psychic damage."

## SRD References

All damage type definitions are based on the official D&D 5e System Reference Document:

- **Primary Source**: `data/5e/srd/split/rulesglossary/rulesdefinitions/45-DamageTypes.md`
- **Damage Mechanics**: `data/5e/srd/split/playingthegame/08-DamageandHealing.md`
- **Resistance**: `data/5e/srd/split/rulesglossary/rulesdefinitions/117-Resistance.md`
- **Immunity**: `data/5e/srd/split/rulesglossary/rulesdefinitions/84-Immunity.md`
- **Vulnerability**: `data/5e/srd/split/rulesglossary/rulesdefinitions/153-Vulnerability.md`
- **Breaking Objects**: `data/5e/srd/split/rulesglossary/rulesdefinitions/18-BreakingObjects.md`

## Related Systems

This damage type system integrates with other SRD documentation:

- **Conditions** (`../conditions/`): Many conditions interact with damage (e.g., resistance while raging)
- **Hazards** (`../hazards/`): Environmental hazards deal specific damage types
- **Actions** (`../actions/`): Combat actions determine how damage is dealt
- **Spells**: Spell descriptions specify damage types
- **Weapons**: Weapon definitions include damage types
- **Creatures**: Monster stat blocks list resistance, immunity, and vulnerability

## Design Notes

### Why This Structure?
This JSON structure balances comprehensiveness with usability:
- **Searchable**: Easy to query by category, examples, or characteristics
- **Extensible**: Can add homebrew damage types or campaign-specific information
- **Reference-Ready**: Includes SRD citations for verification
- **Tool-Friendly**: Designed for integration with FoundryVTT and other digital tools

### Common Misconceptions
1. **Radiant ≠ Automatic Advantage vs Undead**: While thematic, radiant damage has no special mechanical advantage against undead in 5e core rules
2. **Force ≠ Physical Force**: Force damage is pure magical energy, not kinetic energy
3. **Thunder ≠ Lightning**: Thunder is sonic/concussive damage, lightning is electrical
4. **Poison Damage ≠ Poisoned Condition**: Taking poison damage does not automatically inflict the Poisoned condition

### Resistance Patterns
- **Physical**: "Resistance to bludgeoning, piercing, and slashing from nonmagical attacks" is common
- **Elemental**: Creatures often resist their aligned element (fire elementals resist fire)
- **Supernatural**: Force has almost no resistance; poison and psychic have widespread immunity

### Balance Considerations
- **Force**: Most reliable damage type (very rare resistance)
- **Fire**: Most common elemental damage but also common resistance
- **Poison**: Many creatures immune, making it least reliable
- **Psychic**: Constructs and undead immune, but otherwise reliable
- **Physical**: Magical weapons bypass most resistance at higher levels

## Changelog

### Version 1.0.0 (Initial Release)
- Created all 13 core damage type definitions
- Established JSON structure
- Documented resistance/immunity/vulnerability mechanics
- Added integration guides for FoundryVTT
- Included comprehensive SRD references

## Contributing

When adding or modifying damage types:
1. Ensure SRD compliance for official content
2. Mark homebrew content clearly
3. Maintain consistent JSON structure
4. Update this README with new additions
5. Include examples from spells, weapons, or creature abilities

## License

This content is derived from the D&D 5e System Reference Document (SRD 5.1), which is available under the Open Gaming License (OGL) and Creative Commons Attribution 4.0 International License (CC BY 4.0).
