# D&D 5e Conditions

This directory contains JSON definitions for the 15 main D&D 5e conditions extracted from the SRD (System Reference Document).

## Available Conditions

1. **Blinded** (`blinded.json`) - Can't see, auto-fail sight checks, disadvantage on attacks
2. **Charmed** (`charmed.json`) - Can't harm charmer, charmer has social advantage
3. **Deafened** (`deafened.json`) - Can't hear, auto-fail hearing checks
4. **Exhaustion** (`exhaustion.json`) - Cumulative levels (1-6), reduces D20 tests and speed
5. **Frightened** (`frightened.json`) - Disadvantage while source visible, can't approach
6. **Grappled** (`grappled.json`) - Speed 0, disadvantage on attacks vs others
7. **Incapacitated** (`incapacitated.json`) - Can't take actions, reactions, or concentrate
8. **Invisible** (`invisible.json`) - Can't be targeted by sight, advantage on attacks
9. **Paralyzed** (`paralyzed.json`) - Incapacitated, speed 0, melee attacks are crits
10. **Petrified** (`petrified.json`) - Turned to stone, incapacitated, resistant to all damage
11. **Poisoned** (`poisoned.json`) - Disadvantage on attacks and ability checks
12. **Prone** (`prone.json`) - Can only crawl, disadvantage on attacks, advantage for nearby attackers
13. **Restrained** (`restrained.json`) - Speed 0, disadvantage on attacks and Dex saves
14. **Stunned** (`stunned.json`) - Incapacitated, auto-fail Str/Dex saves, advantage on attacks
15. **Unconscious** (`unconscious.json`) - Incapacitated, prone, unaware, melee attacks are crits

## JSON Structure

Each condition JSON file follows this structure:

```json
{
  "id": "condition-{name}",
  "name": "{Name}",
  "description": "Short description from SRD",
  "effects": {
    "description": "Full effect text from SRD",
    "mechanicalEffects": [
      "List of specific mechanical effects"
    ]
  },
  "duration": "varies",
  "stackable": false,
  "srdReference": "rulesglossary/rulesdefinitions/{XX}-{Name}Condition.md"
}
```

## Special Notes

- **Exhaustion** is the only stackable condition (levels 1-6)
- Several conditions reference the **Incapacitated** condition:
  - Paralyzed
  - Petrified
  - Stunned
  - Unconscious
- **Unconscious** also includes the **Prone** condition

## Source

All conditions are extracted from the official D&D 5e System Reference Document (SRD) located at:
`data/5e/srd/split/rulesglossary/rulesdefinitions/`
