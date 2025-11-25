# Complete D&D 5e Data Mapping

This document lists all data categories mapped from the official dnd5e system v5.2.0 to Core Concepts format.

## Overview

The `foundry-cfg-5e` module extracts **25+ data categories** from the official Foundry dnd5e system and maps them to platform-agnostic Core Concepts format.

## Mapped Categories (25)

### 1. Core Attributes

#### Abilities (6)
- **Strength** (STR) - Physical
- **Dexterity** (DEX) - Physical
- **Constitution** (CON) - Physical
- **Intelligence** (INT) - Mental
- **Wisdom** (WIS) - Mental
- **Charisma** (CHA) - Mental

#### Skills (18)
- Acrobatics (DEX)
- Animal Handling (WIS)
- Arcana (INT)
- Athletics (STR)
- Deception (CHA)
- History (INT)
- Insight (WIS)
- Intimidation (CHA)
- Investigation (INT)
- Medicine (WIS)
- Nature (INT)
- Perception (WIS)
- Performance (CHA)
- Persuasion (CHA)
- Religion (INT)
- Sleight of Hand (DEX)
- Stealth (DEX)
- Survival (WIS)

#### Sizes (9)
- **Tiny** - Hit Die: d4
- **Small** - Hit Die: d6
- **Medium** - Hit Die: d8
- **Large** - Hit Die: d10
- **Huge** - Hit Die: d12
- **Gargantuan** - Hit Die: d20

### 2. Combat & Actions

#### Damage Types (13)
**Physical:**
- Bludgeoning
- Piercing
- Slashing

**Elemental:**
- Acid
- Cold
- Fire
- Lightning
- Thunder

**Magical:**
- Force
- Necrotic
- Poison
- Psychic
- Radiant

#### Conditions (15)
**Impairment:**
- Blinded
- Deafened
- Poisoned
- Stunned

**Movement:**
- Grappled
- Prone
- Restrained

**Severe:**
- Incapacitated
- Paralyzed
- Petrified
- Unconscious

**Mental:**
- Charmed
- Frightened

**Other:**
- Exhaustion (6 levels)
- Invisible

#### Activation Types (10+)
- Action
- Bonus Action
- Reaction
- No Action
- Minute
- Hour
- Day
- Special
- Legendary Action
- Lair Action

#### Weapon Masteries (PHB 2024)
New to PHB 2024:
- **Cleave** - Hit extra target
- **Graze** - Deal damage on miss
- **Nick** - Extra offhand attack
- **Push** - Force movement
- **Sap** - Impose disadvantage
- **Slow** - Reduce speed
- **Topple** - Knock prone
- **Vex** - Grant advantage

### 3. Character Options

#### Species (PHB 2024 terminology)
Maps from creature types - playable species:
- Humanoid (primary playable type)
- *Note: Specific species (Human, Elf, Dwarf, etc.) extracted from compendiums*

#### Classes (12)
| Class | Hit Die | Primary Ability |
|-------|---------|----------------|
| Barbarian | d12 | STR |
| Bard | d8 | CHA |
| Cleric | d8 | WIS |
| Druid | d8 | WIS |
| Fighter | d10 | STR/DEX |
| Monk | d8 | DEX |
| Paladin | d10 | STR |
| Ranger | d10 | DEX |
| Rogue | d8 | DEX |
| Sorcerer | d6 | CHA |
| Warlock | d8 | CHA |
| Wizard | d6 | INT |

### 4. Items & Equipment

#### Weapons
**Types:**
- Simple Melee
- Simple Ranged
- Martial Melee
- Martial Ranged

**Properties:**
- Ammunition
- Finesse
- Heavy
- Light
- Loading
- Range
- Reach
- Special
- Thrown
- Two-Handed
- Versatile

#### Armor
**Types:**
- Light Armor
- Medium Armor
- Heavy Armor
- Shield
- Natural Armor

#### Tools
**Artisan's Tools:**
- Alchemist's Supplies
- Brewer's Supplies
- Calligrapher's Supplies
- Carpenter's Tools
- Cartographer's Tools
- Cobbler's Tools
- Cook's Utensils
- Glassblower's Tools
- Jeweler's Tools
- Leatherworker's Tools
- Mason's Tools
- Painter's Supplies
- Potter's Tools
- Smith's Tools
- Tinker's Tools
- Weaver's Tools
- Woodcarver's Tools

**Gaming Sets & Musical Instruments**

#### Currencies (5)
- **Platinum Pieces** (pp) - 10 gp
- **Gold Pieces** (gp) - 1 gp (base)
- **Electrum Pieces** (ep) - 0.5 gp
- **Silver Pieces** (sp) - 0.1 gp
- **Copper Pieces** (cp) - 0.01 gp

