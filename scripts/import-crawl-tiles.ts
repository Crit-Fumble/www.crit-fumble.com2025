#!/usr/bin/env tsx
/**
 * Import Dungeon Crawl Stone Soup tiles into RpgTile table
 * Run with: npx tsx scripts/import-crawl-tiles.ts
 */

import { PrismaClient } from '@prisma/client'
import { readdir, stat } from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

const SOURCE_DIR = path.join(process.cwd(), 'public', 'img', 'game', 'opengameart', 'crawl-tiles_Oct-5-2010')
const BASE_URL = '/img/game/opengameart/crawl-tiles_Oct-5-2010'

const SOURCE_SET = 'Dungeon Crawl Stone Soup'
const LICENSE = 'CC0-1.0'
const LICENSE_URL = 'https://creativecommons.org/publicdomain/zero/1.0/'
const ATTRIBUTION = 'Dungeon Crawl Stone Soup Team'
const ATTRIBUTION_URL = 'http://crawl.develz.org/'

interface TileToImport {
  name: string
  sourcePath: string
  url: string
  category: string
  tags: string[]
  terrainType?: string
  variation?: number
}

// Parse tile filename to extract metadata
function parseTileFilename(filename: string): { terrainType?: string; variation?: number; tags: string[] } {
  const tags: string[] = []
  let terrainType: string | undefined
  let variation: number | undefined

  // Extract terrain type from filename
  const terrainPatterns = [
    { pattern: /^brick_(\w+)(\d*)/, terrain: 'brick' },
    { pattern: /^stone_(\w+)(\d*)/, terrain: 'stone' },
    { pattern: /^dirt(\d*)/, terrain: 'dirt' },
    { pattern: /^grass(\d*)/, terrain: 'grass' },
    { pattern: /^cobble(\d*)/, terrain: 'cobble' },
    { pattern: /^crystal_(\w+)(\d*)/, terrain: 'crystal' },
    { pattern: /^pebble(\d*)/, terrain: 'pebble' },
    { pattern: /^grey_dirt(\d*)/, terrain: 'grey_dirt' },
    { pattern: /^floor_(\w+)(\d*)/, terrain: 'floor' },
    { pattern: /^wall_(\w+)(\d*)/, terrain: 'wall' },
  ]

  for (const { pattern, terrain } of terrainPatterns) {
    const match = filename.match(pattern)
    if (match) {
      terrainType = terrain
      const varNum = match[match.length - 1]
      if (varNum && /^\d+$/.test(varNum)) {
        variation = parseInt(varNum, 10)
        tags.push('variant')
      }
      break
    }
  }

  // Add tags based on filename patterns
  if (filename.includes('brick')) tags.push('brick')
  if (filename.includes('stone')) tags.push('stone')
  if (filename.includes('dirt')) tags.push('dirt')
  if (filename.includes('grass')) tags.push('grass')
  if (filename.includes('wood')) tags.push('wood')
  if (filename.includes('crystal')) tags.push('crystal')
  if (filename.includes('blood')) tags.push('blood')
  if (filename.includes('vines')) tags.push('vines')
  if (filename.includes('dark')) tags.push('dark')
  if (filename.includes('gray') || filename.includes('grey')) tags.push('gray')
  if (filename.includes('brown')) tags.push('brown')

  return { terrainType, variation, tags: [...new Set(tags)] }
}

async function scanDirectory(
  dirPath: string,
  relativeUrl: string,
  category: string
): Promise<TileToImport[]> {
  const tiles: TileToImport[] = []

  try {
    const entries = await readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)
      const relPath = path.join(relativeUrl, entry.name)

      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        const subTiles = await scanDirectory(fullPath, relPath, category)
        tiles.push(...subTiles)
      } else if (entry.isFile() && entry.name.endsWith('.png')) {
        const basename = entry.name.replace('.png', '')
        const { terrainType, variation, tags } = parseTileFilename(basename)

        tiles.push({
          name: basename,
          sourcePath: relPath,
          url: relPath.replace(/\\/g, '/'), // Normalize path separators
          category,
          tags,
          terrainType,
          variation,
        })
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not scan directory ${dirPath}:`, error)
  }

  return tiles
}

async function main() {
  console.log('Importing Dungeon Crawl Stone Soup tiles...\n')

  const categories = [
    { path: 'dc-dngn/floor', category: 'floor' },
    { path: 'dc-dngn/wall', category: 'wall' },
    { path: 'dc-dngn/altars', category: 'decoration' },
    { path: 'dc-dngn/gateways', category: 'decoration' },
    { path: 'dc-dngn/water', category: 'terrain' },
    { path: 'item', category: 'object' },
    { path: 'effect', category: 'effect' },
  ]

  let totalImported = 0

  for (const { path: categoryPath, category } of categories) {
    console.log(`Scanning: ${categoryPath}...`)

    const dirPath = path.join(SOURCE_DIR, categoryPath)
    const relativeUrl = `${BASE_URL}/${categoryPath}`

    const tiles = await scanDirectory(dirPath, relativeUrl, category)

    if (tiles.length === 0) {
      console.log(`  ⚠ No tiles found\n`)
      continue
    }

    console.log(`  Found: ${tiles.length} tiles`)

    // Import in batches
    const batchSize = 100
    for (let i = 0; i < tiles.length; i += batchSize) {
      const batch = tiles.slice(i, i + batchSize)

      await prisma.rpgTile.createMany({
        data: batch.map(tile => ({
          name: tile.name,
          sourceSet: SOURCE_SET,
          sourcePath: tile.sourcePath,
          sourceSize: 32,
          url: tile.url,
          category: tile.category,
          tags: tile.tags,
          terrainType: tile.terrainType,
          variation: tile.variation,
          license: LICENSE,
          licenseUrl: LICENSE_URL,
          attribution: ATTRIBUTION,
          attributionUrl: ATTRIBUTION_URL,
          isPublic: true,
        })),
        skipDuplicates: true,
      })
    }

    totalImported += tiles.length
    console.log(`  ✓ Imported: ${tiles.length} tiles\n`)
  }

  console.log('=====================================')
  console.log('Import Complete!')
  console.log('=====================================')
  console.log(`Total tiles imported: ${totalImported}`)
  console.log('')

  // Show summary stats
  const stats = await prisma.rpgTile.groupBy({
    by: ['category'],
    _count: true,
    orderBy: {
      category: 'asc',
    },
  })

  console.log('Database Summary:')
  for (const stat of stats) {
    console.log(`  ${stat.category}: ${stat._count} tiles`)
  }
  console.log('')

  console.log('Next steps:')
  console.log('  1. Review tiles: SELECT * FROM rpg_tiles LIMIT 10;')
  console.log('  2. Create 2x2 combinations for VTT use')
  console.log('  3. Generate TileAssets (60px and 600px versions)')
  console.log('')
}

main()
  .catch(error => {
    console.error('Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
