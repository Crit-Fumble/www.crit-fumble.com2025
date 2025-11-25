# Facility System for foundry-core-srd-5e

## Overview

Facilities are **functional features** within locations that provide specific benefits to creatures. This document defines the facility system based on **SRD gameplay mechanics** for:

- **Resting** (Short Rest, Long Rest)
- **Environmental Protection** (warmth, shelter, food, water)
- **Services** (healing, shopping, storage, transportation)
- **Activities** (crafting, research, training, entertainment)

Facilities integrate with the [Tile-Based Location System](./TILE-LOCATION-SYSTEM.md) and leverage SRD rules for resting, environmental hazards, and lifestyle expenses.

---

## Design Philosophy

**SRD-Based**: All facilities provide benefits defined by SRD rules:
- Resting requirements (Short Rest, Long Rest)
- Environmental hazard mitigation
- Lifestyle expenses and services
- Activity downtime requirements

**Location Integration**: Facilities are tied to specific tiles/features within locations and can be tracked as part of the location data.

**Extensible**: The cfg-5e module can add advanced facility features (automation, scripting, progression).

---

## Facility Schema

### Base Facility Structure

```typescript
interface Facility {
  id: string;                    // Unique identifier
  name: string;
  type: FacilityType;
  description: string;

  // Location
  locationId?: string;           // UUID of parent location
  tileCol?: number;              // Tile column
  tileRow?: number;              // Tile row
  tileCols?: number[];           // Multiple tiles (arrays)
  tileRows?: number[];

  // Benefits
  benefits: FacilityBenefit[];
  preventedHazards?: EnvironmentalHazard[];

  // Capacity
  capacity?: number;             // Max creatures that can use

  // Requirements
  requirements?: FacilityRequirement[];

  // Cost
  cost?: {
    amount: number;              // In copper pieces
    period: 'use' | 'hour' | 'day' | 'week' | 'month';
  };

  // Availability
  available: boolean;            // Currently usable
  gmOnly?: boolean;              // Hidden from players
}

type FacilityType =
  | 'warmth'         // Campfire, hearth, brazier
  | 'shelter'        // Tent, building, cave
  | 'food'           // Kitchen, mess hall, provisions
  | 'water'          // Well, stream, cistern
  | 'rest'           // Bed, bedroll, chair
  | 'healing'        // Temple, herbalist, doctor
  | 'storage'        // Chest, warehouse, vault
  | 'shop'           // General store, specialty shop
  | 'crafting'       // Forge, workshop, laboratory
  | 'transport'      // Stable, dock, teleportation circle
  | 'entertainment'  // Tavern common room, theater, arena
  | 'security'       // Watch post, guard tower, alarm
  | 'research'       // Library, scriptorium, observatory
  | 'training'       // Dojo, range, academy
  | 'ritual'         // Altar, shrine, circle
  | 'utility';       // Multi-purpose or custom

type FacilityBenefit =
  | 'warmth'              // Prevents Extreme Cold
  | 'shelter'             // Prevents Heavy Precipitation
  | 'light'               // Illumination
  | 'cooking'             // Food preparation
  | 'clean_water'         // Potable water source
  | 'comfortable_rest'    // Long Rest quality
  | 'secure_rest'         // Safe from interruption
  | 'healing'             // HP/condition recovery
  | 'item_storage'        // Secure item keeping
  | 'item_purchase'       // Buy items
  | 'item_sale'           // Sell items
  | 'item_repair'         // Repair equipment
  | 'item_crafting'       // Create items
  | 'spell_services'      // Spellcasting services
  | 'mount_care'          // Animal care/stabling
  | 'boat_docking'        // Watercraft mooring
  | 'teleportation'       // Magical transportation
  | 'information'         // Research/lore access
  | 'training'            // Skill/proficiency advancement
  | 'entertainment'       // Morale/relaxation
  | 'security'            // Alertness/defense
  | 'privacy';            // Private space

interface FacilityRequirement {
  type: 'item' | 'gold' | 'skill' | 'spell' | 'time';
  value: string | number;
  description?: string;
}
```

