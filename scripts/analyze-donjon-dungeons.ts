#!/usr/bin/env tsx
/**
 * Analyze donjon dungeon JSON files to catalog needed tiles and cards
 *
 * Donjon dungeons use bit flags to represent cells:
 * - Each space is 10×10×10 (2×2×2 tiles in our system)
 * - Cell values are bitmasks combining multiple flags
 *
 * Run with: npx tsx scripts/analyze-donjon-dungeons.ts
 */

import { readdir, readFile } from 'fs/promises'
import path from 'path'

const DONJON_DIR = path.join(process.cwd(), 'public', 'donjon-examples')

interface DonjonBits {
  nothing: number
  block: number
  room: number
  corridor: number
  perimeter: number
  aperture: number
  arch: number
  door: number
  locked: number
  trapped: number
  secret: number
  portcullis: number
  stair_up: number
  stair_down: number
  label: number
  room_id: number
}

interface DonjonDungeon {
  cell_bit: DonjonBits
  cells: number[][]
  rooms: any[]
  corridor_features: Record<string, any>
  details: {
    floor: string
    walls: string
    illumination: string
    temperature: string
  }
  settings: {
    n_cols: number
    n_rows: number
    name: string
  }
}

// Inventory of needed tiles/cards
const inventory = {
  tiles: {
    floors: new Set<string>(),
    walls: new Set<string>(),
    doors: new Set<string>(),
    stairs: new Set<string>(),
    special: new Set<string>()
  },
  cards: {
    rooms: new Map<string, number>(),  // shape -> count
    corridors: new Map<string, number>(), // type -> count
    doors: new Map<string, number>(),  // type -> count
    features: new Set<string>()
  },
  stats: {
    totalCells: 0,
    totalRooms: 0,
    totalCorridors: 0,
    totalDoors: 0
  }
}

function parseDonjonCell(value: number, bits: DonjonBits): {
  type: 'nothing' | 'block' | 'room' | 'corridor'
  hasWall: boolean
  hasDoor: boolean
  doorType?: string
  hasStairs?: string
  roomId?: number
} {
  if (value === bits.nothing) {
    return { type: 'nothing', hasWall: false, hasDoor: false }
  }

  const result: any = {
    hasWall: false,
    hasDoor: false
  }

  // Check basic type
  if (value & bits.block) {
    result.type = 'block'
    result.hasWall = true
  } else if (value & bits.corridor) {
    result.type = 'corridor'
  } else if (value & bits.room) {
    result.type = 'room'
  }

  // Check for perimeter (walls)
  if (value & bits.perimeter) {
    result.hasWall = true
  }

  // Check for doors
  if (value & bits.door) {
    result.hasDoor = true
    result.doorType = 'door'
  }
  if (value & bits.arch) {
    result.hasDoor = true
    result.doorType = 'arch'
  }
  if (value & bits.portcullis) {
    result.hasDoor = true
    result.doorType = 'portcullis'
  }
  if (value & bits.locked) {
    result.doorType = 'locked'
  }
  if (value & bits.trapped) {
    result.doorType = 'trapped'
  }
  if (value & bits.secret) {
    result.doorType = 'secret'
  }

  // Check for stairs
  if (value & bits.stair_up) {
    result.hasStairs = 'up'
  }
  if (value & bits.stair_down) {
    result.hasStairs = 'down'
  }

  // Get room ID
  if (value & bits.room_id) {
    result.roomId = (value & bits.room_id) >> 16
  }

  return result
}

async function analyzeDungeon(filePath: string) {
  console.log(`\nAnalyzing: ${path.basename(filePath)}`)
  console.log('='.repeat(60))

  const content = await readFile(filePath, 'utf-8')
  const dungeon: DonjonDungeon = JSON.parse(content)

  const { cells, cell_bit, rooms, details, settings } = dungeon

  console.log(`Size: ${settings.n_cols}×${settings.n_rows} (${settings.n_cols * 2}×${settings.n_rows * 2} tiles)`)
  console.log(`Rooms: ${rooms.length - 1}`) // rooms[0] is null
  console.log(`Floor: ${details.floor}`)
  console.log(`Walls: ${details.walls}`)
  console.log(`Illumination: ${details.illumination}\n`)

  // Track floor and wall types
  inventory.tiles.floors.add(details.floor)
  inventory.tiles.walls.add(details.walls)

  // Analyze cells
  let roomCells = 0
  let corridorCells = 0
  let doorCells = 0
  let wallCells = 0

  for (let row = 0; row < cells.length; row++) {
    for (let col = 0; col < cells[row].length; col++) {
      const value = cells[row][col]
      if (value === 0) continue

      inventory.stats.totalCells++

      const cell = parseDonjonCell(value, cell_bit)

      if (cell.type === 'room') {
        roomCells++
      } else if (cell.type === 'corridor') {
        corridorCells++
      } else if (cell.type === 'block') {
        wallCells++
      }

      if (cell.hasDoor && cell.doorType) {
        doorCells++
        const count = inventory.cards.doors.get(cell.doorType) || 0
        inventory.cards.doors.set(cell.doorType, count + 1)
      }

      if (cell.hasStairs) {
        inventory.tiles.stairs.add(cell.hasStairs)
      }
    }
  }

  console.log(`Cell Breakdown:`)
  console.log(`  Room cells: ${roomCells}`)
  console.log(`  Corridor cells: ${corridorCells}`)
  console.log(`  Wall cells: ${wallCells}`)
  console.log(`  Door cells: ${doorCells}`)

  // Analyze rooms
  inventory.stats.totalRooms += rooms.length - 1

  for (let i = 1; i < rooms.length; i++) {
    const room = rooms[i]
    if (!room) continue

    const shape = room.shape || 'square'
    const count = inventory.cards.rooms.get(shape) || 0
    inventory.cards.rooms.set(shape, count + 1)

    // Track room features
    if (room.contents?.detail?.trap) {
      inventory.cards.features.add('trap')
    }
    if (room.contents?.detail?.monster) {
      inventory.cards.features.add('monster')
    }
    if (room.contents?.detail?.hidden_treasure) {
      inventory.cards.features.add('hidden_treasure')
    }
  }

  inventory.stats.totalCorridors += corridorCells
  inventory.stats.totalDoors += doorCells
}

