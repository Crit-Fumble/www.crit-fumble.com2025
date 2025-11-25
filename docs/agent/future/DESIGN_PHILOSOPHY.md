# Crit-Fumble VTT Architecture

System-agnostic TTRPG framework with modular design, adapted from TTRPG-Realms architecture.

## Core Philosophy

**Data-Driven Everything**: The dataset defines what's possible. The code adapts to the data, not the other way around.

**System-Agnostic Core**: Build once, use for any TTRPG system (5e, Pathfinder, Call of Cthulhu, etc.).

**Type-Safe Dynamic Structure**: Use `types` and `properties` to define system-specific data without hard-coding.

## Key Concepts from TTRPG-Realms

1. **Cards**: Generic containers for game content (spells, creatures, items, etc.)
2. **Sheets**: Templates for character/location/world data structures
3. **Systems**: Game rules and mechanics
4. **Types**: Define what kinds of cards/sheets exist
5. **Properties**: Define what fields each type has

## Type and Property System

### Dynamic Card Types

Instead of hard-coding card structures, define types with property schemas:

```json
{
  "type": "spells",
  "properties": [
    { "name": "level", "type": "number", "min": 0, "max": 9 },
    { "name": "school", "type": "string", "enum": ["evocation", "..."] },
    { "name": "castingTime", "type": "object" }
  ]
}
```

### Benefits

1. **System-Agnostic**: Works with any game system
2. **Self-Documenting**: Property definitions are the schema
3. **Validation-Ready**: Automatic validation from schemas
4. **Query-Friendly**: Filter by any property dynamically

## Directory Structure

```
data/
├── srd521/ (D&D 5e SRD - CC-BY-4.0)
│   ├── core/
│   │   ├── actions/
│   │   ├── activities/
│   │   └── systems/
│   ├── cards/
│   └── sheets/
└── cfg521/ (CFG5e Expansion - Proprietary)
    └── core/
        ├── systems/
        │   ├── scales.json
        │   ├── time-modes.json
        │   ├── behaviors/
        │   ├── pixels/
        │   └── facilities/
        └── actions/
```

## Next Steps

1. Define type schemas for existing JSON
2. Create validation scripts
3. Refactor JSON to use types/properties
4. Port DatasetLoader from TTRPG-Realms

## References

- TTRPG-Realms Architecture
- Database Design docs
