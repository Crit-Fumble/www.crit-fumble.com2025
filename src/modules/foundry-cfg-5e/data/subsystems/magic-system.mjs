/**
 * Magic System Subsystem
 * The spellcasting mechanics for D&D 5e
 *
 * Source: SRD 5.2 - Spells > Gaining Spells, Casting Spells
 */

export const magicSystem = {
  id: 'magic-system',
  name: 'Magic System',
  type: 'subsystem',
  category: 'core',
  description: 'The complete system for preparing, casting, and resolving spells.',

  usesRules: [
    'spell',
    'concentration',
    'spell-attack',
    'saving-throw',
    'cantrip',
    'ritual',
    'area-of-effect',
    'action',
    'bonus-action',
    'reaction'
  ],

  // Gaining spells subsystem
  gainingSpells: {
    description: 'Before you can cast a spell, you must have it prepared or have access via magic item.',

    // Spell preparation by class
    preparation: {
      description: 'Spellcasting feature specifies which spells you have access to and whether you can change your prepared list.',

      table: [
        {
          class: 'Bard',
          changeWhen: 'Gain a level',
          numberOfSpells: 'One',
          metadata: { source: 'SRD 5.2', flexible: false }
        },
        {
          class: 'Cleric',
          changeWhen: 'Finish a Long Rest',
          numberOfSpells: 'Any',
          metadata: { source: 'SRD 5.2', flexible: true }
        },
        {
          class: 'Druid',
          changeWhen: 'Finish a Long Rest',
          numberOfSpells: 'Any',
          metadata: { source: 'SRD 5.2', flexible: true }
        },
        {
          class: 'Paladin',
          changeWhen: 'Finish a Long Rest',
          numberOfSpells: 'One',
          metadata: { source: 'SRD 5.2', flexible: false }
        },
        {
          class: 'Ranger',
          changeWhen: 'Finish a Long Rest',
          numberOfSpells: 'One',
          metadata: { source: 'SRD 5.2', flexible: false }
        },
        {
          class: 'Sorcerer',
          changeWhen: 'Gain a level',
          numberOfSpells: 'One',
          metadata: { source: 'SRD 5.2', flexible: false }
        },
        {
          class: 'Warlock',
          changeWhen: 'Gain a level',
          numberOfSpells: 'One',
          metadata: { source: 'SRD 5.2', flexible: false }
        },
        {
          class: 'Wizard',
          changeWhen: 'Finish a Long Rest',
          numberOfSpells: 'Any',
          metadata: { source: 'SRD 5.2', flexible: true }
        }
      ],

      alwaysPrepared: {
        description: 'Certain features give you spells that you always have prepared. These don\'t count against your prepared spell limit.'
      }
    }
  },

  // Casting spells subsystem
  castingSpells: {
    description: 'Each spell has specific requirements and effects.',

    // Spell level system
    spellLevels: {
      description: 'Spells range from level 0 (cantrips) to level 9.',
      levels: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      cantrips: {
        level: 0,
        description: 'Simple spells that can be cast almost by rote. Cast without spell slots.'
      }
    },

    // Spell slot system
    spellSlots: {
      description: 'Spell slots represent a spellcaster\'s magical potential. Expend a slot to cast a spell.',

      rules: [
        {
          rule: 'Slot Level',
          description: 'Must expend a slot of the spell\'s level or higher.'
        },
        {
          rule: 'Upcasting',
          description: 'Casting a spell with a higher-level slot makes the spell that level. Some spells have enhanced effects when upcast.'
        },
        {
          rule: 'Recovery',
          description: 'All expended spell slots are restored after finishing a Long Rest.'
        },
        {
          rule: 'One Slot Per Turn',
          description: 'On a turn, you can expend only one spell slot to cast a spell.',
          important: true
        }
      ],

      // Ways to cast without slots
      castingWithoutSlots: [
        {
          method: 'Cantrips',
          description: 'A cantrip is cast without a spell slot.'
        },
        {
          method: 'Rituals',
          description: 'Spells with the Ritual tag can be cast as a ritual (takes 10 minutes longer, no slot required). Must have spell prepared.',
          usesRule: 'ritual'
        },
        {
          method: 'Special Abilities',
          description: 'Some features allow casting specific spells without slots, usually with daily limits.'
        },
        {
          method: 'Magic Items',
          description: 'Spell Scrolls and other magic items contain spells that can be cast without slots.'
        }
      ]
    },

    // Casting requirements
    castingRequirements: {
      castingTime: {
        description: 'Specifies how long it takes to cast the spell.',
        types: [
          {
            type: 'Action',
            description: 'Most spells require the Magic action.',
            activity: 'magic'
          },
          {
            type: 'Bonus Action',
            description: 'Some spells can be cast as a bonus action.',
            constraint: 'Limited by bonus action rules'
          },
          {
            type: 'Reaction',
            description: 'Cast in response to a trigger defined in the spell.',
            usesRule: 'reaction'
          },
          {
            type: 'Longer (1+ minutes)',
            description: 'Requires taking Magic action each turn and maintaining Concentration.',
            usesRule: 'concentration',
            failure: 'If Concentration is broken, spell fails but slot is not expended.'
          }
        ],

        castingInArmor: {
          rule: 'You must have training with any armor you are wearing to cast spells while wearing it.',
          failure: 'Otherwise too hampered for spellcasting.'
        }
      },

      range: {
        description: 'How far from the caster the spell\'s effect can originate.',
        types: [
          {
            type: 'Distance',
            description: 'Expressed in feet (e.g., "120 feet").',
            example: '120 feet'
          },
          {
            type: 'Touch',
            description: 'Must touch something within reach.',
            example: 'Touch'
          },
          {
            type: 'Self',
            description: 'Cast on the spellcaster or emanates from them.',
            example: 'Self'
          }
        ],
        movableEffects: 'Effects aren\'t restricted by range unless spell says otherwise.'
      },

      components: {
        description: 'Physical requirements to cast the spell.',
        types: [
          {
            component: 'Verbal (V)',
            description: 'Chanting of esoteric words in normal speaking voice.',
            restriction: 'Cannot cast if gagged or in magical silence.'
          },
          {
            component: 'Somatic (S)',
            description: 'Forceful gesticulation or intricate gestures.',
            requirement: 'Must have at least one hand free.'
          },
          {
            component: 'Material (M)',
            description: 'Particular material used in casting.',
            consumption: 'Not consumed unless spell description states otherwise.',
            substitutes: [
              'Component Pouch (for materials without cost)',
              'Spellcasting Focus (if class feature allows)'
            ],
            requirement: 'Must have hand free to access (can be same hand as Somatic).'
          }
        ]
      },

      duration: {
        description: 'How long the spell persists.',
        types: [
          {
            type: 'Concentration',
            description: 'Follows Concentration rules.',
            usesRule: 'concentration'
          },
          {
            type: 'Instantaneous',
            description: 'Magic appears for a moment then disappears.'
          },
          {
            type: 'Time Span',
            description: 'Lasts for specified time (rounds, minutes, hours, etc.).',
            dismissal: 'Can dismiss (no action required) if not Incapacitated.'
          }
        ]
      }
    },

    // Spell effects and resolution
    spellEffects: {
      description: 'What the spell does and how it\'s resolved.',

      targeting: {
        description: 'Spell description specifies what it targets.',

        rules: [
          {
            rule: 'Clear Path',
            description: 'Must have clear path to target (can\'t be behind Total Cover).',
            usesRule: 'cover'
          },
          {
            rule: 'Targeting Yourself',
            description: 'Can choose yourself unless target must be Hostile or specifically another creature.'
          },
          {
            rule: 'Areas of Effect',
            description: 'Some spells cover an area (Cone, Cube, Cylinder, Emanation, Line, Sphere).',
            usesRule: 'area-of-effect'
          },
          {
            rule: 'Awareness',
            description: 'Creature doesn\'t know it was targeted unless spell has perceptible effect.'
          },
          {
            rule: 'Invalid Targets',
            description: 'If target can\'t be affected, nothing happens but slot is still expended. Target appears to have succeeded on save.'
          }
        ]
      },

      savingThrows: {
        description: 'Target makes a save to avoid some or all effects.',
        formula: 'Spell save DC = 8 + spellcasting ability modifier + Proficiency Bonus',
        usesRule: 'saving-throw'
      },

      attackRolls: {
        description: 'Some spells require attack roll.',
        formula: 'Spell attack modifier = spellcasting ability modifier + Proficiency Bonus',
        usesRule: 'spell-attack'
      },

      combiningEffects: {
        description: 'Different spells add together while durations overlap.',
        sameSpell: {
          rule: 'Effects of same spell cast multiple times don\'t combine.',
          resolution: 'Most potent effect applies (or most recent if equally potent).'
        },
        example: 'Two Bless spells on same target: only one bonus applies, but duration can extend.'
      }
    },

    // Schools of magic
    schoolsOfMagic: {
      description: 'Each spell belongs to a school. These are descriptive categories with no inherent rules.',
      schools: [
        {
          id: 'abjuration',
          name: 'Abjuration',
          effect: 'Prevents or reverses harmful effects'
        },
        {
          id: 'conjuration',
          name: 'Conjuration',
          effect: 'Transports creatures or objects'
        },
        {
          id: 'divination',
          name: 'Divination',
          effect: 'Reveals information'
        },
        {
          id: 'enchantment',
          name: 'Enchantment',
          effect: 'Influences minds'
        },
        {
          id: 'evocation',
          name: 'Evocation',
          effect: 'Channels energy to create effects that are often destructive'
        },
        {
          id: 'illusion',
          name: 'Illusion',
          effect: 'Deceives the mind or senses'
        },
        {
          id: 'necromancy',
          name: 'Necromancy',
          effect: 'Manipulates life and death'
        },
        {
          id: 'transmutation',
          name: 'Transmutation',
          effect: 'Transforms creatures or objects'
        }
      ]
    },

    // Special mechanics
    specialMechanics: {
      identifyingSpells: {
        activity: 'study',
        description: 'Can try to identify a non-instantaneous spell by observable effects.',
        check: 'Intelligence (Arcana) DC 15',
        usesRule: 'ability-check'
      }
    }
  },

  // Activities related to magic
  activities: {
    gm: [
      'gm-determine-spell-dc',
      'gm-adjudicate-spell-effects',
      'gm-identify-ongoing-spell'
    ],
    player: [
      'magic', // Cast a spell
      'study', // Identify a spell
      'prepare-spells',
      'change-prepared-spells'
    ]
  },

  metadata: {
    source: 'SRD 5.2 - Spells',
    pages: ['Gaining Spells', 'Casting Spells'],
    type: 'subsystem',
    fundamental: true // Core to many classes
  }
};

export default magicSystem;
