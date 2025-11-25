# Item Organization System for foundry-core-srd-5e

## Overview

This document defines the comprehensive item organization system based on:
- D&D 5e 2024 SRD official structure
- 5etools canonical 22 item types
- Official 9 magic item categories
- Mount-creature relationship model

## Directory Structure

```
packs/items/
├── equipment/          # Base Armor
│   ├── light/         # Light Armor (LA)
│   ├── medium/        # Medium Armor (MA)
│   ├── heavy/         # Heavy Armor (HA)
│   └── shield/        # Shields (S)
│
├── weapon/            # Base Weapons
│   ├── melee/         # Melee Weapons (M)
│   ├── ranged/        # Ranged Weapons (R)
│   └── ammunition/    # Ammunition (A)
│
├── tool/              # Tools
│   ├── artisan/       # Artisan's Tools (AT)
│   ├── gaming/        # Gaming Sets (GS)
│   ├── musical/       # Instruments (INS)
│   └── other/         # Other Tools (T)
│
├── gear/              # Adventuring Gear & Purchasables
│   ├── adventuring/   # Adventuring Gear (G)
│   ├── spellcasting/  # Spellcasting Foci (SCF)
│   ├── tack/          # Tack and Harness (TAH)
│   ├── mount/         # Mounts (MNT) - with creature references
│   ├── vehicle/       # Vehicles (VEH, SHP, AIR)
│   └── treasure/      # Coinage ($C)
│
├── consumable/        # Consumable Items
│   ├── potion/        # Potions (P) - non-magic
│   ├── scroll/        # Scrolls (SC) - non-magic
│   └── food/          # Food and Drink (FD)
│
└── magic/             # Magic Items (9 Official Categories)
    ├── armor/         # Magic Armor (+1 Leather, +1 Shield, etc)
    ├── potion/        # Magic Potions (Potion of Healing, etc)
    ├── ring/          # Rings (Ring of Invisibility, etc)
    ├── rod/           # Rods (Immovable Rod, etc)
    ├── scroll/        # Magic Scrolls (Spell Scroll, etc)
    ├── staff/         # Staffs (Staff of Striking, etc)
    ├── wand/          # Wands (Wand of Fireballs, etc)
    ├── weapon/        # Magic Weapons (+1 Longsword, +1 Ammunition, etc)
    └── wondrous/      # Wondrous Items (Bag of Holding, Boots of Elvenkind, etc)
```

## 22 Canonical Item Types from 5etools

| Code | Type | Description | Directory |
|------|------|-------------|-----------|
| **Weapons** |
| M | Melee Weapon | Clubs, swords, axes | `weapon/melee/` |
| R | Ranged Weapon | Bows, crossbows | `weapon/ranged/` |
| A | Ammunition | Arrows, bolts, sling bullets | `weapon/ammunition/` |
| **Armor** |
| LA | Light Armor | Padded, leather, studded leather | `equipment/light/` |
| MA | Medium Armor | Hide, chain shirt, scale mail | `equipment/medium/` |
| HA | Heavy Armor | Ring mail, chain mail, plate | `equipment/heavy/` |
| S | Shield | Shields | `equipment/shield/` |
| **Tools** |
| AT | Artisan's Tools | Smith's tools, carpenter's tools | `tool/artisan/` |
| GS | Gaming Set | Dice set, playing card set | `tool/gaming/` |
| T | Tool | Thieves' tools, navigator's tools | `tool/other/` |
| INS | Instrument | Lute, drum, flute | `tool/musical/` |
| **Gear** |
| G | Adventuring Gear | Rope, torches, backpacks | `gear/adventuring/` |
| SCF | Spellcasting Focus | Arcane, druidic, holy symbol | `gear/spellcasting/` |
| TAH | Tack and Harness | Saddle, bit and bridle | `gear/tack/` |
| **Consumables** |
| P | Potion | Alchemist's fire, antitoxin | `consumable/potion/` |
| SC | Scroll | Non-magical scrolls | `consumable/scroll/` |
| FD | Food and Drink | Rations, ale, bread | `consumable/food/` |
| **Vehicles/Mounts** |
| MNT | Mount | Horses, camels, elephants | `gear/mount/` |
| VEH | Vehicle (Land) | Carts, chariots, carriages | `gear/vehicle/` |
| SHP | Vehicle (Water) | Rowboat, galley, warship | `gear/vehicle/` |
| AIR | Vehicle (Air) | Airships | `gear/vehicle/` |
| **Treasure** |
| $C | Treasure (Coinage) | Copper, silver, gold pieces | `gear/treasure/` |

## Magic Item Categories (Official SRD)

The 9 official magic item categories from p204 of the SRD:

### 1. Armor
Magic versions of base armor. **Must reference `baseItem`**.
- Examples: +1 Leather Armor, +1 Shield, Arrow-Catching Shield
- Reference format: `flags['foundry-core-srd-5e']._srdData.baseItem: "shield|xphb"`
- Directory: `magic/armor/`

### 2. Potions
Magical brews or oils. Consumable (Bonus Action to drink).
- Examples: Potion of Healing, Oil of Slipperiness
- Directory: `magic/potion/`

### 3. Rings
Must be worn on finger or similar digit.
- Examples: Ring of Invisibility, Ring of Protection
- Directory: `magic/ring/`

### 4. Rods
Scepters (metal, wood, bone). Can be used as Arcane Focus.
- Examples: Immovable Rod, Rod of Alertness
- Directory: `magic/rod/`

