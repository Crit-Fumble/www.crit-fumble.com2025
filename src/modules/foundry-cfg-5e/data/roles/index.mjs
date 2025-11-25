/**
 * Team Roles for D&D 5e
 *
 * In Core Concepts, each adventuring party is a "Team".
 * Teams have members with specific roles that determine which activities they can perform.
 */

export const roles5e = [
  {
    id: 'game-master',
    name: 'Game Master',
    abbreviation: 'GM',
    type: 'role',
    category: 'core',
    description: 'The Game Master (also called Dungeon Master or DM) describes the world, narrates events, portrays NPCs, and adjudicates rules.',

    // What this role can do
    activities: [
      'gm-describe-scene',
      'gm-narrate-results',
      'gm-determine-dc',
      'gm-improvise-ruling',
      'gm-control-npc',
      'gm-control-monster',
      'gm-trigger-event'
    ],

    // Requirements
    requirements: {
      minPerTeam: 1,
      maxPerTeam: 1, // Typically one GM per game
      exclusive: true // GM doesn't usually play a character
    },

    metadata: {
      source: 'SRD 5.2',
      type: 'role',
      core: true
    }
  },

  {
    id: 'character',
    name: 'Player Character',
    abbreviation: 'PC',
    type: 'role',
    category: 'core',
    description: 'A player character (PC) is an adventurer controlled by a player. PCs take actions in the world, interact with NPCs, and go on adventures.',

    // What this role can do
    activities: [
      'attack',
      'dash',
      'disengage',
      'dodge',
      'help',
      'hide',
      'influence',
      'magic',
      'ready',
      'search',
      'study',
      'utilize',
      'improvise',
      'movement',
      'communicate',
      'interact-object',
      'short-rest',
      'long-rest'
    ],

    // Requirements
    requirements: {
      minPerTeam: 1, // Need at least one character
      maxPerTeam: null, // No hard limit, though 3-6 is typical
      exclusive: false // Can have other roles (see expansions)
    },

    metadata: {
      source: 'SRD 5.2',
      type: 'role',
      core: true
    }
  },

  // Expansion roles (for future use - ship crews, mass combat, etc.)
  {
    id: 'captain',
    name: 'Captain',
    abbreviation: 'CPT',
    type: 'role',
    category: 'expansion',
    description: 'A ship captain commands a vessel and crew.',
    expansion: 'ship-combat',

    activities: [
      'issue-command',
      'navigate-ship',
      'manage-crew'
    ],

    requirements: {
      minPerTeam: 0,
      maxPerTeam: 1,
      exclusive: false, // A PC can also be captain
      requiresExpansion: 'ship-combat'
    },

    metadata: {
      source: 'Expansion: Ship Combat',
      type: 'role',
      core: false
    }
  },

  {
    id: 'pilot',
    name: 'Pilot',
    abbreviation: 'PLT',
    type: 'role',
    category: 'expansion',
    description: 'A pilot controls vehicles or mounts.',
    expansion: 'vehicle-rules',

    activities: [
      'pilot-vehicle',
      'perform-maneuver',
      'evade-hazard'
    ],

    requirements: {
      minPerTeam: 0,
      maxPerTeam: null,
      exclusive: false,
      requiresExpansion: 'vehicle-rules'
    },

    metadata: {
      source: 'Expansion: Vehicle Rules',
      type: 'role',
      core: false
    }
  },

  {
    id: 'observer',
    name: 'Observer',
    abbreviation: 'OBS',
    type: 'role',
    category: 'spectator',
    description: 'An observer watches the game but doesn\'t actively participate. Useful for streaming or learning.',

    activities: [
      'view-scene',
      'view-character-sheets',
      'view-initiative'
    ],

    requirements: {
      minPerTeam: 0,
      maxPerTeam: null,
      exclusive: true, // Observers don't play
      permissions: 'read-only'
    },

    metadata: {
      type: 'role',
      core: false,
      spectator: true
    }
  }
];

export default roles5e;