---

## Standard Facility Types

### 1. Warmth Facilities

Provide heat and prevent **Extreme Cold** environmental hazard (SRD Gameplay Toolbox p195).

**Examples**:
- Campfire
- Fireplace/Hearth
- Brazier
- Magical Heat Source

**Benefits**: `warmth`, `light`, `cooking` (if open flame)

**SRD Rule**: Extreme Cold (≤0°F) requires DC 10 CON save per hour or gain Exhaustion. Warmth facilities negate this.

```json
{
  "id": "facility-campfire",
  "name": "Campfire",
  "type": "warmth",
  "description": "Open campfire providing warmth, light, and cooking",
  "benefits": ["warmth", "light", "cooking"],
  "preventedHazards": ["extreme_cold"],
  "requirements": [
    {"type": "item", "value": "wood", "description": "Requires fuel (wood, coal)"},
    {"type": "time", "value": 10, "description": "10 minutes to build and light"}
  ],
  "available": true
}
```

### 2. Shelter Facilities

Provide protection from elements, especially **Heavy Precipitation** (SRD Gameplay Toolbox p195).

**Examples**:
- Tent
- Building (inn, house, shop)
- Cave
- Magical Shelter (Tiny Hut, Rope Trick)

**Benefits**: `shelter`, `privacy`, `secure_rest` (if enclosed)

**SRD Rule**: Heavy Precipitation = Lightly Obscured + Disadvantage on Perception. Shelter negates.

```json
{
  "id": "facility-tent",
  "name": "Tent",
  "type": "shelter",
  "description": "Basic canvas tent providing shelter from rain and wind",
  "benefits": ["shelter", "privacy"],
  "preventedHazards": ["heavy_precipitation"],
  "capacity": 2,
  "requirements": [
    {"type": "item", "value": "tent", "description": "Requires tent equipment"},
    {"type": "time", "value": 30, "description": "30 minutes to set up"}
  ],
  "available": true
}
```

### 3. Food Facilities

Provide access to food (required for Long Rest and to prevent Exhaustion from starvation).

**Examples**:
- Kitchen (inn, house)
- Mess Hall (stronghold)
- Provisions (camp supplies)
- Hunting/Foraging Area

**Benefits**: `cooking`, `food_access`

