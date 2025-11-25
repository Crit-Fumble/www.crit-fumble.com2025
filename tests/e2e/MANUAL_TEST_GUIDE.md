# Manual Foundry Dual System Test Guide

Since the full E2E test requires DigitalOcean API access and proper environment setup, here's a manual testing guide to validate both D&D 5e and Cypher System adapters.

## Prerequisites

1. **Foundry VTT** installed locally or accessible instance
2. **Game Systems** installed:
   - D&D 5e (official dnd5e system)
   - Cypher System (mrkwnzl's cyphersystem)
3. **Modules** installed:
   - foundry-core-concepts
   - foundry-core-concepts-api
   - foundry-cfg-5e
   - foundry-cfg-cypher

## Test D&D 5e Adapter

### 1. Create D&D 5e World

1. Launch Foundry VTT
2. Click "Create World"
3. Name: "Test 5e World"
4. Game System: "Dungeons & Dragons Fifth Edition"
5. Click "Create World"

### 2. Enable Modules

1. In the world, open Settings → Manage Modules
2. Enable:
   - ✅ Core Concepts
   - ✅ Core Concepts API
   - ✅ CFG 5e Bridge
3. Click "Save Module Settings"
4. Reload if prompted

### 3. Verify Adapter

Open browser console (F12) and run:

```javascript
// Check if adapter exists
console.log('5e Adapter:', game.cfg5e?.adapter);

// Verify it's registered with Core Concepts
console.log('Registered:', game.coreConcepts?.systems?.getAdapter('dnd5e'));

// Expected output:
// 5e Adapter: DnD5eAdapter { ... }
// Registered: DnD5eAdapter { ... }
```

### 4. Test Actor Creation

1. Create a new Actor (Character)
2. Name: "Test Fighter"
3. Set basic stats

In console:

```javascript
// Get the actor
const actor = game.actors.getName('Test Fighter');

// Test adapter mapping
const creatureData = game.cfg5e.adapter.mapActorToCreature(actor);
console.log('Mapped Creature:', creatureData);

// Expected: Should have name, class, level, stats, etc.
```

## Test Cypher System Adapter

### 1. Create Cypher System World

1. Return to Setup
2. Click "Create World"
3. Name: "Test Cypher World"
4. Game System: "Cypher System"
5. Click "Create World"

### 2. Enable Modules

1. Settings → Manage Modules
2. Enable:
   - ✅ Core Concepts
   - ✅ Core Concepts API
   - ✅ CFG Cypher Bridge
3. Click "Save Module Settings"
4. Reload if prompted

### 3. Verify Adapter

Open browser console (F12) and run:

```javascript
// Check if adapter exists
console.log('Cypher Adapter:', game.cfgCypher?.adapter);

// Verify it's registered with Core Concepts
console.log('Registered:', game.coreConcepts?.systems?.getAdapter('cyphersystem'));

// Expected output:
// Cypher Adapter: CypherSystemAdapter { ... }
// Registered: CypherSystemAdapter { ... }
```

### 4. Test CSRD Data Loading

In console:

```javascript
// Get CSRD data
const descriptors = game.cfgCypher.getDescriptors();
const types = game.cfgCypher.getTypes();
const foci = game.cfgCypher.getFoci();

console.log('CSRD Data:');
console.log('- Descriptors:', descriptors.length);  // Should be 103
console.log('- Types:', types.length);               // Should be 4
console.log('- Foci:', foci.length);                 // Should be 142

// Test category filtering
const fantasyDescriptors = game.cfgCypher.getDescriptors('fantasy');
console.log('- Fantasy Descriptors:', fantasyDescriptors.length);

// Test TypesRegistry integration
const fromRegistry = game.coreConcepts.types.getByCategory('cypher-descriptor');
console.log('- From TypesRegistry:', fromRegistry.length);
```

### 5. Test Actor Creation

1. Create a new Actor (PC)
2. Name: "Test Nano"
3. Set descriptor, type, focus

In console:

```javascript
// Get the actor
const actor = game.actors.getName('Test Nano');

// Test adapter mapping
const creatureData = game.cfgCypher.adapter.mapActorToCreature(actor);
console.log('Mapped Creature:', creatureData);

// Expected: Should have descriptor, type, focus, tier, pools, etc.

// Test character sentence
const sentence = game.cfgCypher.buildSentence(
  actor.system.basic.descriptor,
  actor.system.basic.type,
  actor.system.basic.focus
);
console.log('Character Sentence:', sentence);
// Expected: "I am a [Descriptor] [Type] who [Focus]"
```

## Test Dual System Support

### 1. Both Adapters Registered

In **either** world, run:

```javascript
// Check both adapters are registered
const dnd5eAdapter = game.coreConcepts.systems.getAdapter('dnd5e');
const cypherAdapter = game.coreConcepts.systems.getAdapter('cyphersystem');

console.log('D&D 5e Adapter:', !!dnd5eAdapter);    // Should be true
console.log('Cypher Adapter:', !!cypherAdapter);    // Should be true
console.log('Dual System Support: ✅');
```

### 2. Platform API (if running locally)

Open terminal and run:

```bash
# Test systems endpoint
curl http://localhost:3000/api/foundry/systems \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

Expected response:

```json
{
  "supportedSystems": [
    {
      "id": "dnd5e",
      "name": "Dungeons & Dragons 5th Edition",
      ...
    },
    {
      "id": "cyphersystem",
      "name": "Cypher System",
      ...
    }
  ],
  "summary": {
    "totalSupported": 2,
    "dualSystemSupport": true,
    "targetDate": "2026-03-24"
  }
}
```

## Success Criteria

All checks pass if:

- ✅ D&D 5e world created successfully
- ✅ D&D 5e adapter registered and working
- ✅ D&D 5e actor maps correctly
- ✅ Cypher System world created successfully
- ✅ Cypher adapter registered and working
- ✅ CSRD data loaded (103 descriptors, 4 types, 142 foci)
- ✅ Cypher actor maps correctly
- ✅ Character sentence builder works
- ✅ Both adapters registered in Core Concepts
- ✅ Platform API recognizes both systems

## Troubleshooting

**"Module not found"**:
- Verify modules are in Foundry's `Data/modules/` directory
- Check module.json has correct ID

**"Adapter undefined"**:
- Check browser console for module load errors
- Verify Core Concepts loaded before bridge modules
- Check module dependencies

**"CSRD data empty"**:
- Verify OG-CSRD data is accessible
- Check network tab for failed data loads
- Review adapter initialization logs

**"No mapping function"**:
- Verify correct adapter version
- Check adapter implements required methods
- Review module compatibility

## CI/CD Testing

For automated testing, use the E2E test:

```bash
# Requires DigitalOcean API access
npm run test:e2e:foundry
```

See [README.md](./README.md) for E2E test setup and configuration.

## Next Steps

After manual verification:

1. Document any issues found
2. Update adapters if needed
3. Run full E2E test in CI/CD
4. Deploy to staging for integration testing
5. Prepare for March 2026 release

---

**March 2026 Release Status**: All adapters complete, ready for testing! 🎲✨
