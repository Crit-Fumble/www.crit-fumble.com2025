#!/usr/bin/env tsx
/**
 * Pre-Generate Scripted Content
 *
 * This script bulk-generates common scripted content to minimize API calls.
 * Run this periodically to populate the database with pre-generated:
 * - Creature behaviors
 * - Common NPC dialogue trees
 * - Random encounter tables
 * - Frequently asked rules (with caching)
 *
 * Cost optimization strategy:
 * - Generate once, use thousands of times
 * - Prefer Gradient ($0.198/M) or Haiku ($3/M) over Sonnet ($18/M)
 * - Cache common rules for 24+ hours
 *
 * Usage:
 *   npm run pre-generate       # Generate everything
 *   npm run pre-generate -- --behaviors-only
 *   npm run pre-generate -- --rules-only
 */

import 'dotenv/config'
import { AIService } from '../src/ai/service.js'
import { ScriptedContent } from '../src/ai/scripted.js'
import { db } from '../src/db/index.js'
import { loadConfig } from '../src/config.js'

// Common creatures to pre-generate behaviors for
const COMMON_CREATURES = [
  'Goblin',
  'Kobold',
  'Orc',
  'Hobgoblin',
  'Bugbear',
  'Gnoll',
  'Bandit',
  'Guard',
  'Wolf',
  'Dire Wolf',
  'Giant Spider',
  'Giant Rat',
  'Skeleton',
  'Zombie',
  'Ghoul',
  'Wight',
  'Shadow',
  'Specter',
  'Ogre',
  'Troll',
  'Hill Giant',
  'Dragon (Young)',
  'Owlbear',
  'Displacer Beast',
  'Gelatinous Cube',
  'Rust Monster',
  'Mimic',
  'Stirge',
  'Giant Centipede',
  'Ankheg',
]

// Common NPC archetypes
const COMMON_NPCS = [
  { id: 'innkeeper_friendly', desc: 'A friendly innkeeper who knows local gossip' },
  { id: 'innkeeper_gruff', desc: 'A gruff innkeeper who minds their own business' },
  { id: 'merchant_honest', desc: 'An honest merchant selling general goods' },
  { id: 'merchant_shady', desc: 'A shady merchant dealing in rare items' },
  { id: 'guard_captain', desc: 'A town guard captain, stern but fair' },
  { id: 'guard_corrupt', desc: 'A corrupt guard looking for bribes' },
  { id: 'beggar_informant', desc: 'A beggar who knows everything happening in town' },
  { id: 'blacksmith', desc: 'A skilled blacksmith who takes pride in their work' },
  { id: 'alchemist', desc: 'An eccentric alchemist selling potions' },
  { id: 'priest_lawful', desc: 'A lawful good priest offering aid and healing' },
  { id: 'wizard_old', desc: 'An elderly wizard with vast knowledge' },
  { id: 'rogue_contact', desc: "A thieves' guild contact who trades in information" },
]

// Common random tables
const COMMON_TABLES = [
  { id: 'loot_common', desc: 'Common loot found on low-level enemies' },
  { id: 'loot_uncommon', desc: 'Uncommon loot for mid-level encounters' },
  { id: 'loot_rare', desc: 'Rare treasure for high-level encounters' },
  { id: 'trinkets', desc: 'Interesting trinkets and minor items' },
  { id: 'tavern_events', desc: 'Random events happening in a tavern' },
  { id: 'urban_encounters', desc: 'Random encounters in a city or town' },
  { id: 'wilderness_encounters_forest', desc: 'Random encounters in a forest' },
  { id: 'wilderness_encounters_mountain', desc: 'Random encounters in mountains' },
  { id: 'wilderness_encounters_desert', desc: 'Random encounters in a desert' },
  { id: 'dungeon_traps', desc: 'Common dungeon traps' },
  { id: 'dungeon_features', desc: 'Interesting dungeon features and flavor' },
  { id: 'npc_names_human', desc: 'Random human names' },
  { id: 'npc_names_elf', desc: 'Random elven names' },
  { id: 'npc_names_dwarf', desc: 'Random dwarven names' },
  { id: 'rumors', desc: 'Tavern rumors and adventure hooks' },
]

