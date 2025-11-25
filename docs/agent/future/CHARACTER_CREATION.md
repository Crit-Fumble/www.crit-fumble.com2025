# Character Creation

## Overview

Character creation in the Crit-Fumble VTT follows a card-based composition system. Characters are built by selecting and applying cards in a specific order, with each card providing traits, abilities, proficiencies, and other features.

This document defines the character creation process for both **Player Characters (PCs)** and **NPCs/Monsters**, following SRD 5.2.1 rules with CFG5e expansion support.

---

## Player Character Creation

Player characters are created through a 6-step process, selecting cards and making choices that define the character's identity and capabilities.

### Character Creation Steps (PCs)

#### Step 1: Choose a Class
**Card Type**: `character-class`
**Location**: [data/srd521/core/cards/classes.json](../data/srd521/core/cards/classes.json)

Select one Level 1 Class Card from the available classes:

- **Fighter** - Masters of martial combat (d10 HD, Str/Dex primary)
- **Cleric** - Divine spellcasters (d8 HD, Wis primary)
- **Barbarian** - Primal warriors (d12 HD, Str primary)
- **Bard** - Versatile performers (d8 HD, Cha primary)
- **Druid** - Nature spellcasters (d8 HD, Wis primary)
- **Monk** - Martial artists (d8 HD, Dex/Wis primary)
- **Paladin** - Holy warriors (d10 HD, Str/Cha primary)
- **Ranger** - Wilderness warriors (d10 HD, Dex/Wis primary)
- **Rogue** - Cunning specialists (d8 HD, Dex primary)
- **Sorcerer** - Innate spellcasters (d6 HD, Cha primary)
- **Warlock** - Pact spellcasters (d8 HD, Cha primary)
- **Wizard** - Scholarly spellcasters (d6 HD, Int primary)

**What the Class Card Provides**:
- Primary ability scores
- Hit Point Die (d6, d8, d10, or d12)
- Saving throw proficiencies (2)
- Skill proficiencies (choose N from list)
- Weapon proficiencies
- Armor training
- Starting equipment (choose option A, B, or C)
- Level 1 class features
- Subclass options (gained at level 3)
- Spellcasting progression (if applicable)

#### Step 2: Choose a Background
**Card Type**: `background`
**Location**: [data/srd521/core/cards/backgrounds.json](../data/srd521/core/cards/backgrounds.json)

Select one Background Card:

- **Acolyte** - Temple devotee (Int/Wis/Cha)
- **Criminal** - Underworld operative (Dex/Con/Int)
- **Sage** - Scholar and researcher (Con/Int/Wis)
- **Soldier** - Trained warrior (Str/Dex/Con)

**What the Background Card Provides**:
- Ability score increases (choose 3 abilities: +2/+1/+0 or +1/+1/+1)
- Origin feat (specific to background)
- Skill proficiencies (2)
- Tool proficiency (1)
- Starting equipment (choose option A or B)

#### Step 3: Choose a Species
**Card Type**: `creature-species`
**Location**: [data/srd521/core/cards/species.json](../data/srd521/core/cards/species.json)

Select one Species Card (currently limited to Humanoid creature type):

- **Dragonborn** - Dragon-blooded (Medium, 30 ft)
- **Dwarf** - Mountain folk (Medium, 30 ft)
- **Elf** - Fey ancestry (Medium, 30 ft)
- **Gnome** - Small clever folk (Small, 30 ft)
- **Goliath** - Giant descendants (Medium, 35 ft)
- **Halfling** - Small brave folk (Small, 30 ft)
- **Human** - Versatile people (Medium/Small choice, 30 ft)
- **Orc** - Strong warriors (Medium, 30 ft)
- **Tiefling** - Fiendish heritage (Medium/Small choice, 30 ft)

**What the Species Card Provides**:
- Creature type (Humanoid for all PC species)
- Size (Medium or Small)
- Speed (30 or 35 feet)
- Species traits (darkvision, resistances, special abilities)
- Lineage choices (for Elf, Gnome, Tiefling, Dragonborn)

