#!/usr/bin/env node
/**
 * Calculate Hex Coverage - How many smaller hexes fit into larger hexes
 *
 * This script calculates how many hexes of each scale fit within larger hexes,
 * helping us understand the relationships between Adventure and Travel scales.
 */

// Hex scales (real-world diameter in feet)
const HEX_SCALES = {
  '50ft': {
    name: '50 ft Tactical',
    diameter: 50,          // feet
    pixelScale: '1px=1ft',
    use: 'Tactical combat'
  },
  '300ft': {
    name: '300 ft Local',
    diameter: 300,         // feet
    pixelScale: '1px=1ft',
    use: 'Local area exploration'
  },
  '1mile': {
    name: '1-Mile Province',
    diameter: 5280,        // feet (1 mile)
    pixelScale: '1px=10ft',
    use: 'Province travel'
  },
  '6mile': {
    name: '6-Mile Kingdom',
    diameter: 31680,       // feet (6 miles)
    pixelScale: '1px=60ft',
    use: 'Kingdom travel'
  },
  '60mile': {
    name: '60-Mile Continent',
    diameter: 316800,      // feet (60 miles)
    pixelScale: '1px=600ft',
    use: 'Continent travel'
  },
  '600mile': {
    name: '600-Mile World',
    diameter: 3168000,     // feet (600 miles)
    pixelScale: '1px=6000ft',
    use: 'World travel'
  },
  '1000mile': {
    name: '1,000-Mile Universe (Mega Mile)',
    diameter: 5280000,     // feet (1,000 miles = 1 mega mile)
    pixelScale: '1px=10000ft',
    use: 'Universe travel, ship-to-ship combat, deity combat'
  },
  '1lightyear': {
    name: '1 Light Year Interstellar (Tera Mile)',
    diameter: 31039140000000,  // feet (1 light year = 5,878,625,000,000 miles × 5,280 ft/mile)
    pixelScale: '1px=50891000000ft',
    use: 'Interstellar travel, star systems, galaxy maps'
  },
  '6lightyear': {
    name: '6 Light Years Ultra (Ultra Mile)',
    diameter: 186234840000000,  // feet (6 light years = 35,271,750,000,000 miles)
    pixelScale: '1px=305346000000ft',
    use: 'Multi-star systems, local stellar neighborhood'
  },
  '60lightyear': {
    name: '60 Light Years Divine (Divine Mile)',
    diameter: 1862348400000000,  // feet (60 light years = 352,717,500,000,000 miles)
    pixelScale: '1px=3053460000000ft',
    use: 'Galactic regions, major deity domains, planetary gods'
  }
};

/**
 * Calculate approximate number of smaller hexes that fit in a larger hex
 * Uses area-based calculation (simplified)
 */
function calculateHexCoverage(smallerDiameter, largerDiameter) {
  // Hex area = (3 * sqrt(3) / 2) * r^2
  // where r = diameter / 2
  const sqrt3 = Math.sqrt(3);

  const smallerRadius = smallerDiameter / 2;
  const largerRadius = largerDiameter / 2;

  const smallerArea = (3 * sqrt3 / 2) * Math.pow(smallerRadius, 2);
  const largerArea = (3 * sqrt3 / 2) * Math.pow(largerRadius, 2);

  const coverage = largerArea / smallerArea;

  return {
    smallerArea: smallerArea.toFixed(2),
    largerArea: largerArea.toFixed(2),
    hexCount: Math.floor(coverage),
    exactCoverage: coverage.toFixed(2)
  };
}

console.log('═══════════════════════════════════════════════════════════');
console.log('  HEX COVERAGE CALCULATOR');
console.log('═══════════════════════════════════════════════════════════\n');

// Calculate all combinations
const scales = Object.keys(HEX_SCALES);

console.log('INDIVIDUAL HEX SCALES:\n');
scales.forEach(scale => {
  const hex = HEX_SCALES[scale];
  const diameterMiles = (hex.diameter / 5280).toFixed(3);
  console.log(`${hex.name}:`);
  console.log(`  Diameter: ${hex.diameter.toLocaleString()} feet (${diameterMiles} miles)`);
  console.log(`  Pixel Scale: ${hex.pixelScale}`);
  console.log(`  Use Case: ${hex.use}`);
  console.log('');
});

