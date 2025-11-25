# Travel Pace - D&D 5e SRD

Comprehensive documentation and JSON definitions for travel pace mechanics in D&D 5th Edition, based on the System Reference Document (SRD) 5.2.1.

## Table of Contents

- [Overview](#overview)
- [The Three Standard Paces](#the-three-standard-paces)
  - [Slow Pace](#slow-pace)
  - [Normal Pace](#normal-pace)
  - [Fast Pace](#fast-pace)
- [Movement Calculations](#movement-calculations)
- [Special Movement Types](#special-movement-types)
- [Difficult Terrain](#difficult-terrain)
- [Forced March & Exhaustion](#forced-march--exhaustion)
- [Terrain & Environmental Effects](#terrain--environmental-effects)
- [JSON Structure](#json-structure)
- [Integration with FoundryVTT](#integration-with-foundryvtt)
- [Usage Examples](#usage-examples)
- [SRD References](#srd-references)

## Overview

Travel pace represents how quickly a group of adventurers moves during overland travel. The pace chosen affects both the distance covered and the party's ability to notice threats, remain hidden, and navigate safely.

**Key Principles:**
- Travel pace is chosen by the group for journeys that take hours or days
- The pace affects skill checks related to perception, survival, and stealth
- Standard travel assumes 8 hours of movement per day
- Extended travel beyond 8 hours risks exhaustion
- Terrain and environmental conditions can limit available paces

## The Three Standard Paces

### Slow Pace

**Distance:** 200 feet/minute, 2 miles/hour, 18 miles/day

**Game Effects:**
- **Advantage** on Wisdom (Perception or Survival) checks
- **No penalty** to Dexterity (Stealth) checks
- Allows careful, observant movement

**When to Use:**
- Traveling through dangerous or unfamiliar territory
- When searching for something or following tracks
- When stealth is important
- When any party member's Speed is reduced to half or less

**JSON File:** `slow.json`

### Normal Pace

**Distance:** 300 feet/minute, 3 miles/hour, 24 miles/day

**Game Effects:**
- **Disadvantage** on Dexterity (Stealth) checks
- No modifier to Wisdom (Perception or Survival) checks
- Default, balanced pace for most situations

**When to Use:**
- Standard overland travel
- Following established roads or trails
- Traveling through relatively safe areas
- When no special circumstances apply

**JSON File:** `normal.json`

### Fast Pace

**Distance:** 400 feet/minute, 4 miles/hour, 30 miles/day

**Game Effects:**
- **Disadvantage** on Wisdom (Perception or Survival) checks
- **Disadvantage** on Dexterity (Stealth) checks
- Covers maximum distance but with reduced awareness

**When to Use:**
- Time-sensitive missions or deadlines
- Fleeing from pursuers
- Well-maintained roads when speed is critical
- Flying or when special movement ignores terrain

**JSON File:** `fast.json`

### Trade-offs Summary

| Pace   | Distance/Hour | Perception/Survival | Stealth      | Best For                |
|--------|---------------|---------------------|--------------|-------------------------|
| Slow   | 2 miles       | Advantage          | Normal       | Caution & Stealth       |
| Normal | 3 miles       | Normal             | Disadvantage | Balanced Travel         |
| Fast   | 4 miles       | Disadvantage       | Disadvantage | Speed Over Awareness    |

## Movement Calculations

### Basic Formula

Travel pace is based on a creature's Speed statistic:
- **Per Minute:** Speed × 10 (for Normal pace: 30 feet × 10 = 300 feet)
- **Per Hour:** Speed in feet ÷ 10 = miles (30 feet Speed = 3 mph)
- **Per Day:** Miles per hour × 8 hours (3 mph × 8 = 24 miles)

### Pace Multipliers

Starting from Normal pace (Speed × 10 per minute):
- **Slow Pace:** Normal × 2/3 (round down)
- **Normal Pace:** Base calculation (Speed × 10/minute)
- **Fast Pace:** Normal × 1⅓ (round down)

### Special/Magical Movement

For creatures with enhanced speed (spells, magic items, flying):

1. **Miles per hour** = Speed ÷ 10
2. **Miles per day (Normal)** = Miles per hour × hours traveled (typically 8)
3. **Fast pace** = Miles per day × 1⅓ (round down)
4. **Slow pace** = Miles per day × 2/3 (round down)

**Example:** A *Phantom Steed* spell grants 100 feet Speed
- Miles per hour: 100 ÷ 10 = 10 mph
- Normal pace (8 hours): 10 × 8 = 80 miles/day
- Fast pace: 80 × 1.33 = 106 miles/day (round down)
- Slow pace: 80 × 0.67 = 53 miles/day (round down)

### Mounted Travel

Mounts can move at **twice the listed distance for 1 hour**, after which they require a Short or Long Rest before they can sustain that increased pace again.

**Example:** Riding a horse at Normal pace
- Standard: 3 miles/hour
- Galloping: 6 miles for the first hour
- Then requires rest or drops to normal pace

## Special Movement Types

### Climbing

**Cost:** Each foot of climbing costs **1 extra foot** of movement (2 extra feet in Difficult Terrain)
- A creature with Climb Speed ignores this extra cost
- Slippery surfaces may require DC 15 Strength (Athletics) check

**Impact on Travel:** Climbing significantly reduces travel pace, potentially forcing Slow pace or slower.

### Swimming

**Cost:** Each foot of swimming costs **1 extra foot** of movement (2 extra feet in Difficult Terrain)
- A creature with Swim Speed ignores this extra cost
- Rough water may require DC 15 Strength (Athletics) check

**Impact on Travel:** Like climbing, swimming halves effective movement speed.

### Crawling

**Cost:** Each foot of crawling costs **1 extra foot** of movement (2 extra feet in Difficult Terrain)

**Impact on Travel:** Rarely used for extended travel, but important for navigating low spaces.

### Flying

**Benefits:**
- Can ignore ground-based Difficult Terrain
- Can move at Fast pace regardless of terrain below
- Uses Fly Speed instead of walking Speed for calculations

**Limitations:**
- Still subject to exhaustion from extended travel
- Weather conditions may affect flight
- Altitude considerations (high altitude doubles travel time for exhaustion purposes)

## Difficult Terrain

**Core Rule:** Every foot of movement in Difficult Terrain costs **1 extra foot** (effectively halving movement speed).

**Examples of Difficult Terrain:**
- Heavy snow, ice, rubble, or undergrowth
- Liquid between shin and waist deep
- Furniture sized for your size or larger
- Narrow openings sized for creatures one size smaller
- Slopes of 20 degrees or more
- Other creatures (non-Tiny, non-allies) in a space

**Impact on Travel Pace:**
- Difficult Terrain effectively halves travel speed
- May force the party to use Slow pace or even slower
- Some terrain types specifically limit maximum pace (see Travel Terrain table)
- Not cumulative - a space is either Difficult Terrain or it isn't

**Bypassing Difficult Terrain:**
- Creatures with appropriate special speeds (Climb, Swim, Burrow, Fly)
- Magical effects that ignore terrain
- Flying characters can ignore ground-based difficult terrain

## Forced March & Exhaustion

**JSON File:** `forced-march.json`

### Basic Mechanics

Characters can travel for more than 8 hours per day by pushing themselves, at the risk of exhaustion.

**Extended Travel Procedure:**
1. After 8 hours of travel, characters may continue
2. At the end of each additional hour beyond 8, each character makes a Constitution saving throw
3. **DC = 10 + hours past 8**
   - Hour 9: DC 11
   - Hour 10: DC 12
   - Hour 11: DC 13
   - Hour 12: DC 14
   - And so on...
4. On a failed save, the character gains **1 level of Exhaustion**

### Exhaustion Mechanics

Exhaustion is a **cumulative condition** with severe consequences.

**Effects per Exhaustion Level:**
- **Level 1:** D20 Tests -2, Speed -5 feet
- **Level 2:** D20 Tests -4, Speed -10 feet
- **Level 3:** D20 Tests -6, Speed -15 feet
- **Level 4:** D20 Tests -8, Speed -20 feet
- **Level 5:** D20 Tests -10, Speed -25 feet
- **Level 6:** **Death**

**Recovery:**
- Finishing a **Long Rest removes 1 level** of Exhaustion
- When Exhaustion level reaches 0, the condition ends
- Recovery is slow - multiple days needed for severe exhaustion

### Strategic Considerations

**Risk Assessment:**
- Each additional hour increases DC by 1
- Constitution modifier heavily influences how long a character can push
- Failed saves accumulate - multiple failures can quickly become dangerous
- Exhaustion affects combat effectiveness if encounters occur

**When to Risk Forced March:**
- Time-critical missions worth the risk
- Party has high Constitution scores
- Short-term emergencies (1-2 extra hours)
- Approaching safe rest locations

**When to Avoid:**
- Expecting combat soon
- Low Constitution party members
- Extended periods (3+ extra hours)
- Already carrying exhaustion levels
- Difficult environmental conditions

### Special Circumstances

**High Altitude (10,000+ feet):**
- Each hour of travel counts as **2 hours** for exhaustion purposes
- Characters can acclimate after 30 days at that elevation
- Cannot acclimate above 20,000 feet (unless native to such environments)

**Mounted Travel:**
- Mounts have their own limitations
- May not be able to sustain extended travel
- Exhausted mounts may force the party to stop

## Terrain & Environmental Effects

### Travel Terrain Table

Different terrain types limit the maximum pace available:

| Terrain    | Max Pace | Notes                                      |
|------------|----------|--------------------------------------------|
| Arctic     | Normal*  | *Fast pace requires skis or similar equipment |
| Coastal    | Normal   |                                            |
| Desert     | Normal   |                                            |
| Forest     | Normal   |                                            |
| Grassland  | Fast     |                                            |
| Hills      | Normal   |                                            |
| Mountain   | Slow     |                                            |
| Swamp      | Slow     |                                            |
| Underdark  | Normal   |                                            |
| Urban      | Normal   |                                            |
| Waterborne | Special  | Depends on vessel speed                    |

### Environmental Modifiers

**Good Roads:**
- Increase maximum pace by **one step**
- Slow → Normal
- Normal → Fast

**Slower Travelers:**
- Group must use **Slow pace** if any member's Speed is reduced to **half or less** of normal
- Ensures group stays together

**High Altitude:**
- 10,000+ feet: Each hour counts as 2 hours for forced march purposes
- Requires 30 days to acclimate
- Cannot acclimate above 20,000 feet

**Weather Effects:**
- Heavy rain/snow: May create Lightly Obscured areas, Disadvantage on Perception
- Extreme weather: May impose Difficult Terrain or limit pace
- Slippery ice: Difficult Terrain

## JSON Structure

All travel pace JSON files follow this standardized structure:

```json
{
  "id": "travel-pace-{type}",
  "name": "Pace Name",
  "description": "Detailed description of the pace",
  "movement": {
    "speedMultiplier": 1.0,
    "perMinute": 300,
    "perHour": 3,
    "perDay": 24,
    "unit": "feet (minute) / miles (hour, day)"
  },
  "effects": {
    "advantageOn": ["List of checks with advantage"],
    "disadvantageOn": ["List of checks with disadvantage"],
    "stealthPossible": true/false,
    "mechanicalEffects": ["List of specific game effects"]
  },
  "restrictions": ["List of limitations or requirements"],
  "terrain": {
    "note": "Terrain-related information",
    "difficultTerrain": "How difficult terrain affects this pace"
  },
  "calculations": {
    "formula": "Mathematical formulas for calculating distance"
  },
  "srdReference": "path/to/primary/srd/source.md",
  "additionalReferences": ["array", "of", "related", "files"],
  "examples": ["Practical usage examples"],
  "integration": {
    "foundryVTT": {
      "automation": "How this can be automated",
      "tracking": "What should be tracked"
    },
    "relatedSystems": ["related-system-ids"]
  }
}
```

### Field Descriptions

**Core Fields:**
- `id`: Unique identifier for the pace type
- `name`: Display name
- `description`: Comprehensive explanation of when and why to use this pace

**Movement:**
- `speedMultiplier`: Relative to Normal pace (0.67, 1.0, 1.33)
- `perMinute`: Feet traveled per minute
- `perHour`: Miles traveled per hour
- `perDay`: Miles traveled in 8-hour day
- `unit`: Measurement units

**Effects:**
- `advantageOn`: Skill checks receiving Advantage
- `disadvantageOn`: Skill checks receiving Disadvantage
- `stealthPossible`: Whether stealth is viable at this pace
- `mechanicalEffects`: Specific game rule impacts

**Additional Fields:**
- `restrictions`: Conditions that prevent or require this pace
- `terrain`: How terrain affects this pace
- `calculations`: Formulas for distance computation
- `examples`: Practical scenarios for using this pace
- `integration`: FoundryVTT automation and related systems

## Integration with FoundryVTT

### Automation Capabilities

**Travel Time Calculator:**
- Input distance and pace to calculate travel time
- Automatic adjustment for terrain and conditions
- Track hours traveled and trigger forced march saves

**Skill Check Automation:**
- Automatically apply Advantage/Disadvantage based on chosen pace
- Perception checks for random encounters
- Survival checks for navigation
- Stealth checks for avoiding detection

**Exhaustion Tracking:**
- Monitor hours traveled
- Trigger Constitution saves at appropriate DCs
- Apply exhaustion penalties to character sheets
- Track recovery through Long Rests

**Journey Journal:**
- Record travel segments with pace used
- Log encounters and events during travel
- Calculate total distance covered
- Track exhaustion gained and recovered

### Related Systems Integration

**Travel Mode:**
- Integrates with travel activity selections
- Characters can perform activities while traveling
- Activities may be limited by travel pace

**Combat Encounters:**
- Initiative modifiers based on awareness (pace-dependent)
- Surprise mechanics influenced by Perception/Stealth
- Exhaustion penalties applied to combat rolls

**Resource Management:**
- Food and water consumption
- Spell slot usage during travel
- Hit Point recovery during rests

## Usage Examples

### Example 1: Standard Journey

**Scenario:** Party travels 72 miles on a well-maintained road
- **Chosen Pace:** Normal (3 mph)
- **Travel Time:** 72 ÷ 3 = 24 hours = 3 days of 8-hour travel
- **Effects:** Disadvantage on Stealth checks during travel
- **Activities:** Can perform travel activities like navigation, foraging (some with disadvantage based on pace)

### Example 2: Forced March

**Scenario:** Party must reach a city 40 miles away in one day
- **Chosen Pace:** Fast (4 mph)
- **Standard 8 Hours:** 32 miles covered
- **Need 2 More Hours:** 8 additional miles
- **Hour 9:** DC 11 Constitution save
- **Hour 10:** DC 12 Constitution save
- **Effects:** Disadvantage on Perception, Survival, and Stealth; plus exhaustion risk

### Example 3: Stealthy Approach

**Scenario:** Infiltrating enemy territory, 12 miles to sneak through
- **Chosen Pace:** Slow (2 mph)
- **Travel Time:** 12 ÷ 2 = 6 hours
- **Effects:** Advantage on Perception and Survival, no Stealth penalty
- **Tactics:** Can spot ambushes and avoid patrols effectively

### Example 4: Mountain Crossing

**Scenario:** Crossing 15 miles of mountain terrain
- **Terrain Max:** Slow pace only
- **Chosen Pace:** Slow (2 mph)
- **Base Time:** 15 ÷ 2 = 7.5 hours
- **Difficult Terrain:** Halves movement (doubles time to 15 hours)
- **Result:** Requires 2 days with forced march, or plan 2-day journey

### Example 5: Magical Flight

**Scenario:** Wizard casts *Fly* (60 ft Speed) to scout ahead for 1 hour
- **Miles per Hour:** 60 ÷ 10 = 6 mph
- **Fast Pace (allowed while flying):** 6 × 1.33 = 8 miles in 1 hour
- **Effects:** Can ignore ground Difficult Terrain, but still has Disadvantage on Perception

## SRD References

### Primary Sources

**Core Travel Rules:**
- `data/5e/srd/split/playingthegame/06-Exploration.md`
  - Basic travel pace mechanics
  - Three standard paces and their effects
  - Distance tables

**Extended Travel Rules:**
- `data/5e/srd/split/gameplaytoolbox/00-TravelPace.md`
  - Good roads modifier
  - Slower travelers rule
  - Extended travel (forced march) mechanics
  - Special movement calculations
  - Vehicle rules

### Supporting Rules

**Movement Mechanics:**
- `data/5e/srd/split/rulesglossary/rulesdefinitions/129-Speed.md` - Speed definition
- `data/5e/srd/split/rulesglossary/rulesdefinitions/28-Climbing.md` - Climbing movement
- `data/5e/srd/split/rulesglossary/rulesdefinitions/141-Swimming.md` - Swimming movement
- `data/5e/srd/split/rulesglossary/rulesdefinitions/34-Crawling.md` - Crawling movement
- `data/5e/srd/split/rulesglossary/rulesdefinitions/66-Flying.md` - Flying movement

**Conditions & Hazards:**
- `data/5e/srd/split/rulesglossary/rulesdefinitions/62-ExhaustionCondition.md` - Exhaustion mechanics
- `data/5e/srd/split/rulesglossary/rulesdefinitions/53-DifficultTerrain.md` - Difficult Terrain rules

**Environmental Effects:**
- `data/5e/srd/split/gameplaytoolbox/03-EnvironmentalEffects.md` - High altitude, weather effects

### Related JSON Files

This travel pace system integrates with:
- **Travel Activities:** Actions characters can perform while traveling
- **Travel Mode:** Overall journey management system
- **Exploration Activities:** Search, Navigate, Scout, etc.
- **Environmental Conditions:** Weather, terrain, hazards

---

## File Manifest

This directory contains the following JSON definition files:

1. **slow.json** - Slow travel pace (2 mph, Advantage on Perception/Survival)
2. **normal.json** - Normal travel pace (3 mph, balanced approach)
3. **fast.json** - Fast travel pace (4 mph, Disadvantage on awareness checks)
4. **forced-march.json** - Extended travel beyond 8 hours with exhaustion mechanics
5. **README.md** - This comprehensive documentation file

---

## Version Information

- **SRD Version:** 5.2.1
- **Source:** D&D 5th Edition System Reference Document
- **JSON Schema Version:** 1.0
- **Last Updated:** 2025-11-20

---

## License

This content is based on the D&D 5th Edition System Reference Document 5.2.1, which is released under the Creative Commons Attribution 4.0 International License.

---

## Contributing

When updating or extending these definitions:

1. Ensure all mechanics are sourced from official SRD documents
2. Maintain consistent JSON structure across all pace files
3. Update this README to reflect any structural changes
4. Include specific SRD file references for all rules
5. Test JSON validity before committing
6. Consider FoundryVTT integration implications

---

## Future Enhancements

Potential additions to this system:

- **Vehicle pace definitions** (wagon, ship, airship speeds)
- **Terrain-specific pace modifiers** (separate JSON per terrain type)
- **Weather effect modifiers** (rain, snow, wind impact on pace)
- **Party composition impacts** (size categories, encumbrance)
- **Magical travel methods** (teleportation, dimension door, etc.)
- **Chase mechanics integration** (pursuit and escape rules)
- **Overland travel encounter tables** (keyed to pace and terrain)
