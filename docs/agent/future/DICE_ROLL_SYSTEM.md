# Dice Roll System

## Overview

DiceRoll is a core-level concept in Crit-Fumble VTT. All dice-based mechanics are defined using standardized roll strings and roll type definitions.

## Core Concept: DiceRoll

A DiceRoll represents any dice-based random determination in the game.

### Roll String Format

Roll strings use a standardized notation that can express any dice rolling operation:

#### Basic Format
```
{count}d{sides}[modifiers]
```

#### Standard Notation Examples
- `1d20` - Single twenty-sided die
- `3d6` - Three six-sided dice
- `2d8+5` - Two eight-sided dice plus 5
- `1d12-2` - One twelve-sided die minus 2
- `4d6dl1` - Four six-sided dice, drop lowest 1 (ability score generation)
- `2d20kh1` - Two twenty-sided dice, keep highest 1 (advantage)
- `2d20kl1` - Two twenty-sided dice, keep lowest 1 (disadvantage)

#### Extended Notation

**Drop Dice**:
- `dl{n}` - Drop lowest n dice (e.g., `4d6dl1`)
- `dh{n}` - Drop highest n dice (e.g., `4d6dh1`)

**Keep Dice**:
- `kh{n}` - Keep highest n dice (e.g., `2d20kh1` for advantage)
- `kl{n}` - Keep lowest n dice (e.g., `2d20kl1` for disadvantage)

**Reroll**:
- `r{n}` - Reroll dice showing n or less (e.g., `8d6r1` reroll 1s)
- `rr{n}` - Reroll recursively until not n or less (e.g., `8d6rr1`)

**Exploding**:
- `!` - Explode on max (e.g., `3d6!` reroll and add on 6)
- `!>{n}` - Explode on n or greater (e.g., `4d6!>5`)

**Minimum/Maximum**:
- `min{n}` - Minimum result per die (e.g., `2d6min2`)
- `max{n}` - Maximum result per die (e.g., `8d6max5`)

**Multiple Operations**:
- `4d6dl1` - Roll 4d6, drop lowest
- `2d20kh1+5` - Advantage with +5 modifier
- `6d6r1+3` - 6d6 reroll 1s, plus 3

### Roll String Grammar

```
roll_string := dice_expression [modifier]
dice_expression := count "d" sides [operation]*
count := number
sides := number
operation := drop | keep | reroll | explode | min | max
modifier := ("+" | "-") number
```

## DiceRoll Type Definition

```json
{
  "id": "core-concept-dice-roll",
  "type": "concept",
  "name": "DiceRoll",
  "title": "Dice Roll Core Concept",
  "description": "Foundation for all dice-based random determination in the game",

  "properties": {
    "rollString": {
      "type": "string",
      "description": "Standardized dice notation (e.g., '4d6dl1', '1d20+5')",
      "required": true
    },
    "rollType": {
      "type": "string",
      "description": "Classification of roll purpose (e.g., 'ability-score', 'd20-test', 'damage')",
      "required": false
    },
    "description": {
      "type": "string",
      "description": "Human-readable description of what this roll represents",
      "required": false
    },
    "modifier": {
      "type": "number",
      "description": "Static modifier to add to roll result",
      "required": false,
      "default": 0
    },
    "advantage": {
      "type": "boolean",
      "description": "Roll with advantage (2d20kh1)",
      "required": false,
      "default": false
    },
    "disadvantage": {
      "type": "boolean",
      "description": "Roll with disadvantage (2d20kl1)",
      "required": false,
      "default": false
    }
  },

  "metadata": {
    "source": "SRD 5.2.1",
    "sources": ["SRD 5.2.1"],
    "legal": "CC-BY-4.0"
  }
}
```

## Standard Roll Types

### Character Creation Rolls

#### Ability Score Generation

**Standard Array** (not a roll, but predefined):
```json
{
  "rollType": "ability-score-array",
  "description": "Standard ability score array",
  "values": [15, 14, 13, 12, 10, 8]
}
```

**Roll 4d6 Drop Lowest**:
```json
{
  "rollType": "ability-score-roll",
  "rollString": "4d6dl1",
  "description": "Roll 4d6, drop the lowest die, sum remaining three",
  "repeat": 6
}
```

**Roll 3d6 Straight**:
```json
{
  "rollType": "ability-score-roll",
  "rollString": "3d6",
  "description": "Roll 3d6, sum all three dice",
  "repeat": 6
}
```

