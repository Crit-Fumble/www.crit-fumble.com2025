# Terminology Update: RPG Systems vs Game Mechanics

## Summary of Changes

We've clarified the terminology to distinguish between RPG game systems (D&D 5e, Cypher) and game mechanic subsystems (weather, travel, combat).

## Updated Terminology

### Database Models

| Model | Description | Examples |
|-------|-------------|----------|
| **RpgSystem** | Actual tabletop RPG game systems | D&D 5e, Cypher System, Pathfinder 2e, Call of Cthulhu |
| **RpgSubSystem** | Game mechanics within an RPG system | Weather, Travel, Combat, Crafting, Magic |

### Foundry VTT Modules

The Foundry modules in `src/modules/foundry-core-concepts` use "Systems" to refer to what we now call **RpgSubSystem** in the database.

**Mapping:**
- Foundry Module "System" (e.g., WeatherSystem) → Database **RpgSubSystem**
- These subsystems can be associated with specific **RpgSystem**s (e.g., "Weather for D&D 5e")

## Schema Details

### RpgSystem
```prisma
model RpgSystem {
  systemId    String  // 'dnd5e', 'cyphersystem', 'pf2e'
  name        String  // 'D&D 5e', 'Cypher System'
  title       String  // 'Dungeons & Dragons Fifth Edition'
  platforms   Json    // { "foundry": {...}, "roll20": {...} }
  subSystems  RpgSubSystem[] // Mechanics for this system
}
```

### RpgSubSystem
```prisma
model RpgSubSystem {
  name        String      // 'Weather System', 'Travel System'
  systemId    String      // Foreign key to RpgSystem
  system      RpgSystem   // Parent system (D&D 5e, Cypher, etc.)
  category    String      // 'environmental', 'exploration', etc.
}
```

## Migration Plan

1. ✅ Updated schema: RpgSystem now represents actual RPG systems
2. ✅ Removed FoundryGameSystem table (no longer needed)
3. ✅ Added `platforms` JSON field to RpgSystem for Foundry/Roll20 data
4. ⏳ Update Foundry modules to reference RpgSubSystem correctly
5. ⏳ Update documentation to use consistent terminology

## Action Items

### For Foundry Modules:
- The module code can continue using "System" terminology internally
- When syncing to database, map to `RpgSubSystem` table
- Reference the parent `RpgSystem` (e.g., link "Weather" to "dnd5e")

### For Core Application:
- Owner dashboard manages `RpgSystem` (D&D 5e, Cypher)
- Admin/GM interfaces manage `RpgSubSystem` (Weather, Travel, etc.)
- Platform-specific data stored in `RpgSystem.platforms` JSON

## Examples

### D&D 5e in the database:
```json
{
  "systemId": "dnd5e",
  "name": "D&D 5e",
  "title": "Dungeons & Dragons Fifth Edition",
  "platforms": {
    "foundry": {
      "manifestUrl": "https://github.com/foundryvtt/dnd5e/releases/latest/download/system.json",
      "version": "3.1.0",
      "download": "..."
    }
  },
  "subSystems": [
    { "name": "Weather System", "category": "environmental" },
    { "name": "Travel System", "category": "exploration" },
    { "name": "Combat System", "category": "tactical" }
  ]
}
```

### Cypher System in the database:
```json
{
  "systemId": "cyphersystem",
  "name": "Cypher System",
  "title": "Cypher System",
  "platforms": {
    "foundry": {
      "manifestUrl": "https://github.com/mrkwnzl/cyphersystem-foundryvtt/releases/latest/download/system.json",
      "version": "2.2.0",
      "download": "..."
    }
  },
  "subSystems": [
    { "name": "Cyphers & Artifacts", "category": "items" },
    { "name": "GM Intrusions", "category": "narrative" }
  ]
}
```
