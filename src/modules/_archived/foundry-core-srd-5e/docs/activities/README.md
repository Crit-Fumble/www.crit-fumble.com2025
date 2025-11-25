# Activities

**Activities** are actions that characters can perform during different modes of play. They represent the fundamental things players can do in the game world, beyond just combat actions.

## Purpose

Activities bridge the gap between **Modes** (like Downtime, Rest, Combat, Travel) and **Actions** (individual game mechanics). They define:
- What can be done during specific modes
- How long activities take
- What resources they require
- What effects they produce
- Whether they interrupt rest periods

## Activity Types

### By Intensity
- **None**: Sleeping, unconscious recovery
- **Light**: Reading, talking, eating, standing watch (≤2 hours during long rest)
- **Moderate**: Walking, light crafting, study
- **Strenuous**: Combat, heavy labor, forced march

### By Category
- **Sustenance**: Eating, drinking
- **Rest**: Sleeping, relaxing
- **Movement**: Walking, travel
- **Communication**: Talking, writing
- **Combat**: Fighting, defending
- **Magic**: Spellcasting, ritual casting
- **Crafting**: Creating items
- **Study**: Reading, research
- **Watch**: Guard duty, surveillance

## JSON Structure

Each activity is defined with:

```json
{
  "id": "activity-{name}",
  "name": "Activity Name",
  "description": "What the activity entails",
  "intensity": "light|moderate|strenuous|none",
  "category": "sustenance|rest|movement|communication|combat|magic|crafting|study|watch",
  "modes": ["downtime", "rest", "combat", "travel"],
  "properties": {
    "maxDurationDuringLongRest": 2,
    "physicalDemand": "none|light|moderate|heavy",
    "mentalDemand": "none|light|moderate|heavy",
    "requiresConsciousness": true,
    "compatiblePositions": ["standing", "sitting", "reclining", "prone"]
  },
  "prerequisites": [
    "Required resources or conditions"
  ],
  "srdReferences": [
    {
      "source": "path/to/srd/file.md",
      "quote": "Relevant SRD quote",
      "lineNumber": 42
    }
  ],
  "effects": {
    "interruptsLongRest": false,
    "interruptsShortRest": false,
    "grantsRestBenefits": false,
    "enablesRecovery": false
  },
  "facilitiesProviding": ["facility-food", "facility-bed"],
  "examples": [
    "Specific example scenarios"
  ],
  "downtimeUses": [
    {
      "name": "Extended Activity Name",
      "duration": "days",
      "cost": 10,
      "description": "What this extended version does"
    }
  ]
}
```

## Current Activities

1. **combat.json** - Engaging in combat encounters
2. **eating.json** - Consuming food and drink
3. **reading.json** - Reading books, scrolls, or studying written material
4. **spellcasting-non-cantrip.json** - Casting spells during rest periods
5. **standing-watch.json** - Guard duty and surveillance
6. **talking.json** - Conversation and verbal communication
7. **walking-travel.json** - Moving on foot during travel

## Integration with Core Concepts

Activities integrate with other core concepts:

### Modes
Activities define what can be done during each mode:
- **Combat Mode**: combat, movement
- **Exploration Mode**: walking, talking, reading
- **Rest Mode**: eating, sleeping, light activities (≤2 hours)
- **Downtime Mode**: crafting, training, extended activities
- **Travel Mode**: walking-travel, eating, talking

### Facilities
Facilities enable specific activities:
- **Inn** (facility-food, facility-bed): eating, sleeping, resting
- **Library** (facility-study): reading, research
- **Forge** (facility-smithing): weapon crafting, armor repair

### Events
Activities can trigger events:
- **Combat** activity → combat events (attacks, damage, victory/defeat)
- **Eating** activity → recovery events (HP restored, conditions removed)
- **Reading** activity → knowledge events (lore discovered, quest clues)

### Systems
Activities interact with game systems:
- **Rest System**: Light activities during long rest
- **Time System**: Activity duration tracking
- **Resource System**: Consumption of food, spell slots, etc.

## Usage in FoundryVTT

These activity definitions can be:
1. **Imported as Documents**: Create Activity items in FoundryVTT
2. **Referenced by Modes**: Mode managers check available activities
3. **Tracked in Sessions**: Record which activities characters performed
4. **Linked to Facilities**: Facility types enable specific activities
5. **Used for Automation**: Auto-track rest interruptions, resource consumption

## Future Activities

Potential activities to add:
- **crafting.json** - Creating items (weapons, armor, potions)
- **training.json** - Learning skills or languages
- **research.json** - Studying arcane or historical topics
- **performance.json** - Entertaining (music, acting, storytelling)
- **carousing.json** - Social downtime activities
- **prayer.json** - Religious observances
- **meditation.json** - Mental focus and recovery
- **scouting.json** - Reconnaissance and exploration
- **hiding.json** - Concealment and stealth
- **ritual-casting.json** - Extended spell casting
- **foraging.json** - Gathering food and resources
- **hunting.json** - Tracking and killing game
- **fishing.json** - Catching fish
- **swimming.json** - Aquatic travel
- **climbing.json** - Vertical movement
- **resting-short.json** - Short rest activities
- **resting-long.json** - Long rest activities
- **sleeping.json** - Unconscious rest

## SRD References

All activities are based on D&D 5e System Reference Document (SRD) rules, with specific citations included in each JSON file. This ensures accuracy and compliance with official game mechanics.

## License

Activities are derived from SRD 5.1 content and follow OGL 1.0a licensing.