**Point Buy** (not a roll, but a system):
```json
{
  "rollType": "ability-score-point-buy",
  "description": "Point buy system with 27 points",
  "totalPoints": 27,
  "costs": {
    "8": 0, "9": 1, "10": 2, "11": 3, "12": 4, "13": 5,
    "14": 7, "15": 9
  }
}
```

#### Hit Points

**First Level** (max HP):
```json
{
  "rollType": "hit-points-first-level",
  "description": "Maximum hit die value + CON modifier",
  "rollString": null,
  "calculatedValue": "hitDieMax + conModifier"
}
```

**Level Up**:
```json
{
  "rollType": "hit-points-level-up",
  "rollString": "1d{hitDie}",
  "description": "Roll hit die + CON modifier (or take average)",
  "average": "(hitDieMax / 2) + 1 + conModifier"
}
```

### D20 Tests

**D20 Test** is a dynamic type of DiceRoll that includes various modifiers:

#### Ability Check
```json
{
  "rollType": "d20-test",
  "testType": "ability-check",
  "rollString": "1d20",
  "description": "Ability check",
  "modifiers": [
    { "type": "ability", "ability": "str", "modifier": 2 },
    { "type": "proficiency", "proficient": false, "modifier": 0 }
  ],
  "dc": 15,
  "advantage": false,
  "disadvantage": false
}
```

#### Saving Throw
```json
{
  "rollType": "d20-test",
  "testType": "saving-throw",
  "rollString": "1d20",
  "description": "Dexterity saving throw",
  "modifiers": [
    { "type": "ability", "ability": "dex", "modifier": 3 },
    { "type": "proficiency", "proficient": true, "modifier": 3 }
  ],
  "dc": 14,
  "advantage": false,
  "disadvantage": false
}
```

#### Attack Roll
```json
{
  "rollType": "d20-test",
  "testType": "attack-roll",
  "rollString": "1d20",
  "description": "Longsword attack",
  "modifiers": [
    { "type": "ability", "ability": "str", "modifier": 3 },
    { "type": "proficiency", "proficient": true, "modifier": 3 }
  ],
  "targetAC": 15,
  "advantage": false,
  "disadvantage": false,
  "criticalRange": { "min": 20, "max": 20 }
}
```

#### Skill Check
```json
{
  "rollType": "d20-test",
  "testType": "skill-check",
  "rollString": "1d20",
  "skill": "Athletics",
  "description": "Athletics check",
  "modifiers": [
    { "type": "ability", "ability": "str", "modifier": 3 },
    { "type": "proficiency", "proficient": true, "modifier": 3 }
  ],
  "dc": 12,
  "advantage": false,
  "disadvantage": false
}
```

### Damage Rolls

#### Weapon Damage
```json
{
  "rollType": "damage",
  "damageType": "slashing",
  "rollString": "1d8+3",
  "description": "Longsword damage",
  "modifiers": [
    { "type": "ability", "ability": "str", "modifier": 3 }
  ],
  "critical": {
    "rollString": "2d8+3",
    "description": "Critical hit doubles dice only"
  }
}
```

#### Spell Damage
```json
{
  "rollType": "damage",
  "damageType": "fire",
  "rollString": "8d6",
  "description": "Fireball damage",
  "savingThrow": {
    "ability": "dex",
    "dc": 15,
    "onSave": "half"
  }
}
```

### Healing Rolls

```json
{
  "rollType": "healing",
  "rollString": "1d8+3",
  "description": "Cure Wounds",
  "modifiers": [
    { "type": "spellcastingAbility", "ability": "wis", "modifier": 3 }
  ]
}
```

### Initiative Rolls

```json
{
  "rollType": "initiative",
  "rollString": "1d20",
  "description": "Initiative roll",
  "modifiers": [
    { "type": "ability", "ability": "dex", "modifier": 2 }
  ]
}
```

### Death Saving Throws

```json
{
  "rollType": "death-save",
  "rollString": "1d20",
  "description": "Death saving throw",
  "dc": 10,
  "critical": {
    "success": { "threshold": 20, "effect": "regain 1 HP" },
    "failure": { "threshold": 1, "effect": "2 failures" }
  }
}
```

## Extended Roll Types

### Advantage/Disadvantage

Advantage and disadvantage modify the roll string:

**Normal Roll**:
```json
{
  "rollString": "1d20",
  "advantage": false,
  "disadvantage": false
}
```

**Advantage**:
```json
{
  "rollString": "2d20kh1",
  "advantage": true,
  "disadvantage": false
}
```

