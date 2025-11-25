/**
 * Generate Print Scale Specifications
 *
 * This script calculates accurate print dimensions for all VTT scales at 300 DPI
 * for physical tabletop play. Based on VTTImageScaleGuidelines.md.
 *
 * Run with: npx tsx scripts/generate-print-scales.ts
 */

const PRINT_DPI = 300; // Standard print resolution

interface DigitalScale {
  name: string;
  gridType: 'square' | 'hex' | 'voxel';
  tileSize: string; // e.g., "5ft", "0.1 mile"
  tileSizeInFeet: number; // Actual feet
  digitalWidth: number; // Digital pixels
  digitalHeight: number; // Digital pixels
  digitalPixelRatio: string; // e.g., "1 pixel = 1 inch"
  physicalInchPerGameUnit: number; // Physical inches per game unit (for printing)
}

const scales: DigitalScale[] = [
  {
    name: 'Arena',
    gridType: 'square',
    tileSize: '5ft',
    tileSizeInFeet: 5,
    digitalWidth: 60,
    digitalHeight: 60,
    digitalPixelRatio: '1 pixel = 1 inch',
    physicalInchPerGameUnit: 1 / 5, // 1 inch = 5 feet (standard mini scale)
  },
  {
    name: 'Building',
    gridType: 'square',
    tileSize: '10ft',
    tileSizeInFeet: 10,
    digitalWidth: 30,
    digitalHeight: 30,
    digitalPixelRatio: '1 pixel = 4 inches',
    physicalInchPerGameUnit: 1 / 10, // 1 inch = 10 feet
  },
  {
    name: 'Settlement',
    gridType: 'hex',
    tileSize: '30ft',
    tileSizeInFeet: 30,
    digitalWidth: 34,
    digitalHeight: 30,
    digitalPixelRatio: '1 pixel = 1 foot',
    physicalInchPerGameUnit: 1 / 30, // 1 inch = 30 feet (tile size)
  },
  {
    name: 'County',
    gridType: 'hex',
    tileSize: '0.1 mile',
    tileSizeInFeet: 528, // 0.1 mile = 528 feet
    digitalWidth: 610,
    digitalHeight: 528,
    digitalPixelRatio: '1 pixel = 1 foot',
    physicalInchPerGameUnit: 1 / 528, // 1 inch = 0.1 mile = 528 feet (tile size)
  },
  {
    name: 'Province',
    gridType: 'hex',
    tileSize: '1 mile',
    tileSizeInFeet: 5280, // 1 mile = 5,280 feet
    digitalWidth: 610,
    digitalHeight: 528,
    digitalPixelRatio: '1 pixel = 10 feet',
    physicalInchPerGameUnit: 1 / 5280, // 1 inch = 1 mile = 5,280 feet (tile size)
  },
  {
    name: 'Kingdom',
    gridType: 'hex',
    tileSize: '6 miles',
    tileSizeInFeet: 31680, // 6 miles = 31,680 feet
    digitalWidth: 610,
    digitalHeight: 528,
    digitalPixelRatio: '1 pixel = 60 feet',
    physicalInchPerGameUnit: 1 / 31680, // 1 inch = 6 miles = 31,680 feet (tile size)
  },
  {
    name: 'Continent',
    gridType: 'hex',
    tileSize: '60 miles',
    tileSizeInFeet: 316800, // 60 miles = 316,800 feet
    digitalWidth: 610,
    digitalHeight: 528,
    digitalPixelRatio: '1 pixel = 600 feet',
    physicalInchPerGameUnit: 1 / 316800, // 1 inch = 60 miles = 316,800 feet (tile size)
  },
  {
    name: 'Realm',
    gridType: 'voxel',
    tileSize: '100 miles',
    tileSizeInFeet: 528000, // 100 miles = 528,000 feet
    digitalWidth: 0, // Variable (voxel rendering)
    digitalHeight: 0,
    digitalPixelRatio: '1 pixel = 0.1 mile',
    physicalInchPerGameUnit: 1 / 528000, // 1 inch = 100 miles (tile size)
  },
];

