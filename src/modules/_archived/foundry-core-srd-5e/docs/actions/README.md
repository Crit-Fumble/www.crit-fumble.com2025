# D&D 5e Actions System

This directory contains comprehensive JSON definitions for all standard actions available in D&D 5th Edition, based on the official System Reference Document (SRD) 5.2.

## Overview

Actions are the primary way characters interact with the game world during their turn. Understanding the action system is fundamental to playing D&D 5e effectively, especially during combat encounters.

## Action Economy

The action economy in D&D 5e governs what a character can do during their turn in a round of combat (approximately 6 seconds of in-game time).

### On Your Turn

During your turn in combat, you have access to:

1. **Movement** - Move up to your Speed (typically 30 feet for most Medium creatures)
2. **One Action** - Choose from the standard actions or special actions from your features
3. **One Bonus Action** (if available) - Only if a feature explicitly grants it
4. **One Reaction** (if available) - Can be used on any turn, including others' turns
5. **Free Interactions** - One free object interaction (like drawing a weapon or opening a door)
6. **Communication** - Brief utterances and gestures

### Action Types

#### Action
The primary action you take on your turn. You can only take one action per turn unless a feature says otherwise. Standard actions include:
- Attack
- Cast a Spell (Magic)
- Dash
- Disengage
- Dodge
- Help
- Hide
- Influence
- Ready
- Search
- Study
- Utilize