// Frequently asked rules (cache for 24 hours)
const COMMON_RULES = [
  'grappling',
  'flanking',
  'advantage and disadvantage',
  'opportunity attacks',
  'bonus actions',
  'reactions',
  'concentration',
  'short rest',
  'long rest',
  'death saving throws',
  'cover',
  'hiding and stealth',
  'multiclassing',
  'spell slots',
  'critical hits',
  'inspiration',
  'exhaustion',
  'conditions',
  'mounted combat',
  'two-weapon fighting',
]

async function main() {
  console.log('🤖 FumbleBot Content Pre-Generator\n')

  const args = process.argv.slice(2)
  const behaviorsOnly = args.includes('--behaviors-only')
  const npcsOnly = args.includes('--npcs-only')
  const tablesOnly = args.includes('--tables-only')
  const rulesOnly = args.includes('--rules-only')
  const all = !behaviorsOnly && !npcsOnly && !tablesOnly && !rulesOnly

  // Initialize services
  const config = loadConfig()
  const ai = AIService.getInstance()
  const scripted = ScriptedContent.getInstance()

  ai.initializeOpenAI(config.openai)
  ai.initializeAnthropic(config.anthropic)
  db.initialize(config.discord.guildId)

  console.log('✅ Services initialized\n')

  // Generate creature behaviors
  if (all || behaviorsOnly) {
    console.log('🦖 Generating creature behaviors...')
    let generated = 0
    for (const creature of COMMON_CREATURES) {
      try {
        const existing = await db.getBehavior(creature.toLowerCase())
        if (existing) {
          console.log(`  ⏭️  ${creature} - already exists`)
          continue
        }

        await scripted.getBehavior(creature)
        generated++
        console.log(`  ✅ ${creature}`)
      } catch (error) {
        console.error(`  ❌ ${creature} - ${error}`)
      }
    }
    console.log(`\n✨ Generated ${generated} new behaviors (${COMMON_CREATURES.length - generated} cached)\n`)
  }

  // Generate NPC dialogues
  if (all || npcsOnly) {
    console.log('💬 Generating NPC dialogue trees...')
    let generated = 0
    for (const npc of COMMON_NPCS) {
      try {
        const existing = await db.getDialogue(npc.id)
        if (existing) {
          console.log(`  ⏭️  ${npc.id} - already exists`)
          continue
        }

        await scripted.getDialogue(npc.id, npc.desc)
        generated++
        console.log(`  ✅ ${npc.id}`)
      } catch (error) {
        console.error(`  ❌ ${npc.id} - ${error}`)
      }
    }
    console.log(`\n✨ Generated ${generated} new dialogue trees (${COMMON_NPCS.length - generated} cached)\n`)
  }

  // Generate random tables
  if (all || tablesOnly) {
    console.log('🎲 Generating random tables...')
    let generated = 0
    for (const table of COMMON_TABLES) {
      try {
        const existing = await db.getTable(table.id)
        if (existing) {
          console.log(`  ⏭️  ${table.id} - already exists`)
          continue
        }

        await scripted.getTable(table.id, table.desc)
        generated++
        console.log(`  ✅ ${table.id}`)
      } catch (error) {
        console.error(`  ❌ ${table.id} - ${error}`)
      }
    }
    console.log(`\n✨ Generated ${generated} new tables (${COMMON_TABLES.length - generated} cached)\n`)
  }

  // Pre-cache common rules
  if (all || rulesOnly) {
    console.log('📚 Caching common rules...')
    let cached = 0
    for (const rule of COMMON_RULES) {
      try {
        const existing = await db.getCachedRule('D&D 5e', rule)
        if (existing) {
          console.log(`  ⏭️  ${rule} - already cached`)
          continue
        }

        await scripted.getRule(rule, 'D&D 5e', 24)
        cached++
        console.log(`  ✅ ${rule}`)
      } catch (error) {
        console.error(`  ❌ ${rule} - ${error}`)
      }
    }
    console.log(`\n✨ Cached ${cached} new rules (${COMMON_RULES.length - cached} already cached)\n`)
  }

  console.log('✅ Pre-generation complete!')
  console.log('\n💡 This content is now stored in the database and will be reused without API calls.')
  console.log('💡 Run this script periodically to refresh cached content.')

  process.exit(0)
}

main().catch((error) => {
  console.error('❌ Error:', error)
  process.exit(1)
})
