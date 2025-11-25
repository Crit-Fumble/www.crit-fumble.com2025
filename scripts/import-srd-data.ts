#!/usr/bin/env tsx
/**
 * Import SRD 5e dataset to database
 * Loads core game data from TTRPG-Realms-of-the-5th-system
 *
 * Run with: npx tsx scripts/import-srd-data.ts
 */

import { PrismaClient } from '@prisma/client'
import { readFile, readdir } from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

// Path to SRD dataset (relative to project root)
const SRD_PATH = path.join(
  process.cwd(),
  '..',
  'TTRPG-Realms-of-the-5th-system',
  'data',
  'datasets',
  'srd'
)

interface SRDIndex {
  name: string
  title: string
  description: string
  source: string
  version: string
  legal: {
    license: string
    licenseAbbreviation: string
    licenseUrl: string
    provider: string
    srdUrl: string
    attribution: string
    compatibilityStatement: string
    disclaimer: string
  }
  types: Array<{
    name: string
    title: string
    description: string
    file: string
  }>
}

interface CoreDataset {
  name: string
  title: string
  description: string
  source: string
  sources: any[]
  players: any[]
  rules: any[]
  modes: any[]
  flow: any
  core: any
  dice: any[]
  boards: any[]
  teams: any[]
  cards: any[]
  sheets: any[]
  events: any[]
  types: any[]
}

async function loadJSON<T>(filePath: string): Promise<T> {
  const content = await readFile(filePath, 'utf-8')
  return JSON.parse(content)
}

async function importSRDIndex() {
  console.log('Loading SRD index...\n')

  const indexPath = path.join(SRD_PATH, 'index.json')
  const index = await loadJSON<SRDIndex>(indexPath)

  console.log(`Dataset: ${index.title}`)
  console.log(`Version: ${index.version}`)
  console.log(`License: ${index.legal.license}\n`)

  // Create main SRD expansion entry
  const srdExpansion = await prisma.rpgExpansion.upsert({
    where: { name: index.name },
    update: {
      title: index.title,
      description: index.description,
      version: index.version,
      type: 'core',
      sourceType: 'srd',
      sourceUrl: index.legal.srdUrl,
      license: index.legal.licenseAbbreviation,
      licenseUrl: index.legal.licenseUrl,
      provider: index.legal.provider,
      attribution: index.legal.attribution,
      compatibilityStmt: index.legal.compatibilityStatement,
      isPremium: false, // SRD is free
      isPublic: true,
      isActive: true,
      datasetPath: SRD_PATH,
      metadata: {
        disclaimer: index.legal.disclaimer,
        types: index.types
      }
    },
    create: {
      name: index.name,
      title: index.title,
      description: index.description,
      version: index.version,
      type: 'core',
      sourceType: 'srd',
      sourceUrl: index.legal.srdUrl,
      license: index.legal.licenseAbbreviation,
      licenseUrl: index.legal.licenseUrl,
      provider: index.legal.provider,
      attribution: index.legal.attribution,
      compatibilityStmt: index.legal.compatibilityStatement,
      isPremium: false,
      isPublic: true,
      isActive: true,
      datasetPath: SRD_PATH,
      metadata: {
        disclaimer: index.legal.disclaimer,
        types: index.types
      }
    }
  })

  console.log(`✓ Created/updated expansion: ${srdExpansion.title}`)
  console.log(`  ID: ${srdExpansion.id}`)
  console.log(`  Type: ${srdExpansion.type}`)
  console.log(`  License: ${srdExpansion.license}\n`)

  return { index, expansion: srdExpansion }
}

async function importCoreDataset(expansionId: string) {
  console.log('Loading core dataset...\n')

  const corePath = path.join(SRD_PATH, 'core', 'core.json')
  const core = await loadJSON<CoreDataset>(corePath)

  console.log(`Core: ${core.title}`)
  console.log(`Description: ${core.description}\n`)

  // Store core data in metadata for now
  // TODO: Parse into specific models as we build them
  await prisma.rpgExpansion.update({
    where: { id: expansionId },
    data: {
      metadata: {
        core: {
          players: core.players,
          modes: core.modes,
          flow: core.flow,
          core: core.core,
          dice: core.dice,
          boards: core.boards,
          teams: core.teams
        }
      }
    }
  })

  console.log(`✓ Imported core game mechanics`)
  console.log(`  Players: ${core.players.length} types`)
  console.log(`  Modes: ${core.modes.length} types`)
  console.log(`  Dice: ${core.dice.length} types`)
  console.log(`  Boards: ${core.boards.length} types`)
  console.log(`  Teams: ${core.teams.length} types\n`)

  return core
}