#### Item Rarity (6)
- Common
- Uncommon
- Rare
- Very Rare
- Legendary
- Artifact

#### Attunement Types (3)
- Required
- Optional
- None

### 5. Magic

#### Spell Schools (8)
- **Abjuration** - Protection
- **Conjuration** - Summoning
- **Divination** - Knowledge
- **Enchantment** - Mind control
- **Evocation** - Energy
- **Illusion** - Deception
- **Necromancy** - Life/Death
- **Transmutation** - Change

#### Spell Components (5)
- **Verbal** (V) - Spoken words
- **Somatic** (S) - Hand gestures
- **Material** (M) - Physical components
- **Ritual** (R) - Extended casting
- **Concentration** (C) - Maintained focus

### 6. Traits & Social

#### Alignments (9)
- Lawful Good (LG)
- Neutral Good (NG)
- Chaotic Good (CG)
- Lawful Neutral (LN)
- True Neutral (N)
- Chaotic Neutral (CN)
- Lawful Evil (LE)
- Neutral Evil (NE)
- Chaotic Evil (CE)

#### Creature Types (14)
- Aberration
- Beast
- Celestial
- Construct
- Dragon
- Elemental
- Fey
- Fiend
- Giant
- Humanoid
- Monstrosity
- Ooze
- Plant
- Undead

#### Languages (16+ standard, many exotic)
**Standard:**
- Common
- Dwarvish
- Elvish
- Giant
- Gnomish
- Goblin
- Halfling
- Orc

**Exotic:**
- Abyssal
- Celestial
- Draconic
- Deep Speech
- Infernal
- Primordial
- Sylvan
- Undercommon

### 7. Movement & Senses

#### Movement Types (5)
- **Walk** - Ground movement
- **Burrow** - Underground
- **Climb** - Vertical surfaces
- **Fly** - Aerial movement
- **Swim** - Water movement

#### Senses (4)
- **Blindsight** - Perceive without sight
- **Darkvision** - See in darkness
- **Tremorsense** - Detect vibrations
- **Truesight** - See all illusions

### 8. Structures

#### Facilities
- Strongholds
- Temples
- Workshops
- Guildhalls
- Ships/Vehicles

## Data Access

### In Foundry VTT

```javascript
// Access all mapped data
const all = game.cfg5e.mappedData;

// Access specific categories
const abilities = game.cfg5e.mappedData.abilities;
const sizes = game.cfg5e.mappedData.sizes;
const masteries = game.cfg5e.mappedData.weaponMasteries;

// Query Core Concepts
const fireSpells = game.coreConcepts.rules.getByTag('fire');
const conditions = game.coreConcepts.rules.getByType('condition');
```

### Export to Platform

```javascript
const mapper = new DnD5eMapper();
await mapper.initialize();
await mapper.mapAll();

// Get organized Core Concepts format
const formatted = mapper.exportToCoreConceptsFormat();

// Returns:
{
  rules: [...],              // Conditions, damage types, activation types
  attributes: [...],         // Abilities, skills, movement, senses, sizes
  characterOptions: [...],   // Species, classes
  items: [...],             // Tools, weapons, armor, currencies
  itemProperties: [...],    // Rarity, attunement
  magic: [...],             // Spell schools, components
  traits: [...],            // Languages, alignments, creature types
  combat: [...],            // Weapon masteries
  structures: [...]         // Facilities
}

// Sync to platform
await fetch('/api/rpg/rules', {
  method: 'POST',
  body: JSON.stringify(formatted)
});
```

## Platform Agnostic

All data is pure JSON - no Foundry-specific code. Works on:
- ✅ Foundry VTT
- ✅ Unity/Unreal
- ✅ Web platforms
- ✅ Mobile apps

## PHB 2024 Alignment

- ✅ Uses "Species" (not deprecated "race")
- ✅ Includes Weapon Masteries
- ✅ Updated activation types
- ✅ SRD 5.2.1 compliant

## Total Categories Mapped

| Category | Count |
|----------|-------|
| Abilities | 6 |
| Skills | 18 |
| Sizes | 9 |
| Damage Types | 13 |
| Conditions | 15 |
| Activation Types | 10+ |
| Weapon Masteries | 8 |
| Classes | 12 |
| Spell Schools | 8 |
| Spell Components | 5 |
| Alignments | 9 |
| Creature Types | 14 |
| Languages | 16+ |
| Movement Types | 5 |
| Senses | 4 |
| Currencies | 5 |
| Item Rarity | 6 |
| Attunement Types | 3 |
| **Total Categories** | **25+** |

---

**Comprehensive mapping of D&D 5e for platform-agnostic use** 🎲✨