interface PrintScale {
  name: string;
  gridType: string;
  tileSize: string;
  tileSizeInFeet: number;

  // Digital specs
  digitalWidth: number;
  digitalHeight: number;
  digitalPixelRatio: string;

  // Print specs
  printWidth: number; // Pixels at 300 DPI
  printHeight: number; // Pixels at 300 DPI
  physicalWidth: number; // Physical inches
  physicalHeight: number; // Physical inches
  physicalDiameter?: number; // For hex grids
  printScale: string; // e.g., "1 inch = 5 feet"

  // Recommendations
  printableSize: string; // e.g., "Fits on 8.5x11 paper"
  recommendedUse: string;
}

function calculatePrintScale(digital: DigitalScale): PrintScale {
  // Calculate physical size in inches
  const physicalWidth = digital.tileSizeInFeet * digital.physicalInchPerGameUnit;
  const physicalHeight = digital.tileSizeInFeet * digital.physicalInchPerGameUnit;

  // Calculate print pixels (physical inches * 300 DPI)
  const printWidth = Math.round(physicalWidth * PRINT_DPI);
  const printHeight = Math.round(physicalHeight * PRINT_DPI);

  // For hex grids, calculate diameter
  let physicalDiameter: number | undefined;
  if (digital.gridType === 'hex') {
    physicalDiameter = physicalWidth; // Hex width ≈ diameter
  }

  // Generate print scale description
  const gameUnitsPerInch = 1 / digital.physicalInchPerGameUnit;
  let printScale: string;
  if (gameUnitsPerInch >= 5280) {
    const miles = gameUnitsPerInch / 5280;
    printScale = `1 inch = ${miles} mile${miles > 1 ? 's' : ''}`;
  } else {
    printScale = `1 inch = ${gameUnitsPerInch} feet`;
  }

  // Determine if it fits on standard paper
  let printableSize: string;
  if (physicalWidth <= 8 && physicalHeight <= 10) {
    printableSize = 'Fits on letter paper (8.5x11")';
  } else if (physicalWidth <= 11 && physicalHeight <= 16) {
    printableSize = 'Fits on tabloid paper (11x17")';
  } else if (physicalWidth <= 24 && physicalHeight <= 36) {
    printableSize = 'Requires poster printing (24x36")';
  } else {
    printableSize = 'Requires large format printing';
  }

  // Recommendations
  let recommendedUse: string;
  if (digital.name === 'Arena' || digital.name === 'Building') {
    recommendedUse = 'Print for miniature play on table';
  } else if (digital.name === 'Settlement') {
    recommendedUse = 'Print for town exploration with minis';
  } else {
    recommendedUse = 'Print for reference or wall display';
  }

  return {
    name: digital.name,
    gridType: digital.gridType,
    tileSize: digital.tileSize,
    tileSizeInFeet: digital.tileSizeInFeet,
    digitalWidth: digital.digitalWidth,
    digitalHeight: digital.digitalHeight,
    digitalPixelRatio: digital.digitalPixelRatio,
    printWidth,
    printHeight,
    physicalWidth: Math.round(physicalWidth * 100) / 100, // Round to 2 decimals
    physicalHeight: Math.round(physicalHeight * 100) / 100,
    physicalDiameter: physicalDiameter ? Math.round(physicalDiameter * 100) / 100 : undefined,
    printScale,
    printableSize,
    recommendedUse,
  };
}

// Generate all scales
console.log('='.repeat(80));
console.log('VTT PRINT SCALE SPECIFICATIONS @ 300 DPI');
console.log('Generated from VTTImageScaleGuidelines.md');
console.log('='.repeat(80));
console.log('');

const printScales = scales.map(calculatePrintScale);