**SRD Rule**: Characters need 1 pound food per day or risk Exhaustion (DM's discretion).

```json
{
  "id": "facility-inn-kitchen",
  "name": "Inn Kitchen",
  "type": "food",
  "description": "Full kitchen serving hot meals",
  "benefits": ["cooking", "food_access"],
  "capacity": 20,
  "cost": {"amount": 30, "period": "day"},
  "available": true
}
```

### 4. Water Facilities

Provide access to clean water (required for Long Rest and to prevent Exhaustion from dehydration).

**Examples**:
- Well
- Stream/River
- Cistern
- Waterskin (portable)

**Benefits**: `clean_water`

**SRD Rule**: Characters need 1 gallon water per day, 2 gallons in hot weather, or risk Exhaustion.

```json
{
  "id": "facility-village-well",
  "name": "Village Well",
  "type": "water",
  "description": "Community well with clean water",
  "benefits": ["clean_water"],
  "available": true
}
```

### 5. Rest Facilities

Provide comfortable resting for **Long Rest** (SRD Rules Glossary - Long Rest).

**Examples**:
- Bed (inn, house)
- Bedroll (camp)
- Chair/Bench (short rest)

**Benefits**: `comfortable_rest`, `secure_rest` (if in secured location)

**SRD Rule**: Long Rest = 8 hours (6 sleep + 2 light activity). Benefits: regain all HP, all HD, reduce Exhaustion by 1.

```json
{
  "id": "facility-inn-bed",
  "name": "Inn Bed (Private Room)",
  "type": "rest",
  "description": "Comfortable bed in private room",
  "benefits": ["comfortable_rest", "secure_rest", "privacy"],
  "capacity": 2,
  "cost": {"amount": 500, "period": "day"},
  "available": true
}
```

### 6. Healing Facilities

Provide healing services (HP restoration, disease/poison cure, resurrection).

**Examples**:
- Temple (cleric services)
- Herbalist (potions, medicine)
- Doctor/Surgeon
- Healing Fountain

**Benefits**: `healing`, `spell_services`

**SRD Service Costs** (from Lifestyle Expenses):
- Cure Wounds (1st): 10-50 gp
- Lesser Restoration: 40 gp
- Greater Restoration: 450 gp
- Raise Dead: 1,000 gp

```json
{
  "id": "facility-temple-healing",
  "name": "Temple Healing Services",
  "type": "healing",
  "description": "Cleric providing healing magic",
  "benefits": ["healing", "spell_services"],
  "cost": {"amount": 1000, "period": "use"},
  "available": true
}
```

### 7. Storage Facilities

Provide secure storage for items.

**Examples**:
- Chest/Locker
- Warehouse
- Bank Vault
- Bag of Holding (portable)

**Benefits**: `item_storage`, `security`

```json
{
  "id": "facility-inn-chest",
  "name": "Locked Chest (Inn Room)",
  "type": "storage",
  "description": "Locked chest in private room",
  "benefits": ["item_storage", "security"],
  "capacity": 50,
  "available": true
}
```

### 8. Shop Facilities

Provide item purchasing and selling.

**Examples**:
- General Store
- Weaponsmith/Armorer
- Magic Shop
- Market Stall

**Benefits**: `item_purchase`, `item_sale`, `item_repair` (if applicable)

**SRD Items**: Use equipment lists from SRD (weapons, armor, gear, etc.)

```json
{
  "id": "facility-general-store",
  "name": "General Store",
  "type": "shop",
  "description": "General goods and adventuring equipment",
  "benefits": ["item_purchase", "item_sale"],
  "available": true,
  "inventory": ["adventuring_gear", "tools", "basic_equipment"]
}
```

### 9. Crafting Facilities

Provide tools and space for crafting items.

**Examples**:
- Forge (blacksmith)
- Workshop (carpenter, leatherworker)
- Laboratory (alchemist)
- Enchanting Circle

**Benefits**: `item_crafting`, `item_repair`

**SRD Crafting**: Downtime activity (PHB - typically 8 hours/day, costs half item price in materials)

```json
{
  "id": "facility-forge",
  "name": "Blacksmith Forge",
  "type": "crafting",
  "description": "Full forge with anvil, tools, and materials",
  "benefits": ["item_crafting", "item_repair"],
  "cost": {"amount": 50, "period": "day"},
  "requirements": [
    {"type": "skill", "value": "smith's tools", "description": "Proficiency with smith's tools"}
  ],
  "available": true
}
```

### 10. Transport Facilities

Provide transportation services (mounts, boats, teleportation).

**Examples**:
- Stable (mount care)
- Dock (boat mooring)
- Teleportation Circle
- Portal

**Benefits**: `mount_care`, `boat_docking`, `teleportation`

```json
{
  "id": "facility-stable",
  "name": "Inn Stable",
  "type": "transport",
  "description": "Stable with hay, water, and grooming",
  "benefits": ["mount_care"],
  "capacity": 10,
  "cost": {"amount": 5, "period": "day"},
  "available": true
}
```

### 11. Entertainment Facilities

Provide morale boost and social interaction.

**Examples**:
- Tavern Common Room
- Theater
- Arena
- Gaming Hall

**Benefits**: `entertainment`, `information` (rumors/news)

```json
{
  "id": "facility-tavern-common-room",
  "name": "Tavern Common Room",
  "type": "entertainment",
  "description": "Lively common room with food, drink, and company",
  "benefits": ["entertainment", "information"],
  "capacity": 30,
  "available": true
}
```

### 12. Security Facilities

Provide security and alertness.

**Examples**:
- Watch Post
- Guard Tower
- Alarm System
- Fortifications

**Benefits**: `security`, `alertness`

**SRD Rule**: Standing watch is light activity (allowed during Long Rest).

```json
{
  "id": "facility-watch-post",
  "name": "Camp Watch Post",
  "type": "security",
  "description": "Elevated position for keeping watch",
  "benefits": ["security"],
  "available": true
}
```

### 13. Research Facilities

Provide access to knowledge and research.

**Examples**:
- Library
- Scriptorium
- Observatory
- Sage/Scholar

**Benefits**: `information`, `research`

```json
{
  "id": "facility-library",
  "name": "Temple Library",
  "type": "research",
  "description": "Extensive collection of books and scrolls",
  "benefits": ["information", "research"],
  "cost": {"amount": 10, "period": "day"},
  "available": true
}
```

### 14. Training Facilities

Provide space for practice and training.

**Examples**:
- Dojo/Training Hall
- Archery Range
- Academy
- Sparring Ring

**Benefits**: `training`

```json
{
  "id": "facility-training-hall",
  "name": "Fighter's Guild Training Hall",
  "type": "training",
  "description": "Practice area with weapons and dummies",
  "benefits": ["training"],
  "cost": {"amount": 20, "period": "day"},
  "available": true
}
```

### 15. Ritual Facilities

Provide space for magical or religious rituals.

**Examples**:
- Altar
- Shrine
- Magic Circle
- Sacred Grove

**Benefits**: `spell_services`, `ritual_space`

```json
{
  "id": "facility-temple-altar",
  "name": "Temple Altar",
  "type": "ritual",
  "description": "Sacred altar for religious ceremonies",
  "benefits": ["ritual_space", "spell_services"],
  "available": true
}
```

---

## Facility Combinations

Locations often have **multiple facilities** working together:

### Inn (Full Service)
- Food: Kitchen
- Water: Well
- Rest: Beds (multiple rooms)
- Warmth: Fireplaces
- Shelter: Building
- Storage: Chests (per room)
- Entertainment: Common Room
- Transport: Stable

### Campsite (Basic)
- Warmth: Campfire
- Shelter: Tents
- Rest: Bedrolls
- Security: Watch Post
- Food/Water: Provisions (carried items)

### Temple (Religious)
- Shelter: Building
- Warmth: Braziers
- Rest: Guest quarters
- Healing: Cleric services
- Ritual: Altar/Shrine
- Research: Religious library

### Stronghold (Fortified)
- Shelter: Castle
- Warmth: Many fireplaces
- Rest: Barracks/Quarters
- Food: Mess hall
- Water: Cistern/Well
- Storage: Armory/Vault
- Security: Guard towers/Walls
- Training: Courtyard
- Crafting: Forge/Workshop

---

## Integration with Location System

Facilities are stored in the `facilities` array within a [TileMap](./TILE-LOCATION-SYSTEM.md):

```json
{
  "id": "location-id",
  "name": "Location Name",
  "facilities": [
    {
      "id": "facility-1",
      "name": "Campfire",
      "type": "warmth",
      "benefits": ["warmth", "light", "cooking"],
      "preventedHazards": ["extreme_cold"],
      "tileCol": 2,
      "tileRow": 2
    },
    {
      "id": "facility-2",
      "name": "Tent",
      "type": "shelter",
      "benefits": ["shelter", "privacy"],
      "capacity": 2,
      "tileCol": 1,
      "tileRow": 2
    }
  ]
}
```

---

## SRD Rules Reference

### Resting
- **Short Rest** (SRD Rules Glossary): 1 hour, spend HD to heal, recharge some features
- **Long Rest** (SRD Rules Glossary): 8 hours (6 sleep + 2 light), regain all HP/HD, reduce Exhaustion

### Environmental Hazards (SRD Gameplay Toolbox)
- **Extreme Cold** (≤0°F): DC 10 CON/hour or Exhaustion
- **Extreme Heat** (≥100°F): DC 5+ CON/hour or Exhaustion (without water)
- **Heavy Precipitation**: Lightly Obscured, Disadvantage Perception

### Lifestyle Expenses (SRD PHB)
- **Squalid**: 1 sp/day
- **Poor**: 2 sp/day
- **Modest**: 1 gp/day
- **Comfortable**: 2 gp/day
- **Wealthy**: 4 gp/day
- **Aristocratic**: 10+ gp/day

---

## Implementation Notes

### For foundry-core-srd-5e Module

1. **Define TypeScript interfaces** for all facility types
2. **Document SRD rules** for each facility benefit
3. **Provide facility templates** for common location types
4. **NO automation** - cfg-5e handles benefit application

### For Future cfg-5e Module

1. **Automatic hazard mitigation** - Check facilities vs. environmental hazards
2. **Rest automation** - Apply Long/Short Rest benefits when at appropriate facilities
3. **Cost tracking** - Deduct gold for facility usage
4. **Availability management** - Track facility capacity and availability
5. **Scripted benefits** - Custom effects for unique facilities

---

## Example: Complete Inn Facilities

```json
{
  "id": "rusty-dragon-inn",
  "name": "The Rusty Dragon Inn",
  "facilities": [
    {
      "id": "fac-kitchen",
      "name": "Kitchen",
      "type": "food",
      "benefits": ["cooking", "food_access"],
      "capacity": 20,
      "cost": {"amount": 30, "period": "day"},
      "available": true
    },
    {
      "id": "fac-well",
      "name": "Well",
      "type": "water",
      "benefits": ["clean_water"],
      "available": true
    },
    {
      "id": "fac-common-room",
      "name": "Common Room",
      "type": "entertainment",
      "benefits": ["entertainment", "warmth", "light"],
      "capacity": 30,
      "available": true
    },
    {
      "id": "fac-private-rooms",
      "name": "Private Rooms (7 total)",
      "type": "rest",
      "benefits": ["comfortable_rest", "secure_rest", "privacy", "shelter"],
      "capacity": 14,
      "cost": {"amount": 500, "period": "day"},
      "available": true
    },
    {
      "id": "fac-common-beds",
      "name": "Common Room Beds",
      "type": "rest",
      "benefits": ["comfortable_rest", "shelter"],
      "capacity": 10,
      "cost": {"amount": 50, "period": "day"},
      "available": true
    },
    {
      "id": "fac-room-chests",
      "name": "Room Chests",
      "type": "storage",
      "benefits": ["item_storage", "security"],
      "capacity": 7,
      "available": true
    },
    {
      "id": "fac-stable",
      "name": "Stable",
      "type": "transport",
      "benefits": ["mount_care"],
      "capacity": 10,
      "cost": {"amount": 5, "period": "day"},
      "available": true
    }
  ]
}
```

---

## References

- [TILE-LOCATION-SYSTEM.md](./TILE-LOCATION-SYSTEM.md) - Tile-based location structure
- [SRD Rules Glossary - Short Rest](../../data/5e/srd/split/rulesglossary/rulesdefinitions/125-ShortRest.md)
- [SRD Rules Glossary - Long Rest](../../data/5e/srd/split/rulesglossary/rulesdefinitions/96-LongRest.md)
- [SRD Gameplay Toolbox - Environmental Effects](../../data/5e/srd/split/gameplaytoolbox/03-EnvironmentalEffects.md)
- [SRD Breaking Objects](../../data/5e/srd/split/rulesglossary/rulesdefinitions/18-BreakingObjects.md)