async function main() {
  console.log('=====================================')
  console.log('Donjon Dungeon Analysis')
  console.log('=====================================')

  // Find all JSON files
  const subdirs = await readdir(DONJON_DIR)

  for (const subdir of subdirs) {
    const subdirPath = path.join(DONJON_DIR, subdir)
    try {
      const files = await readdir(subdirPath)
      const jsonFiles = files.filter(f => f.endsWith('.json') && !f.includes('Edited'))

      for (const jsonFile of jsonFiles) {
        const filePath = path.join(subdirPath, jsonFile)
        await analyzeDungeon(filePath)
      }
    } catch (err) {
      // Skip non-directories
      continue
    }
  }

  // Print summary
  console.log('\n\n')
  console.log('=====================================')
  console.log('INVENTORY SUMMARY')
  console.log('=====================================\n')

  console.log('FLOOR TYPES NEEDED:')
  inventory.tiles.floors.forEach(floor => {
    console.log(`  - ${floor}`)
  })

  console.log('\nWALL TYPES NEEDED:')
  inventory.tiles.walls.forEach(wall => {
    console.log(`  - ${wall}`)
  })

  console.log('\nDOOR TYPES NEEDED:')
  const doorTypes = Array.from(inventory.cards.doors.entries())
    .sort((a, b) => b[1] - a[1])
  doorTypes.forEach(([type, count]) => {
    console.log(`  - ${type}: ${count} instances`)
  })

  console.log('\nSTAIR TYPES NEEDED:')
  inventory.tiles.stairs.forEach(stairs => {
    console.log(`  - stairs_${stairs}`)
  })

  console.log('\nROOM SHAPES:')
  const roomShapes = Array.from(inventory.cards.rooms.entries())
    .sort((a, b) => b[1] - a[1])
  roomShapes.forEach(([shape, count]) => {
    console.log(`  - ${shape}: ${count} rooms`)
  })

  console.log('\nFEATURES:')
  inventory.cards.features.forEach(feature => {
    console.log(`  - ${feature}`)
  })

  console.log('\n\nSTATISTICS:')
  console.log(`  Total cells analyzed: ${inventory.stats.totalCells}`)
  console.log(`  Total rooms: ${inventory.stats.totalRooms}`)
  console.log(`  Total corridor cells: ${inventory.stats.totalCorridors}`)
  console.log(`  Total door instances: ${inventory.stats.totalDoors}`)

  console.log('\n\nCONVERSION REQUIREMENTS:')
  console.log('  Donjon Cell (10×10 ft) = 2×2×2 VTT Tiles (5×5 ft)')
  console.log('  Donjon Cell (10×10 ft) = 1 VTT Card (10×10 ft)')
  console.log(`  Total VTT Cards needed: ~${inventory.stats.totalCells}`)
  console.log(`  Total VTT Tiles needed: ~${inventory.stats.totalCells * 8} (2×2×2 per card)`)

  console.log('\n\nTILE ASSET REQUIREMENTS:')
  console.log('  Each floor/wall type needs:')
  console.log('    - Floor tiles: 32px source → 60px VTT tiles')
  console.log('    - Wall tiles: 32px source → 60px VTT tiles (bottom, middle, top)')
  console.log('    - Door tiles: Need LARGER images (doors span full cell height)')
  console.log('  ')
  console.log('  IMPORTANT: Doors in donjon are 10ft tall (full cell height)')
  console.log('             Our 60px tiles are 5ft, so doors need to be UPSCALED')
  console.log('             to 120px height (2 tiles high) or use larger source assets')
}

main()
  .catch(error => {
    console.error('Error:', error)
    process.exit(1)
  })