printScales.forEach((scale, index) => {
  console.log(`${index + 1}. ${scale.name.toUpperCase()} SCALE (${scale.gridType})`);
  console.log('-'.repeat(80));
  console.log(`Tile Size: ${scale.tileSize} (${scale.tileSizeInFeet.toLocaleString()} feet)`);
  console.log('');

  console.log('DIGITAL (Screen Display):');
  console.log(`  Dimensions: ${scale.digitalWidth} x ${scale.digitalHeight} pixels`);
  console.log(`  Pixel Ratio: ${scale.digitalPixelRatio}`);
  console.log('');

  console.log('PRINT (300 DPI for Physical Tabletop):');
  console.log(`  Print Pixels: ${scale.printWidth.toLocaleString()} x ${scale.printHeight.toLocaleString()} pixels`);
  console.log(`  Physical Size: ${scale.physicalWidth}" x ${scale.physicalHeight}"`);
  if (scale.physicalDiameter) {
    console.log(`  Hex Diameter: ~${scale.physicalDiameter}" (flat-to-flat)`);
  }
  console.log(`  Print Scale: ${scale.printScale}`);
  console.log(`  Printability: ${scale.printableSize}`);
  console.log(`  Use Case: ${scale.recommendedUse}`);
  console.log('');
});

// Generate TypeScript constants
console.log('='.repeat(80));
console.log('TYPESCRIPT CONSTANTS (for src/lib/constants/vtt-scales.ts)');
console.log('='.repeat(80));
console.log('');

console.log('export const PRINT_DPI = 300;');
console.log('');
console.log('export const PRINT_SCALES = {');
printScales.forEach((scale, index) => {
  const key = scale.name.toUpperCase();
  console.log(`  ${key}: {`);
  console.log(`    name: '${scale.name}',`);
  console.log(`    gridType: '${scale.gridType}',`);
  console.log(`    tileSize: '${scale.tileSize}',`);
  console.log(`    tileSizeInFeet: ${scale.tileSizeInFeet},`);
  console.log(`    digital: {`);
  console.log(`      width: ${scale.digitalWidth},`);
  console.log(`      height: ${scale.digitalHeight},`);
  console.log(`      pixelRatio: '${scale.digitalPixelRatio}',`);
  console.log(`    },`);
  console.log(`    print: {`);
  console.log(`      width: ${scale.printWidth}, // pixels @ 300 DPI`);
  console.log(`      height: ${scale.printHeight}, // pixels @ 300 DPI`);
  console.log(`      physicalWidth: ${scale.physicalWidth}, // inches`);
  console.log(`      physicalHeight: ${scale.physicalHeight}, // inches`);
  if (scale.physicalDiameter) {
    console.log(`      physicalDiameter: ${scale.physicalDiameter}, // inches (hex)`);
  }
  console.log(`      scale: '${scale.printScale}',`);
  console.log(`    },`);
  console.log(`  },${index < printScales.length - 1 ? '' : ''}`);
});
console.log('} as const;');
console.log('');

// Generate summary table
console.log('='.repeat(80));
console.log('QUICK REFERENCE TABLE');
console.log('='.repeat(80));
console.log('');
console.log('Scale        | Tile Size | Physical Size | Print Pixels      | Paper Size');
console.log('-------------|-----------|---------------|-------------------|------------------');
printScales.forEach((scale) => {
  const name = scale.name.padEnd(12);
  const tile = scale.tileSize.padEnd(9);
  const physical = `${scale.physicalWidth}"x${scale.physicalHeight}"`.padEnd(13);
  const pixels = `${scale.printWidth}x${scale.printHeight}`.padEnd(17);
  const paper = scale.printableSize.split('(')[0].trim();
  console.log(`${name} | ${tile} | ${physical} | ${pixels} | ${paper}`);
});
console.log('');

console.log('='.repeat(80));
console.log('Formula used:');
console.log('  printPixels = physicalInches * 300 DPI');
console.log('  physicalInches = tileSizeInFeet * (inches per game foot)');
console.log('  ');
console.log('Examples:');
console.log('  Arena: 5ft * (1"/5ft) = 1" physical → 1" * 300 DPI = 300px per foot');
console.log('  Building: 10ft * (1"/10ft) = 1" physical → 1" * 300 DPI = 300px per foot');
console.log('  County: 528ft * (1"/100ft) = 5.28" → 5.28" * 300 DPI = 1,584px per 0.1mi');
console.log('='.repeat(80));
