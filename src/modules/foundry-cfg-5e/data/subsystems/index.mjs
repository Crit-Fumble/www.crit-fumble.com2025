/**
 * D&D 5e Subsystems
 * Platform-agnostic subsystem definitions
 *
 * Core subsystems are fundamental mechanics from the SRD.
 * Expansion subsystems are optional rule modules that enhance gameplay.
 */

import rhythmOfPlay from './rhythm-of-play.mjs';
import actionEconomy from './action-economy.mjs';
import magicSystem from './magic-system.mjs';
import travelSubsystem from './travel.mjs';
import trapsSubsystem from './traps.mjs';
import characterCreation from './character-creation.mjs';
import characterAdvancement from './character-advancement.mjs';

// Core subsystems (fundamental mechanics from SRD)
export const coreSubsystems = [
  rhythmOfPlay,
  actionEconomy,
  magicSystem,
  travelSubsystem,
  trapsSubsystem,
  characterCreation,
  characterAdvancement
];

// Expansion subsystems (optional enhancements)
export const expansionSubsystems = [
  {
    id: 'chases',
    name: 'Chase Scenes',
    description: 'Rules for dramatic chase sequences involving movement, obstacles, and complications.',
    category: 'tactical',
    enabled: false,
    rules: [
      {
        name: 'Chase Round',
        description: 'Each round, participants make checks to maintain or close distance',
        mechanics: {
          turnOrder: 'initiative',
          roundDuration: '6 seconds',
          actions: ['Dash', 'Dodge', 'Navigate Obstacle']
        }
      },
      {
        name: 'Complications',
        description: 'Random obstacles and challenges during the chase',
        table: 'Chase Complications Table (DMG p. 252-253)'
      }
    ],
    metadata: {
      source: 'DMG',
      page: '252-255'
    }
  },
  {
    id: 'strongholds',
    name: 'Strongholds & Followers',
    description: 'Rules for building and managing strongholds and hiring followers.',
    category: 'downtime',
    enabled: false,
    features: [
      'Build strongholds',
      'Hire followers',
      'Manage domain',
      'Generate revenue'
    ],
    metadata: {
      source: 'Homebrew/Third-party',
      inspiration: 'MCDM Strongholds & Followers'
    }
  },
  {
    id: 'crafting',
    name: 'Crafting & Harvesting',
    description: 'Expanded rules for crafting items and harvesting materials from creatures.',
    category: 'downtime',
    enabled: false,
    mechanics: {
      craftingTime: 'Item cost / 50gp per day',
      proficiencyRequired: true,
      materials: 'Half item cost',
      harvestDC: 'Based on creature CR'
    },
    features: [
      'Craft weapons and armor',
      'Brew potions',
      'Scribe scrolls',
      'Harvest monster parts',
      'Enchant items'
    ],
    metadata: {
      source: 'PHB/DMG/Homebrew',
      page: 'PHB p. 187, DMG p. 128-129'
    }
  },
  {
    id: 'reputation',
    name: 'Reputation & Renown',
    description: 'Track party reputation with factions and organizations.',
    category: 'social',
    enabled: false,
    mechanics: {
      levels: ['Unknown', 'Known', 'Respected', 'Honored', 'Revered'],
      benefits: 'Access to resources, allies, and information',
      penalties: 'Hostile factions may send assassins or bounty hunters'
    },
    metadata: {
      source: 'DMG',
      page: '22-23'
    }
  },
  {
    id: 'travel',
    name: 'Travel & Exploration',
    description: 'Enhanced rules for overland travel, navigation, and survival.',
    category: 'exploration',
    enabled: false,
    mechanics: {
      pace: ['Fast (4 mph)', 'Normal (3 mph)', 'Slow (2 mph)'],
      activities: ['Navigate', 'Forage', 'Track', 'Scout'],
      conditions: ['Weather', 'Terrain', 'Mounts']
    },
    features: [
      'Navigation checks',
      'Foraging for food',
      'Random encounters',
      'Weather effects',
      'Exhaustion from forced march'
    ],
    metadata: {
      source: 'PHB/DMG',
      page: 'PHB p. 181-183'
    }
  },
  {
    id: 'mass-combat',
    name: 'Mass Combat',
    description: 'Rules for battles involving large armies and troops.',
    category: 'warfare',
    enabled: false,
    mechanics: {
      units: 'Groups of 20-100 soldiers',
      battleRounds: 'Each round represents 10 minutes',
      morale: 'Track unit morale and rout conditions',
      commanders: 'PCs can lead units and make tactical decisions'
    },
    features: [
      'Unit types (Infantry, Cavalry, Archers)',
      'Morale checks',
      'Commander bonuses',
      'Tactical positioning',
      'Siege warfare'
    ],
    metadata: {
      source: 'Homebrew/Third-party',
      inspiration: 'Various mass combat systems'
    }
  },
  {
    id: 'madness',
    name: 'Madness',
    description: 'Rules for tracking and roleplaying madness from horrific encounters.',
    category: 'horror',
    enabled: false,
    types: [
      {
        name: 'Short-term Madness',
        duration: '1d10 minutes',
        trigger: 'Disturbing experience'
      },
      {
        name: 'Long-term Madness',
        duration: '1d10 × 10 hours',
        trigger: 'Traumatic experience'
      },
      {
        name: 'Indefinite Madness',
        duration: 'Until cured',
        trigger: 'Life-altering horror'
      }
    ],
    metadata: {
      source: 'DMG',
      page: '258-260'
    }
  },
  {
    id: 'downtime',
    name: 'Downtime Activities',
    description: 'Expanded activities characters can pursue during downtime.',
    category: 'downtime',
    enabled: false,
    activities: [
      {
        name: 'Carousing',
        timeRequired: '1 week',
        risk: 'Complication table',
        benefit: 'Make contacts, gain information'
      },
      {
        name: 'Crafting',
        timeRequired: 'Varies',
        cost: '50gp per day',
        benefit: 'Create items'
      },
      {
        name: 'Training',
        timeRequired: '10 weeks',
        cost: '250gp total',
        benefit: 'Learn language or tool proficiency'
      },
      {
        name: 'Research',
        timeRequired: '1 week',
        cost: '50gp per week',
        benefit: 'Uncover lore or secrets'
      },
      {
        name: 'Running a Business',
        timeRequired: '1 month',
        risk: 'Complications table',
        benefit: 'Generate income'
      }
    ],
    metadata: {
      source: 'PHB/DMG/XGE',
      page: 'XGE p. 123-134'
    }
  },
  {
    id: 'skills-challenges',
    name: 'Skill Challenges',
    description: 'Complex scenarios requiring multiple skill checks to resolve.',
    category: 'tactical',
    enabled: false,
    mechanics: {
      structure: 'Set number of successes needed before X failures',
      difficulty: 'DC based on challenge complexity',
      participation: 'All players can contribute',
      consequences: 'Failure results in complications, not total failure'
    },
    examples: [
      'Infiltrate enemy camp',
      'Navigate treacherous mountain pass',
      'Negotiate peace treaty',
      'Solve ancient puzzle temple'
    ],
    metadata: {
      source: 'Homebrew (D&D 4e inspired)',
      inspiration: 'D&D 4th Edition skill challenges'
    }
  },
  {
    id: 'seafaring',
    name: 'Seafaring & Naval Combat',
    description: 'Rules for ship-to-ship combat and maritime adventures.',
    category: 'exploration',
    enabled: false,
    mechanics: {
      shipRoles: ['Captain', 'Navigator', 'Gunner', 'Crew'],
      combat: 'Ship initiative, weapons, and maneuvers',
      navigation: 'Weather, currents, and hazards',
      upgrades: 'Ship modifications and improvements'
    },
    features: [
      'Ship combat',
      'Navigation challenges',
      'Crew management',
      'Port activities',
      'Piracy and smuggling'
    ],
    metadata: {
      source: 'DMG/GoS',
      page: 'Ghosts of Saltmarsh p. 175-195'
    }
  }
];

// All subsystems combined
export const subsystems5e = [
  ...coreSubsystems,
  ...expansionSubsystems
];

export {
  rhythmOfPlay,
  actionEconomy,
  magicSystem,
  travelSubsystem,
  trapsSubsystem,
  characterCreation,
  characterAdvancement
};

export default subsystems5e;