console.log('═══════════════════════════════════════════════════════════\n');
console.log('HEX COVERAGE MATRIX:\n');
console.log('How many smaller hexes fit into each larger hex?\n');

// Create coverage matrix
for (let i = 1; i < scales.length; i++) {
  const largerScale = scales[i];
  const largerHex = HEX_SCALES[largerScale];

  console.log(`${largerHex.name} (${(largerHex.diameter / 5280).toFixed(1)} miles) contains:`);
  console.log('─────────────────────────────────────────────────────────');

  for (let j = 0; j < i; j++) {
    const smallerScale = scales[j];
    const smallerHex = HEX_SCALES[smallerScale];

    const coverage = calculateHexCoverage(smallerHex.diameter, largerHex.diameter);

    console.log(`  → ${coverage.hexCount.toLocaleString()} × ${smallerHex.name}`);
    console.log(`     (exact: ${coverage.exactCoverage})`);
  }
  console.log('');
}

console.log('═══════════════════════════════════════════════════════════\n');
console.log('PROPOSED SCALE GROUPINGS:\n');

console.log('ADVENTURE SCALES (Local):');
console.log('  • 50 ft hexes  - Tactical outdoor combat');
console.log('  • 300 ft hexes - Local area exploration');
console.log('');

console.log('TRAVEL SCALES (Regional):');
console.log('  • 1-mile hexes   - Province travel (base)');
console.log('  • 10-mile hexes  - Kingdom travel');
console.log('  • 100-mile hexes - Continent travel (future)');
console.log('');

console.log('═══════════════════════════════════════════════════════════\n');
console.log('KEY RELATIONSHIPS:\n');

// Key relationships
const relationships = [
  { smaller: '50ft', larger: '300ft', label: '50 ft → 300 ft' },
  { smaller: '300ft', larger: '1mile', label: '300 ft → 1 mile' },
  { smaller: '1mile', larger: '6mile', label: '1 mile → 6 miles' },
  { smaller: '6mile', larger: '60mile', label: '6 miles → 60 miles' },
  { smaller: '60mile', larger: '600mile', label: '60 miles → 600 miles' },
  { smaller: '600mile', larger: '1000mile', label: '600 miles → 1,000 miles (mega mile)' },
  { smaller: '1000mile', larger: '1lightyear', label: '1,000 miles (mega mile) → 1 light year (tera mile)' },
  { smaller: '1lightyear', larger: '6lightyear', label: '1 light year (tera mile) → 6 light years (ultra mile)' },
  { smaller: '6lightyear', larger: '60lightyear', label: '6 light years (ultra mile) → 60 light years (divine mile)' }
];

relationships.forEach(rel => {
  const smaller = HEX_SCALES[rel.smaller];
  const larger = HEX_SCALES[rel.larger];
  const coverage = calculateHexCoverage(smaller.diameter, larger.diameter);

  console.log(`${rel.label}:`);
  console.log(`  ${coverage.hexCount} ${smaller.name} hexes ≈ 1 ${larger.name} hex`);
  console.log(`  Ratio: ~${coverage.exactCoverage}:1`);
  console.log('');
});

console.log('═══════════════════════════════════════════════════════════\n');
console.log('PRACTICAL EXAMPLES:\n');

// Adventure scale example
console.log('Example 1: Local town vicinity (300 ft hex)');
const town300 = calculateHexCoverage(50, 300);
console.log(`  Contains ~${town300.hexCount} tactical combat hexes (50 ft)`);
console.log(`  Coverage: ${town300.exactCoverage} hexes`);
console.log('');

// Province scale example
console.log('Example 2: Province region (1-mile hex)');
const province1mile_300 = calculateHexCoverage(300, 5280);
const province1mile_50 = calculateHexCoverage(50, 5280);
console.log(`  Contains ~${province1mile_300.hexCount} local area hexes (300 ft)`);
console.log(`  Contains ~${province1mile_50.hexCount} tactical hexes (50 ft)`);
console.log('');