#### Bonus Action
A special action that can be taken in addition to your regular action. You can only take a Bonus Action if:
- A class feature explicitly grants it (e.g., Rogue's Cunning Action)
- A spell has a casting time of "1 bonus action"
- An item or effect specifically allows it

You can only take ONE Bonus Action per turn, regardless of how many features grant Bonus Actions.

#### Reaction
An instant response to a trigger. You get one Reaction per round (resets at the start of your turn). Common reactions include:
- Opportunity Attacks (when an enemy leaves your reach)
- Ready action triggers (when the condition you specified occurs)
- Spells with casting time of "1 reaction"
- Class features that use reactions

#### Free Action
These don't require an action:
- One object interaction per turn (drawing/stowing a weapon, opening a door, picking up an object)
- Dropping an item
- Falling prone voluntarily
- Brief communication (a few words, gestures)

## Standard Actions

### Combat Actions

**Attack** - Make one melee or ranged attack with a weapon or Unarmed Strike
- File: `attack.json`
- Can include grappling or shoving with Unarmed Strikes
- Features like Extra Attack let you make multiple attacks with one Attack action

**Grapple** - Restrain a creature by grabbing them
- File: `grapple.json`
- Uses the Attack action with an Unarmed Strike option
- Target makes Strength or Dexterity save vs. your DC
- Requires a free hand

**Shove** - Push a creature away or knock them prone
- File: `shove.json`
- Uses the Attack action with an Unarmed Strike option
- Target makes Strength or Dexterity save vs. your DC
- Can push 5 feet or knock prone

**Dash** - Gain extra movement equal to your Speed
- File: `dash.json`
- Doubles your available movement for the turn
- Works with special speeds (Fly, Swim, Climb)

**Disengage** - Move without provoking Opportunity Attacks
- File: `disengage.json`
- Essential for escaping melee combat safely
- Lasts for the entire turn

**Dodge** - Focus on avoiding attacks
- File: `dodge.json`
- Attackers have Disadvantage on attack rolls against you
- You have Advantage on Dexterity saving throws
- Lasts until start of your next turn

**Ready** - Prepare an action for a specific trigger
- File: `ready.json`
- Uses your Reaction when triggered
- Requires Concentration for readied spells
- Can ready an action or movement

### Magic Actions

**Cast a Spell (Magic)** - Cast a spell or use magical items
- File: `cast-spell.json`
- Most spells use an action to cast
- Some spells take longer (minutes, hours)
- Requires components (Verbal, Somatic, Material)

### Support Actions

**Help** - Aid an ally or stabilize a dying creature
- File: `help.json`
- Grant Advantage on an ally's ability check or attack roll
- Can stabilize dying creatures with DC 10 Medicine check
- Benefit expires at start of your next turn

**Hide** - Attempt to conceal yourself
- File: `hide.json`
- Requires being Heavily Obscured or behind cover
- DC 15 Dexterity (Stealth) check
- Grants Invisible condition while hidden

### Information Actions

**Search** - Look for something hidden or concealed
- File: `search.json`
- Make a Wisdom check (typically Perception)
- Can detect hidden creatures, objects, or clues
- Skills: Insight, Medicine, Perception, Survival

**Study** - Recall or research information
- File: `study.json`
- Make an Intelligence check
- Access knowledge from memory or references
- Skills: Arcana, History, Investigation, Nature, Religion

### Social Actions

**Influence** - Persuade, deceive, or intimidate creatures
- File: `influence.json`
- Alter a creature's attitude or behavior
- Make a Charisma or Wisdom check
- Skills: Deception, Intimidation, Performance, Persuasion, Animal Handling
- Target attitude affects difficulty (Friendly, Indifferent, Hostile)

### Object Interaction

**Utilize** - Use a nonmagical object
- File: `utilize.json`
- Required when object needs more than a free interaction
- Examples: picking a lock, operating mechanisms, using tools
- May require ability checks

## JSON Structure

Each action is defined in a JSON file with the following structure:

```json
{
  "id": "action-{name}",
  "name": "{Action Name}",
  "description": "Brief description of the action",
  "type": "action|bonus-action|reaction|free-action",
  "availability": "combat|exploration|any",
  "requirements": [
    "Prerequisites for taking this action"
  ],
  "effects": {
    "description": "What happens when you take this action",
    "mechanicalEffects": [
      "Specific game mechanics"
    ]
  },
  "restrictions": [
    "Limitations on using this action"
  ],
  "srdReference": "path/to/srd/file.md:line-numbers",
  "examples": [
    "Common use cases"
  ],
  "relatedActions": ["action-dash", "action-disengage"],
  "additionalRules": {
    "key": "Additional mechanical details"
  }
}
```

## Key Mechanics

### D20 Tests

Most actions that require a check use a d20 roll:
1. Roll 1d20
2. Add ability modifier (Strength, Dexterity, etc.)
3. Add Proficiency Bonus (if proficient in relevant skill/save/weapon)
4. Add any other bonuses or penalties
5. Compare total to target number (DC for ability checks/saves, AC for attacks)

### Advantage and Disadvantage

- **Advantage**: Roll 2d20, use the higher result
- **Disadvantage**: Roll 2d20, use the lower result
- Multiple instances don't stack
- Advantage and Disadvantage cancel each other out

### Proficiency Bonus

Characters add their Proficiency Bonus to:
- Attack rolls with weapons they're proficient with
- Ability checks using skills they're proficient in
- Saving throws they're proficient in
- Spell attack rolls
- Spell save DCs

Proficiency Bonus by level:
- Levels 1-4: +2
- Levels 5-8: +3
- Levels 9-12: +4
- Levels 13-16: +5
- Levels 17-20: +6

## Combat Integration

### Turn Structure

1. **Start of Turn**
   - Ongoing effects trigger
   - Refresh Reaction

2. **Your Turn**
   - Movement (can be split before/after action)
   - Action
   - Bonus Action (if available)
   - Free object interaction

3. **End of Turn**
   - Effects that last "until end of your turn" expire
   - Temporary benefits end

### Opportunity Attacks

When a creature leaves your reach using its action, Bonus Action, Reaction, or speed:
- You can use your Reaction to make one melee attack
- Disengage action prevents Opportunity Attacks
- Teleportation doesn't provoke Opportunity Attacks
- Being forcibly moved doesn't provoke Opportunity Attacks

### Critical Hits

Rolling a natural 20 on an attack roll:
- Attack automatically hits
- Roll all damage dice twice
- Add modifiers normally (only once)
- Apply to weapon damage and any additional damage (like Sneak Attack)

## Usage in FoundryVTT

These action definitions are designed for integration with FoundryVTT's D&D 5e system:

### Character Sheets
- Actions can be displayed as quick-access buttons
- Action descriptions provide tooltip information
- Requirements can gate action availability

### Automation
- Mechanical effects can trigger automated rolls
- Conditions can be applied automatically
- Resource tracking (spell slots, uses, etc.)

### Compendiums
- Actions can be added to compendium packs
- Easy drag-and-drop to character sheets
- Searchable by name, type, or keyword

### Macros
- JSON structure supports macro generation
- Common actions become one-click buttons
- Chat messages can display full action details

## SRD References

All actions are based on the D&D 5e System Reference Document version 5.2. Each JSON file includes specific line references to the source material in the `srdReference` field.

Primary source documents:
- `dndsrd5.2_markdown/src/08_RulesGlossary.md` - Detailed action definitions
- `dndsrd5.2_markdown/src/01_PlayingTheGame.md` - Core mechanics and combat rules

## Related Systems

These action definitions integrate with other game systems:

### Conditions
Actions can apply or be affected by conditions:
- Blinded, Charmed, Deafened, Frightened
- Grappled, Incapacitated, Invisible
- Paralyzed, Petrified, Poisoned
- Prone, Restrained, Stunned, Unconscious

See `../conditions/` directory for condition definitions.

### Activities
Some actions trigger or are part of larger activities:
- Short Rest, Long Rest
- Crafting, Researching
- Traveling, Exploration

### Events
Actions can trigger game events:
- Combat start/end
- Round start/end
- Turn start/end
- Condition application/removal

## Implementation Notes

### FoundryVTT Item Types

Actions can be implemented as:
- **Item.type: "feat"** - For class features that grant actions
- **Item.type: "consumable"** - For one-use action items
- **ActiveEffect** - For temporary action grants
- **Macros** - For quick action execution

### Recommended Fields

When implementing in FoundryVTT:
```javascript
{
  name: action.name,
  type: "feat",
  data: {
    description: {
      value: action.effects.description,
      chat: action.examples[0]
    },
    activation: {
      type: action.type, // "action", "bonus", "reaction"
      cost: 1
    },
    actionType: "utility", // or "attack", "save", etc.
    requirements: action.requirements.join(", "),
    // Additional fields as needed
  }
}
```

### Automation Hooks

Suggested Foundry hooks for action automation:
- `preCreateItem` - Validate action requirements
- `createActiveEffect` - Apply action effects
- `updateActor` - Track action usage
- `preCreateChatMessage` - Format action output

## Contributing

When adding new actions or updating existing ones:

1. Follow the established JSON structure
2. Include accurate SRD references with line numbers
3. Provide clear, concise descriptions
4. List all mechanical effects explicitly
5. Include practical examples
6. Cross-reference related actions
7. Document any special rules or edge cases

## License

This content is based on the D&D 5e System Reference Document (SRD) version 5.2, which is released under the Creative Commons Attribution 4.0 International License.

## Version History

- **v1.0** - Initial release with 14 standard actions based on SRD 5.2
  - Attack, Cast Spell, Dash, Disengage, Dodge
  - Help, Hide, Ready, Search, Study, Utilize
  - Grapple, Shove, Influence

## Additional Resources

- [D&D Beyond - Basic Rules](https://www.dndbeyond.com/sources/basic-rules)
- [FoundryVTT D&D 5e System Documentation](https://foundryvtt.com/packages/dnd5e)
- [SRD 5.2 Official Document](https://www.dndbeyond.com/sources/srd)