### 5. Scrolls
Consumable parchments. Most common is Spell Scroll.
- Examples: Spell Scroll
- Directory: `magic/scroll/`

### 6. Staffs
Walking stick/cane. Can be used as Quarterstaff and Arcane Focus.
- Examples: Staff of Striking, Staff of the Python
- Directory: `magic/staff/`

### 7. Wands
12-15 inches. Can be used as Arcane Focus.
- Examples: Wand of Fireballs, Wand of Magic Detection
- Directory: `magic/wand/`

### 8. Weapons
Magic versions of base weapons. **Must reference `baseItem`**.
- Examples: +1 Longsword, Flame Tongue, +1 Ammunition
- Reference format: `flags['foundry-core-srd-5e']._srdData.baseItem: "longsword|xphb"`
- Directory: `magic/weapon/`
- Note: Ammunition from magic weapons is considered magical

### 9. Wondrous Items
Everything else! Wearables, bags, figurines, instruments.
- Examples: Bag of Holding, Boots of Elvenkind, Belt of Giant Strength
- **Most need base items**: Bag, Belt, Boots, Bracers, Cloak, Gloves, etc.
- Directory: `magic/wondrous/`

## Mount-Creature Relationship

Mounts are BOTH purchasable items AND creatures with stat blocks.

### Mount Item Properties
Stored in `gear/mount/`:
- name: "Riding Horse"
- type: "MNT|XPHB"
- value: 7500 (in copper pieces)
- carryingCapacity: 480
- speed: 60

### Creature Stat Block
Stored in separate bestiary system:
- name: "Riding Horse" (EXACT MATCH)
- type: "beast"
- size: "L"
- AC: 11
- HP: 13 (2d10+2)
- abilities: STR 16, DEX 13, CON 12, INT 2, WIS 11, CHA 7
- actions: Hooves attack
- CR: 1/4

### Linking Strategy
Mount items reference creatures by **exact name match**. When creating mount items:
1. Use exact creature name from bestiary
2. Add purchasable properties (price, speed, capacity)
3. Creature stat block provides combat stats

## Base Item References for Magic Items

All magic items that are "magical versions" of base items MUST include:

```json
{
  "flags": {
    "foundry-core-srd-5e": {
      "_srdData": {
        "baseItem": "item-name|source",
        "type": "TYPE|SOURCE",
        "rarity": "uncommon"
      }
    }
  }
}
```

### Examples

**Arrow-Catching Shield:**
```json
{
  "name": "Arrow-Catching Shield",
  "flags": {
    "foundry-core-srd-5e": {
      "_srdData": {
        "baseItem": "shield|xphb",
        "type": "S|XPHB",
        "rarity": "rare"
      }
    }
  }
}
```

**+1 Longsword:**
```json
{
  "name": "Longsword +1",
  "flags": {
    "foundry-core-srd-5e": {
      "_srdData": {
        "baseItem": "longsword|xphb",
        "type": "M|XPHB",
        "rarity": "uncommon"
      }
    }
  }
}
```

### Base Items Needed

The following base items are frequently referenced:
- **Armor**: All armor types + Shield
- **Weapons**: All weapon types
- **Wondrous**: Bag, Belt, Boots, Bracers, Cloak, Gloves, Helm, Amulet, Cape, Circlet, Brooch

These base items should exist in their respective base directories:
- `equipment/shield/shield.json`
- `weapon/melee/longsword.json`
- `gear/adventuring/bag.json`
- etc.

## Rarity Levels

Items are categorized by rarity within their category directories:

- **common** - Mundane, non-magical base items
- **uncommon** - Lesser magic items
- **rare** - Moderate magic items
- **very rare** - Greater magic items
- **legendary** - Extremely powerful items
- **artifact** - Unique items of immense power

## Item Type Detection Priority

When categorizing an item, check in this order:

1. **Check `_srdData.baseItem`** - If present and references armor/shield/weapon, it's magic
2. **Check rarity** - If not "common", likely magic
3. **Check type code** - Use 22 canonical types from 5etools
4. **Check name patterns** - "+1", "of", etc. indicate magic
5. **Fallback** - Default to closest matching category

## Implementation Notes

### Organizing Existing Items

1. **Flatten all nested directories** to root
2. **Read item JSON** to determine:
   - `flags['foundry-core-srd-5e']._srdData.baseItem`
   - `flags['foundry-core-srd-5e']._srdData.type` (5etools type code)
   - `system.rarity`
   - `type` (Foundry type: weapon, equipment, loot, consumable, tool)
   - `name` (for pattern matching)
3. **Map to directory** using decision tree
4. **Create nested directory** if needed
5. **Move file** to appropriate location

### Creating Base Items

For each magic item with `baseItem` reference:
1. Extract base item name from reference
2. Check if base item exists in appropriate directory
3. If missing, create base item with:
   - `rarity: "common"`
   - Appropriate Foundry `type`
   - Matching name from `baseItem` field

### Mount Items

When creating mount items:
1. Find creature in bestiary by exact name
2. Create item in `gear/mount/` with:
   - Same name as creature
   - Purchase price (from SRD Equipment p100)
   - Speed (from creature stat block)
   - Carrying capacity (from SRD or creature STR)
3. Add reference to creature stat block in item properties

## Sources

- SRD 5e 2024: Equipment (p89-103), Magic Items (p204-254)
- 5etools data: `items-base.json`, `items.json`
- Foundry VTT item types: weapon, equipment, loot, consumable, tool