async function importRules(expansionId: string) {
  console.log('Loading rules...\n')

  const rulesPath = path.join(SRD_PATH, 'core', 'rules.json')

  try {
    const rules = await loadJSON(rulesPath)

    await prisma.rpgExpansion.update({
      where: { id: expansionId },
      data: {
        metadata: {
          rules: rules
        }
      }
    })

    console.log(`✓ Imported rules data\n`)
  } catch (error) {
    console.warn(`⚠ Rules file not found or invalid, skipping...\n`)
  }
}

async function importCards(expansionId: string) {
  console.log('Loading card datasets...\n')

  const cardsDir = path.join(SRD_PATH, 'core', 'cards')

  try {
    const files = await readdir(cardsDir)
    const cardFiles = files.filter(f => f.endsWith('.json') && f !== 'cards.json')

    let totalCards = 0

    for (const file of cardFiles) {
      const filePath = path.join(cardsDir, file)
      const data = await loadJSON<any[]>(filePath)

      const category = file.replace('.json', '')
      console.log(`  ${category}: ${data.length} items`)

      totalCards += data.length
    }

    console.log(`✓ Found ${totalCards} total card definitions`)
    console.log(`  (Card import to be implemented)\n`)

  } catch (error) {
    console.warn(`⚠ Cards directory not found, skipping...\n`)
  }
}

async function importSheets(expansionId: string) {
  console.log('Loading sheet templates...\n')

  const sheetsDir = path.join(SRD_PATH, 'core', 'sheets')

  try {
    const files = await readdir(sheetsDir)
    const sheetFiles = files.filter(f => f.endsWith('.json') && f !== 'sheets.json')

    let totalSheets = 0

    for (const file of sheetFiles) {
      const filePath = path.join(sheetsDir, file)
      const data = await loadJSON<any>(filePath)

      const category = file.replace('.json', '')
      console.log(`  ${category}: template loaded`)

      totalSheets++
    }

    console.log(`✓ Found ${totalSheets} sheet templates`)
    console.log(`  (Sheet template import to be implemented)\n`)

  } catch (error) {
    console.warn(`⚠ Sheets directory not found, skipping...\n`)
  }
}

async function importCreatures() {
  console.log('Loading creatures...\n')

  // TODO: Implement creature import
  console.log(`⚠ Creature import not yet implemented\n`)
}

async function importLocations() {
  console.log('Loading locations...\n')

  // TODO: Implement location import
  console.log(`⚠ Location import not yet implemented\n`)
}

async function importObjects() {
  console.log('Loading objects...\n')

  // TODO: Implement object import
  console.log(`⚠ Object import not yet implemented\n`)
}

async function main() {
  console.log('=====================================')
  console.log('SRD 5e Dataset Import')
  console.log('=====================================\n')

  try {
    // Import main index
    const { index, expansion } = await importSRDIndex()

    // Import core dataset
    await importCoreDataset(expansion.id)

    // Import rules
    await importRules(expansion.id)

    // Import cards
    await importCards(expansion.id)

    // Import sheets
    await importSheets(expansion.id)

    // Import creatures (placeholder)
    await importCreatures()

    // Import locations (placeholder)
    await importLocations()

    // Import objects (placeholder)
    await importObjects()

    console.log('=====================================')
    console.log('Import Complete!')
    console.log('=====================================\n')

    console.log('Summary:')
    console.log(`  Expansion: ${expansion.title}`)
    console.log(`  Version: ${expansion.version}`)
    console.log(`  License: ${expansion.license}`)
    console.log(`  Status: ${expansion.isActive ? 'Active' : 'Inactive'}`)
    console.log(`  Public: ${expansion.isPublic ? 'Yes' : 'No'}`)
    console.log(`  Premium: ${expansion.isPremium ? 'Yes' : 'No'}\n`)

    console.log('Next steps:')
    console.log('  1. Implement card data models and import')
    console.log('  2. Implement sheet template models and import')
    console.log('  3. Implement creature models and import')
    console.log('  4. Implement location models and import')
    console.log('  5. Implement object models and import')
    console.log('  6. Test game mechanics with imported data\n')

  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        console.error('\n❌ Error: SRD dataset not found!')
        console.error('Expected path:', SRD_PATH)
        console.error('\nPlease ensure TTRPG-Realms-of-the-5th-system is cloned at:')
        console.error('  ../TTRPG-Realms-of-the-5th-system\n')
      } else {
        console.error('\n❌ Error:', error.message)
        console.error(error.stack)
      }
    } else {
      console.error('\n❌ Unknown error:', error)
    }
    process.exit(1)
  }
}

main()
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