// Kingdom scale example
console.log('Example 3: Kingdom region (6-mile hex)');
const kingdom6mile_1mile = calculateHexCoverage(5280, 31680);
const kingdom6mile_300 = calculateHexCoverage(300, 31680);
console.log(`  Contains ~${kingdom6mile_1mile.hexCount} province hexes (1 mile)`);
console.log(`  Contains ~${kingdom6mile_300.hexCount} local area hexes (300 ft)`);
console.log('');

// Continent scale example
console.log('Example 4: Continent region (60-mile hex)');
const continent60mile_6mile = calculateHexCoverage(31680, 316800);
const continent60mile_1mile = calculateHexCoverage(5280, 316800);
console.log(`  Contains ~${continent60mile_6mile.hexCount} kingdom hexes (6 miles)`);
console.log(`  Contains ~${continent60mile_1mile.hexCount} province hexes (1 mile)`);
console.log('');

console.log('═══════════════════════════════════════════════════════════\n');
console.log('RECOMMENDATIONS:\n');
console.log('');
console.log('1. ADVENTURE SCALES (for 5e adventures):');
console.log('   • 50 ft  - Outdoor encounters, small battlefields');
console.log('   • 300 ft - Adventure locations, dungeon exteriors');
console.log('   → Use for: Local exploration, tactical positioning');
console.log('');
console.log('2. TRAVEL SCALES (for overland travel):');
console.log('   • 1 mile    - Daily travel tracking, province maps');
console.log('   • 6 miles   - Kingdom-level maps, regional travel');
console.log('   • 60 miles  - Continental maps, large regions');
console.log('   • 600 miles - World maps, planetary scale');
console.log('   • 1,000 miles (MEGA MILE) - Universe scale, ship combat, lesser deity combat');
console.log('   • 1 light year (TERA MILE) - Interstellar travel, star systems, galaxy maps');
console.log('   • 6 light years (ULTRA MILE) - Multi-star systems, stellar neighborhoods');
console.log('   • 60 light years (DIVINE MILE) - Galactic regions, core pantheon deities, planetary gods');
console.log('   → Use for: Hex crawls, overland journeys, cosmic battles, interstellar exploration, deity domains');
console.log('');
console.log('3. SHEET ASSOCIATIONS:');
console.log('   • Adventure hexes (50ft, 300ft) → "Adventure" or "Location" sheets');
console.log('   • Travel hexes (1mi, 6mi, 60mi, 600mi, 1000mi, 1ly, 6ly, 60ly) → "Province", "Kingdom", "Continent", "World", "Universe", "Galaxy", "Cluster", "Pantheon" sheets');
console.log('');
console.log('4. COSMIC SCALE MULTIPLIERS (for when numbers get too big to roll):');
console.log('   • MEGA (×1,000)      - 1,000 miles = 1 mega mile');
console.log('     └─ Mega HP, Mega AC, Mega Damage for ship-to-ship combat, lesser deities');
console.log('   • TERA (×1,000,000)  - 1 light year = 1 tera mile ≈ 5.88 trillion miles');
console.log('     └─ Tera HP, Tera AC, Tera Damage for interstellar ships, cosmic entities');
console.log('   • ULTRA (×6,000,000) - 6 light years = 1 ultra mile ≈ 35.3 trillion miles');
console.log('     └─ Ultra HP, Ultra AC, Ultra Damage for multi-star systems, regional deities');
console.log('   • DIVINE (×60,000,000) - 60 light years = 1 divine mile ≈ 353 trillion miles');
console.log('     └─ Divine HP, Divine AC, Divine Damage for CORE PANTHEON DEITIES, planetary gods');
console.log('');
console.log('5. COSMIC EVENT IMPACTS:');
console.log('   • Worlds have HP and AC based on components (continents, oceans, atmosphere)');
console.log('   • Cosmic-level events update internal world sheets → affects weather, terrain, civilization');
console.log('   • Divine-scale combat between pantheon deities can reshape planets');
console.log('   • World damage propagates down: Continent sheets → Kingdom sheets → Province sheets → Location sheets');
console.log('');

console.log('═══════════════════════════════════════════════════════════');
