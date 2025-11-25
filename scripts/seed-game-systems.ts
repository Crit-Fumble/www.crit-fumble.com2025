/**
 * Script to seed initial RPG game systems from Foundry VTT manifests
 * Usage: npx tsx scripts/seed-game-systems.ts
 *
 * This will seed:
 * - D&D 5e (Dungeons & Dragons Fifth Edition)
 * - Cypher System
 *
 * Both systems are marked as "Core" (officially supported) and enabled by default.
 */

import { prisma } from '../src/lib/db'

interface SystemConfig {
  manifestUrl: string
  isCore: boolean
  notes?: string
}

const CORE_SYSTEMS: SystemConfig[] = [
  {
    manifestUrl: 'https://github.com/foundryvtt/dnd5e/releases/latest/download/system.json',
    isCore: true,
    notes: 'Official D&D 5th Edition system - primary supported system',
  },
  {
    manifestUrl: 'https://github.com/mrkwnzl/cyphersystem-foundryvtt/releases/latest/download/system.json',
    isCore: true,
    notes: 'Cypher System - primary supported system',
  },
]

async function fetchManifest(url: string) {
  console.log(`Fetching manifest from ${url}...`)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch manifest: ${response.statusText}`)
  }
  return response.json()
}

async function seedSystem(config: SystemConfig) {
  const manifest = await fetchManifest(config.manifestUrl)

  const systemId = manifest.id || manifest.name
  const systemName = manifest.name || manifest.id
  const systemTitle = manifest.title || systemName

  console.log(`Processing system: ${systemTitle} (${systemId})`)

  // Parse compatibility
  const compatibility = {
    minimum: manifest.compatibility?.minimum || manifest.minimumCoreVersion,
    verified: manifest.compatibility?.verified || manifest.compatibleCoreVersion,
    maximum: manifest.compatibility?.maximum,
  }

  // Build platforms JSON with Foundry data
  const platforms = {
    foundry: {
      manifestUrl: config.manifestUrl,
      version: manifest.version || '0.0.0',
      compatibility,
      url: manifest.url,
      manifest: manifest.manifest,
      download: manifest.download,
      bugs: manifest.bugs,
      changelog: manifest.changelog,
      readme: manifest.readme,
      media: Array.isArray(manifest.media) ? manifest.media : [],
      authors: Array.isArray(manifest.authors) ? manifest.authors : [],
      fullManifest: manifest,
    },
  }

  // Upsert the system
  const system = await prisma.rpgSystem.upsert({
    where: { systemId },
    create: {
      systemId,
      name: systemName,
      title: systemTitle,
      description: manifest.description,
      version: manifest.version || '0.0.0',
      author: typeof manifest.author === 'string' ? manifest.author : manifest.author?.name,
      publisher: manifest.publisher,
      license: manifest.license,
      platforms,
      isEnabled: true,
      isCore: config.isCore,
      priority: config.isCore ? 100 : 0,
      notes: config.notes,
    },
    update: {
      name: systemName,
      title: systemTitle,
      description: manifest.description,
      version: manifest.version || '0.0.0',
      author: typeof manifest.author === 'string' ? manifest.author : manifest.author?.name,
      publisher: manifest.publisher,
      license: manifest.license,
      platforms,
      isEnabled: true,
      isCore: config.isCore,
      priority: config.isCore ? 100 : 0,
      notes: config.notes,
      deletedAt: null,
    },
  })

  console.log(`✓ ${systemTitle} (${systemId}) - v${system.version}`)
  return system
}

async function main() {
  console.log('Seeding RPG Game Systems from Foundry VTT...\n')
  console.log('This will add/update the following systems:')
  console.log('  - D&D 5e (Dungeons & Dragons Fifth Edition)')
  console.log('  - Cypher System')
  console.log('\nBoth will be marked as Core systems and enabled by default.\n')

  try {
    for (const config of CORE_SYSTEMS) {
      await seedSystem(config)
    }

    console.log('\n✓ All systems seeded successfully!')

    // Show summary
    const allSystems = await prisma.rpgSystem.findMany({
      where: { deletedAt: null },
      orderBy: [{ isCore: 'desc' }, { name: 'asc' }],
    })

    console.log(`\nTotal systems in database: ${allSystems.length}`)
    console.log('\nCore systems:')
    allSystems
      .filter((s) => s.isCore)
      .forEach((s) => {
        console.log(`  - ${s.title} (${s.systemId}) - v${s.version}`)
      })

    console.log('\nOther systems:')
    allSystems
      .filter((s) => !s.isCore)
      .forEach((s) => {
        console.log(`  - ${s.title} (${s.systemId}) - v${s.version}`)
      })
  } catch (error) {
    console.error('Error seeding systems:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
