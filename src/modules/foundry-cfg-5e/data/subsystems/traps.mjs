/**
 * Traps & Hazards Subsystem
 * Detection, disarming, and resolving traps
 *
 * Source: SRD 5.2 - Gameplay Toolbox > Traps
 */

export const trapsSubsystem = {
  id: 'traps',
  name: 'Traps & Hazards',
  type: 'subsystem',
  category: 'exploration',
  description: 'Rules for detecting, disarming, and surviving traps and environmental hazards.',

  usesRules: [
    'search',
    'study',
    'ability-check',
    'saving-throw',
    'perception',
    'investigation',
    'sleight-of-hand',
    'thieves-tools'
  ],

  designPhilosophy: {
    usage: 'Use traps sparingly, lest they lose their charm.',
    bestPractices: [
      'Fleeting distractions that skilled characters can overcome quickly',
      'Deadly puzzles requiring quick thinking and teamwork',
      'Avoid undetectable and inescapable traps (rarely fun)'
    ],
    warning: 'Too many traps lead to overly cautious play, which slows the game.'
  },

  // Parts of a trap
  trapStructure: {
    description: 'All traps have these components:',

    components: [
      {
        component: 'Severity and Levels',
        description: 'Designated as "nuisance" or "deadly" for characters of certain levels.',
        nuisance: 'Unlikely to seriously harm characters of indicated levels.',
        deadly: 'Can grievously damage characters of indicated levels.',
        warning: 'Traps are more dangerous for lower-level characters.'
      },
      {
        component: 'Trigger',
        description: 'What sets off the trap.',
        examples: [
          'Stepping on pressure plate',
          'Crossing trip wire',
          'Turning doorknob',
          'Using wrong key in lock',
          'Opening door or chest',
          'Moving onto specific floor tile'
        ]
      },
      {
        component: 'Duration',
        description: 'How long trap effects last.',
        types: [
          'Instantaneous - effect resolved instantly',
          'Rounds, minutes, or hours - timed duration',
          'Until destroyed or dispelled',
          'Resets after activating (noted in description)'
        ],
        note: 'Trap is otherwise inert after activation.'
      }
    ]
  },

  // Common trap mechanics
  trapMechanics: {
    detectAndDisarm: {
      detect: {
        activity: 'search',
        check: 'Wisdom (Perception) or Intelligence (Investigation)',
        dc: 'Varies by trap complexity (typically DC 10-20)',
        success: 'Detect trip wire, pressure plate, or other trigger mechanism.'
      },
      disarm: {
        activity: 'utilize',
        methods: [
          {
            method: 'Simple Avoidance',
            description: 'Once detected, simple traps can be avoided or disabled without check.',
            examples: ['Cut trip wire', 'Wedge spike under pressure plate', 'Step over trigger']
          },
          {
            method: 'Complex Disarm',
            check: 'Dexterity (Sleight of Hand) with Thieves\' Tools',
            dc: 'Varies by trap complexity',
            failure: 'May trigger trap'
          },
          {
            method: 'Magical Disarm',
            spells: ['Dispel Magic', 'Arcane Lock (to hold doors shut)'],
            study: {
              activity: 'study',
              check: 'Intelligence (Arcana)',
              dc: 15,
              purpose: 'Identify magical glyphs or wards'
            }
          }
        ]
      },
      setTrap: {
        description: 'Skilled characters can set traps.',
        check: 'Dexterity (Sleight of Hand) with Thieves\' Tools',
        dc: 'Varies (typically DC 13-15)',
        timeRequired: '10 minutes per attempt',
        requirement: 'Must have all trap components'
      }
    },

    scaling: {
      description: 'Traps can be scaled for different character levels.',
      factors: [
        'Increased damage dice',
        'Higher save DC',
        'Larger area of effect',
        'More difficult to detect/disarm'
      ],
      levels: {
        '1-4': 'Basic traps',
        '5-10': 'Moderate scaling',
        '11-16': 'Advanced traps',
        '17-20': 'Master-level traps'
      }
    }
  },

  // Example trap templates
  trapExamples: [
    {
      id: 'collapsing-roof',
      name: 'Collapsing Roof',
      severity: 'Deadly',
      levels: '1-4',
      trigger: 'Creature crosses trip wire',
      duration: 'Instantaneous',
      effect: {
        save: 'DC 13 Dexterity saving throw',
        damage: '11 (2d10) Bludgeoning',
        onSave: 'Half damage',
        aftermath: 'Area becomes Difficult Terrain (rubble)'
      },
      detection: {
        activity: 'search',
        check: 'DC 11 Wisdom (Perception)',
        reveals: 'Trip wire and unstable ceiling'
      },
      disarm: {
        method: 'Cut or avoid trip wire (no check required once detected)'
      },
      scaling: {
        '5-10': { damage: '22 (4d10)', dc: 15 },
        '11-16': { damage: '55 (10d10)', dc: 17 },
        '17-20': { damage: '99 (18d10)', dc: 19 }
      }
    },
    {
      id: 'falling-net',
      name: 'Falling Net',
      severity: 'Nuisance',
      levels: '1-4',
      trigger: 'Creature crosses trip wire',
      duration: 'Instantaneous',
      effect: {
        save: 'DC 10 Dexterity saving throw',
        onFailure: 'Restrained condition until escape',
        escape: 'DC 10 Strength (Athletics) check as action',
        immunity: 'Huge or larger creatures succeed automatically'
      },
      detection: {
        activity: 'search',
        check: 'DC 11 Wisdom (Perception)',
        reveals: 'Trip wire and suspended net'
      },
      disarm: {
        methods: [
          'Cut or avoid trip wire',
          'Destroy net (reduce to 0 HP)'
        ]
      },
      setting: {
        check: 'DC 13 Dexterity (Sleight of Hand) with Thieves\' Tools',
        timeRequired: '10 minutes',
        requirements: 'Thieves\' Tools and Net'
      },
      scaling: {
        '5-10': { dc: 12 },
        '11-16': { dc: 14 },
        '17-20': { dc: 16 }
      }
    },
    {
      id: 'fire-statue',
      name: 'Fire-Casting Statue',
      severity: 'Deadly',
      levels: '1-4',
      trigger: 'Creature moves onto pressure plate',
      duration: 'Instantaneous, resets at start of next turn',
      effect: {
        area: '15-foot Cone',
        save: 'DC 15 Dexterity saving throw',
        damage: '11 (2d10) Fire',
        onSave: 'Half damage'
      },
      detection: {
        magical: 'Detect Magic reveals Evocation aura on statue',
        glyph: {
          activity: 'search',
          check: 'DC 10 Wisdom (Perception) within 5 feet',
          reveals: 'Tiny glyph on statue'
        },
        studyGlyph: {
          activity: 'study',
          check: 'DC 15 Intelligence (Arcana)',
          reveals: 'Glyph means "fire"'
        },
        pressurePlate: {
          activity: 'search',
          check: 'DC 15 Wisdom (Perception)',
          reveals: 'Pressure plate'
        }
      },
      disarm: {
        methods: [
          'Deface glyph on statue (sharp tool, action)',
          'Wedge Iron Spike under pressure plate'
        ]
      },
      scaling: {
        '5-10': { damage: '22 (4d10)', area: '30-foot Cone' },
        '11-16': { damage: '55 (10d10)', area: '60-foot Cone' },
        '17-20': { damage: '99 (18d10)', area: '120-foot Cone' }
      }
    },
    {
      id: 'hidden-pit',
      name: 'Hidden Pit',
      severity: 'Nuisance',
      levels: '1-4',
      trigger: 'Creature moves onto pit\'s lid',
      duration: 'Instantaneous',
      effect: {
        depth: '10 feet',
        damage: '3 (1d6) Bludgeoning from fall',
        note: 'Lid remains open after triggering'
      },
      detection: {
        activity: 'study',
        check: 'DC 15 Intelligence (Investigation)',
        reveals: 'Hinged lid in floor'
      },
      disarm: {
        methods: [
          'Wedge Iron Spike between lid and floor',
          'Arcane Lock or similar magic to hold shut'
        ]
      },
      scaling: {
        '5-10': { depth: '20 feet', damage: '7 (2d6)' },
        '11-16': { depth: '40 feet', damage: '14 (4d6)' },
        '17-20': { depth: '80 feet', damage: '28 (8d6)' }
      }
    }
  ],

  // Activities
  activities: {
    gm: [
      'gm-place-trap',
      'gm-determine-trap-dc',
      'gm-resolve-trap-effect',
      'gm-allow-trap-detection'
    ],
    player: [
      'search', // Detect traps
      'study', // Examine mechanisms
      'utilize', // Disarm or set traps
      'dodge' // Avoid trap effects
    ]
  },

  metadata: {
    source: 'SRD 5.2 - Gameplay Toolbox',
    section: 'Traps',
    type: 'subsystem'
  }
};

export default trapsSubsystem;