#### Step 4: Choose an Origin Feat
**Card Type**: `feat` (category: `origin`)
**Location**: [data/srd521/core/cards/feats.json](../data/srd521/core/cards/feats.json)

Select one Origin Feat:

- **Alert** - Initiative proficiency and initiative swap
- **Magic Initiate** - Learn 2 cantrips and 1 level 1 spell (choose Cleric, Druid, or Wizard)
- **Savage Attacker** - Reroll weapon damage once per turn
- **Skilled** - Gain proficiency in 3 skills or tools

**Note**: Some species grant additional origin feats automatically (e.g., Human's Versatile trait). Some backgrounds also grant specific origin feats.

#### Step 5: Determine Ability Scores
**Roll Method**: Choose one of three methods
**Location**: [docs/DICE_ROLL_SYSTEM.md](DICE_ROLL_SYSTEM.md) and [data/srd521/core/systems/abilities.json](../data/srd521/core/systems/abilities.json)

**Standard Array**:
- Assign these scores to your six abilities in any order: `[15, 14, 13, 12, 10, 8]`

**Roll 4d6 Drop Lowest**:
- Roll `4d6dl1` six times
- Assign results to abilities in any order
- Roll string: `4d6dl1` (repeat 6 times)

**Roll 3d6 Straight**:
- Roll `3d6` six times in order (Str, Dex, Con, Int, Wis, Cha)
- Assign results in strict order (old school method)
- Roll string: `3d6` (repeat 6 times, in-order assignment)

**Point Buy** (27 points):
- Start with 8 in each ability
- Spend 27 points to increase scores
- Maximum starting score: 15
- Cost table:
  ```
  Score: 8  9  10 11 12 13 14 15
  Cost:  0  1   2  3  4  5  7  9
  ```

**After Rolling/Choosing Base Scores**:
1. Apply Background ability score increases (step 2)
2. Calculate ability modifiers: `(score - 10) / 2` (rounded down)

#### Step 6: Choose an Alignment
**Card Type**: `alignment`
**Location**: [data/srd521/core/cards/alignments.json](../data/srd521/core/cards/alignments.json)

Select one Alignment representing your character's moral and ethical outlook:

**Lawful Alignments**:
- **Lawful Good** - Honor, justice, and compassion
- **Lawful Neutral** - Order and tradition
- **Lawful Evil** - Power through rigid hierarchy

**Neutral Alignments**:
- **Neutral Good** - Helping others without bias
- **True Neutral** - Balance in all things
- **Neutral Evil** - Pure self-interest

**Chaotic Alignments**:
- **Chaotic Good** - Freedom and kindness
- **Chaotic Neutral** - Personal freedom above all
- **Chaotic Evil** - Arbitrary violence and destruction

---

## PC Character Creation Flow Summary

```
1. Choose Class Card → Gain HD, proficiencies, features, equipment
2. Choose Background Card → Gain ability score increases, feat, skills, tools, equipment
3. Choose Species Card → Gain creature type, size, speed, traits
4. Choose Origin Feat Card → Gain special ability
5. Determine Ability Scores → Roll or assign, then apply background increases
6. Choose Alignment Card → Define moral/ethical outlook
```

**Result**: A complete Level 1 player character ready for adventure!

---

## NPC/Monster Creation

NPCs and monsters use simplified creation rules optimized for Game Master efficiency.

### NPC Creation Methods

#### Method 1: Quick NPC (Non-Combat)
For simple NPCs who won't engage in combat:

1. **Choose Role**: Shopkeeper, Guard, Noble, Commoner, etc.
2. **Assign Ability Scores**: Use Standard Array `[10, 10, 10, 10, 10, 10]` or simple modifiers
3. **Choose 1-3 Skills**: Based on role
4. **Define Purpose**: What does this NPC do in the story?

**No cards needed** - simple stat block only.

#### Method 2: NPC Class (Combat-Capable)
For NPCs who may fight alongside or against the party:

**Card Type**: `npc-class`
**Simplified from PC classes**

1. **Choose NPC Class Card**:
   - Warrior (Fighter-like)
   - Priest (Cleric-like)
   - Mage (Wizard-like)
   - Rogue (Rogue-like)
   - Expert (Skill-focused)

2. **Assign CR/Level**: Determines stats and abilities

3. **Choose Equipment**: Based on role

**NPC Classes provide**:
- Hit Points (CR-based)
- AC calculation
- Attack bonuses
- Core abilities (simplified from PC classes)
- No complex features or spell lists

#### Method 3: Monster Stat Block
For creatures and monsters:

**Card Type**: `creature-species` (monster variety)

1. **Choose Monster Card** from bestiary
2. **Apply Challenge Rating (CR)**
3. **Add special abilities** if custom

**Monsters are pre-built** and ready to use.

---

## NPC vs PC Differences

| Feature | Player Characters | NPCs/Monsters |
|---------|------------------|---------------|
| **Complexity** | Full rules, all options | Simplified stat blocks |
| **Card Composition** | 6 cards (Class, Background, Species, Feat, etc.) | 1-2 cards (NPC Class or Monster) |
| **Ability Scores** | Roll or point buy | Fixed by CR |
| **Features** | Full progression, all class features | Core abilities only |
| **Equipment** | Detailed starting equipment | Role-appropriate gear |
| **Leveling** | XP-based, full progression | CR-based, static |
| **Spellcasting** | Full spell lists and slots | Limited spell-like abilities |
| **Creation Time** | 30-60 minutes | 5-10 minutes |

---

## Card Files Reference

All character creation cards are located in [data/srd521/core/cards/](../data/srd521/core/cards/):

- **classes.json** - All 12 character classes with full progression
- **backgrounds.json** - 4 SRD backgrounds with ability increases and feats
- **species.json** - 9 playable species with traits and lineages
- **feats.json** - Origin, general, fighting style, and epic boon feats
- **alignments.json** - 9 alignment philosophies
- **subclasses.json** - Subclass options for each class (unlocked at level 3)

---

## Ability Score Determination Details

### Standard Array
**Method**: `array`
**Values**: `[15, 14, 13, 12, 10, 8]`

The standard array provides balanced starting ability scores. Assign them to the six abilities (Str, Dex, Con, Int, Wis, Cha) in any order based on your class and build preference.

**Recommended Assignments**:
- **Fighter (Str-based)**: Str 15, Con 14, Dex 13, Wis 12, Cha 10, Int 8
- **Wizard**: Int 15, Dex 14, Con 13, Wis 12, Cha 10, Str 8
- **Cleric**: Wis 15, Con 14, Str 13, Dex 12, Cha 10, Int 8
- **Rogue**: Dex 15, Con 14, Int 13, Cha 12, Wis 10, Str 8

### Roll 4d6 Drop Lowest
**Method**: `roll`
**Roll String**: `4d6dl1`
**Repeat**: 6 times
**Assignment**: Player choice

This method creates varied characters with potentially higher or lower scores than standard array.

**Process**:
1. Roll `4d6dl1` and record result (3-18 range, average ~12.24)
2. Repeat 5 more times for a total of 6 scores
3. Assign the six results to your six abilities in any order

**Example Roll**:
```
Roll 1: 4d6dl1 → [6, 4, 3, 2] drop 2 → 13
Roll 2: 4d6dl1 → [5, 5, 4, 3] drop 3 → 14
Roll 3: 4d6dl1 → [6, 5, 2, 1] drop 1 → 13
Roll 4: 4d6dl1 → [4, 3, 3, 2] drop 2 → 10
Roll 5: 4d6dl1 → [6, 6, 5, 2] drop 2 → 17
Roll 6: 4d6dl1 → [3, 3, 2, 1] drop 1 → 8

Results: [13, 14, 13, 10, 17, 8]
Assign: Str 13, Dex 17, Con 14, Int 10, Wis 13, Cha 8 (for a Rogue)
```

### Roll 3d6 Straight
**Method**: `roll`
**Roll String**: `3d6`
**Repeat**: 6 times
**Assignment**: In-order (Str, Dex, Con, Int, Wis, Cha)

The "old school" method where you roll for each ability in strict order. This creates authentic, gritty characters where you adapt your class choice to your rolls rather than optimizing rolls for your chosen class.

**Process**:
1. Roll `3d6` for Strength
2. Roll `3d6` for Dexterity
3. Roll `3d6` for Constitution
4. Roll `3d6` for Intelligence
5. Roll `3d6` for Wisdom
6. Roll `3d6` for Charisma

**Example Roll**:
```
Str: 3d6 → [4, 3, 5] → 12
Dex: 3d6 → [6, 5, 4] → 15
Con: 3d6 → [3, 3, 2] → 8
Int: 3d6 → [5, 4, 3] → 12
Wis: 3d6 → [6, 6, 5] → 17
Cha: 3d6 → [2, 2, 1] → 5

Character: High Dex/Wis, low Con/Cha → Good fit for Ranger or Rogue
```

### Point Buy (27 Points)
**Method**: `point-buy`
**Total Points**: 27
**Base Score**: 8 in each ability
**Maximum Score**: 15

Point buy provides the most control, allowing you to create exactly the character you envision within defined limits.

**Cost Table**:
| Score | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 |
|-------|---|---|----|----|----|----|----|-----|
| Cost  | 0 | 1 | 2  | 3  | 4  | 5  | 7  | 9   |

**Process**:
1. Start with 8 in each ability (costs 0 points)
2. Spend points to increase scores
3. Maximum starting score is 15 (cost 9 points total from base 8)
4. Must spend exactly 27 points (or fewer if desired)

**Example Builds**:

**Optimized Fighter**:
- Str 15 (9 pts), Dex 14 (7 pts), Con 14 (7 pts), Int 8, Wis 10 (2 pts), Cha 10 (2 pts)
- Total: 9+7+7+0+2+2 = 27 points

**Balanced Wizard**:
- Str 8, Dex 13 (5 pts), Con 14 (7 pts), Int 15 (9 pts), Wis 12 (4 pts), Cha 10 (2 pts)
- Total: 0+5+7+9+4+2 = 27 points

**Versatile Bard**:
- Str 8, Dex 14 (7 pts), Con 12 (4 pts), Int 10 (2 pts), Wis 10 (2 pts), Cha 15 (9 pts)
- Total: 0+7+4+2+2+9 = 24 points (3 points unspent)

---

## Next Steps

After creating a character:

1. **Calculate Derived Stats**:
   - Hit Points: `HD + Constitution modifier`
   - Armor Class: Based on armor and Dex modifier
   - Initiative: `Dexterity modifier` (or `Dex modifier + Proficiency Bonus` with Alert feat)
   - Proficiency Bonus: +2 at level 1

2. **Choose Starting Spells** (if applicable):
   - Prepared casters: Prepare `level + spellcasting ability modifier` spells
   - Known casters: Choose cantrips and spells per class table

3. **Select Equipment**:
   - Choose option A, B, or C from class starting equipment
   - Add background equipment
   - Calculate encumbrance (carrying capacity = Str score × 15 lbs)

4. **Define Character Details**:
   - Name, appearance, personality
   - Bonds, ideals, flaws
   - Backstory integration with background

5. **Begin Play** at Level 1!

---

## Validation

Character creation data must validate against:
- [schemas/card.schema.json](../schemas/card.schema.json)
- [src/validators/schemaValidator.js](../src/validators/schemaValidator.js)

Run validation:
```bash
node src/validators/validate.js srd521
```

All character creation cards must pass validation before use in the VTT.