**Disadvantage**:
```json
{
  "rollString": "2d20kl1",
  "advantage": false,
  "disadvantage": true
}
```

**Advantage + Disadvantage = Normal**:
```json
{
  "rollString": "1d20",
  "advantage": true,
  "disadvantage": true,
  "note": "Advantage and disadvantage cancel out"
}
```

## Character Creation with Rolls

Updated creature type card example with roll strings:

```json
{
  "id": "creature-type-humanoid",
  "type": "card",
  "cardType": "creature-type",
  "category": "creature",
  "name": null,
  "title": "Humanoid Creature Type",

  "properties": {
    "creatureType": "humanoid",
    "hasSpecies": true,
    "reproduction": "natural",
    "intelligenceLevel": "full",

    "statGeneration": {
      "methods": ["standardArray", "roll4d6DropLowest", "roll3d6Straight", "pointBuy"],

      "standardArray": {
        "method": "array",
        "values": [15, 14, 13, 12, 10, 8],
        "description": "Standard ability score array"
      },

      "roll4d6DropLowest": {
        "method": "roll",
        "rolls": [
          {
            "rollType": "ability-score-roll",
            "rollString": "4d6dl1",
            "description": "Roll 4d6, drop the lowest die",
            "repeat": 6,
            "assignmentOrder": "player-choice"
          }
        ],
        "description": "Roll 4d6 drop lowest, six times"
      },

      "roll3d6Straight": {
        "method": "roll",
        "rolls": [
          {
            "rollType": "ability-score-roll",
            "rollString": "3d6",
            "description": "Roll 3d6 straight",
            "repeat": 6,
            "assignmentOrder": "in-order",
            "order": ["str", "dex", "con", "int", "wis", "cha"]
          }
        ],
        "description": "Roll 3d6 for each ability in order"
      },

      "pointBuy": {
        "method": "point-buy",
        "totalPoints": 27,
        "minimumScore": 8,
        "maximumScore": 15,
        "costs": {
          "8": 0, "9": 1, "10": 2, "11": 3, "12": 4, "13": 5,
          "14": 7, "15": 9
        },
        "description": "27 point buy system"
      }
    }
  },

  "metadata": {
    "source": "SRD 5.2.1",
    "sources": ["SRD 5.2.1"],
    "legal": "CC-BY-4.0"
  }
}
```

## Implementation Notes

### Roll Resolver

A roll resolver should be able to parse and execute any roll string:

```javascript
class DiceRoller {
  roll(rollString, context = {}) {
    // Parse roll string
    const parsed = this.parseRollString(rollString);

    // Execute roll
    const result = this.executeRoll(parsed, context);

    // Return detailed result
    return {
      rollString,
      rolls: result.individualRolls,
      total: result.total,
      breakdown: result.breakdown,
      context
    };
  }

  parseRollString(rollString) {
    // Parse into count, sides, operations, modifiers
    // Returns structured object
  }

  executeRoll(parsed, context) {
    // Execute the actual dice rolls
    // Apply operations (drop, keep, reroll, explode)
    // Apply modifiers
    // Return result with full breakdown
  }
}
```

### D20 Test Resolution

```javascript
class D20TestResolver {
  resolve(test) {
    // Determine final roll string (advantage/disadvantage)
    let rollString = test.rollString;
    if (test.advantage && !test.disadvantage) {
      rollString = "2d20kh1";
    } else if (test.disadvantage && !test.advantage) {
      rollString = "2d20kl1";
    }

    // Roll the dice
    const roll = this.roller.roll(rollString, test);

    // Apply modifiers
    const total = roll.total + this.sumModifiers(test.modifiers);

    // Check success
    const success = total >= (test.dc || test.targetAC);
    const critical = roll.rolls[0] === 20;
    const fumble = roll.rolls[0] === 1;

    return {
      ...roll,
      modifiedTotal: total,
      success,
      critical,
      fumble
    };
  }
}
```

## Validation Rules

1. **Roll String Format**: Must be valid dice notation
2. **Advantage/Disadvantage**: Cannot both be true in final resolution
3. **Modifier Types**: Must be recognized modifier types
4. **DC/Target**: D20 tests must have either dc or targetAC
5. **Damage Type**: Damage rolls must specify damage type

## Next Steps

- [ ] Create roll string parser
- [ ] Implement dice roller
- [ ] Create D20 test resolver
- [ ] Add roll logging/history
- [ ] Implement advantage/disadvantage UI
- [ ] Create roll templates for common actions
