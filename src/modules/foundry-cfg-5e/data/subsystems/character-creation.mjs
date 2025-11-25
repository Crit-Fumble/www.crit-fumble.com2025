/**
 * Character Creation Subsystem
 * The complete process for creating a new D&D 5e character
 *
 * Source: SRD 5.2 - Character Creation
 * Integration: Official dnd5e system templates
 */

export const characterCreation = {
  id: 'character-creation',
  name: 'Character Creation',
  type: 'subsystem',
  category: 'setup',
  description: 'Step-by-step process for creating a new D&D 5e character.',

  usesRules: [
    'ability-score',
    'proficiency',
    'skill',
    'class',
    'species',
    'background'
  ],

  // Template integration with official module
  templates: {
    description: 'Integrates with official dnd5e system templates',
    officialModule: 'systems/dnd5e/templates/actors/',

    mappings: [
      {
        template: 'character-ability-scores.hbs',
        step: 3,
        subsystem: 'character-creation',
        relatedRules: ['ability-score', 'ability-check', 'd20-test'],
        activities: ['roll-abilities', 'assign-abilities'],
        config: 'config/ability-config.hbs'
      },
      {
        template: 'character-header.hbs',
        step: [1, 2],
        subsystem: 'character-creation',
        relatedRules: ['class', 'species', 'level'],
        activities: ['choose-class', 'choose-species', 'set-level']
      },
      {
        template: 'config/skills-config.hbs',
        step: 2,
        subsystem: 'character-creation',
        relatedRules: ['skill', 'proficiency'],
        activities: ['choose-skills'],
        config: true
      },
      {
        template: 'config/languages-config.hbs',
        step: 2,
        subsystem: 'character-creation',
        relatedRules: ['language'],
        activities: ['choose-languages'],
        config: true
      },
      {
        template: 'tabs/character-details.hbs',
        step: [2, 4],
        subsystem: 'character-creation',
        relatedRules: ['background', 'alignment'],
        activities: ['choose-background', 'choose-alignment', 'fill-details']
      }
    ]
  },

  // The 5-step character creation process
  steps: [
    {
      step: 1,
      name: 'Choose a Class',
      description: 'Every adventurer is a member of a class that describes their vocation, talents, and tactics.',

      activities: [
        {
          id: 'choose-class',
          name: 'Choose Class',
          type: 'activity',
          activityType: 'character-creation',
          roles: ['character'],
          options: [
            { class: 'Barbarian', likes: 'Battle', primary: 'Strength', complexity: 'Average' },
            { class: 'Bard', likes: 'Performing', primary: 'Charisma', complexity: 'High' },
            { class: 'Cleric', likes: 'Gods', primary: 'Wisdom', complexity: 'Average' },
            { class: 'Druid', likes: 'Nature', primary: 'Wisdom', complexity: 'High' },
            { class: 'Fighter', likes: 'Weapons', primary: 'Strength or Dexterity', complexity: 'Low' },
            { class: 'Monk', likes: 'Unarmed combat', primary: 'Dexterity and Wisdom', complexity: 'High' },
            { class: 'Paladin', likes: 'Defense', primary: 'Strength and Charisma', complexity: 'Average' },
            { class: 'Ranger', likes: 'Survival', primary: 'Dexterity and Wisdom', complexity: 'Average' },
            { class: 'Rogue', likes: 'Stealth', primary: 'Dexterity', complexity: 'Low' },
            { class: 'Sorcerer', likes: 'Power', primary: 'Charisma', complexity: 'High' },
            { class: 'Warlock', likes: 'Occult lore', primary: 'Charisma', complexity: 'High' },
            { class: 'Wizard', likes: 'Spellbooks', primary: 'Intelligence', complexity: 'Average' }
          ],
          usesRule: 'class'
        },
        {
          id: 'set-level',
          name: 'Write Your Level',
          description: 'Typically start at level 1. Record level and XP (0 at level 1).',
          defaults: { level: 1, xp: 0 }
        },
        {
          id: 'note-armor-training',
          name: 'Note Armor Training',
          description: 'Record armor categories you have training with from your class.',
          usesRule: 'armor'
        }
      ],

      template: 'character-header.hbs',
      configTemplate: 'tabs/character-details.hbs'
    },

    {
      step: 2,
      name: 'Determine Origin',
      description: 'Choose background, species, and languages.',

      activities: [
        {
          id: 'choose-background',
          name: 'Choose Background',
          type: 'activity',
          activityType: 'character-creation',
          roles: ['character'],
          description: 'Background represents formative place and occupation.',
          grants: [
            'Feat',
            'Two skill proficiencies',
            'One tool proficiency'
          ],
          usesRule: 'background',
          // Ability score suggestions
          suggestions: [
            { ability: 'Strength', background: 'Soldier' },
            { ability: 'Dexterity', background: 'Soldier' },
            { ability: 'Constitution', background: 'Soldier' },
            { ability: 'Intelligence', background: 'Acolyte' },
            { ability: 'Wisdom', background: 'Acolyte' },
            { ability: 'Charisma', background: 'Acolyte' }
          ]
        },
        {
          id: 'choose-equipment',
          name: 'Choose Starting Equipment',
          description: 'Background and class provide starting equipment. Can spend coins immediately.',
          usesRule: 'equipment'
        },
        {
          id: 'choose-species',
          name: 'Choose Species',
          type: 'activity',
          activityType: 'character-creation',
          roles: ['character'],
          description: 'Choose from available species options.',
          options: [
            'Dragonborn', 'Dwarf', 'Elf', 'Gnome', 'Goliath',
            'Halfling', 'Human', 'Orc', 'Tiefling'
          ],
          grants: [
            'Species traits',
            'Size',
            'Speed'
          ],
          usesRule: 'species',
          note: 'PHB 2024 uses "species" not "race"'
        },
        {
          id: 'imagine-past',
          name: 'Imagine Your Past and Present',
          description: 'Consider character\'s history and motivations.',
          questions: [
            'Who raised you?',
            'Who was your dearest childhood friend?',
            'Did you grow up with a pet?',
            'Have you fallen in love? If so, with whom?',
            'Did you join an organization? If so, are you still a member?',
            'What elements of your past inspire you to go on adventures now?'
          ]
        },
        {
          id: 'choose-languages',
          name: 'Choose Languages',
          type: 'activity',
          activityType: 'character-creation',
          roles: ['character'],
          description: 'Know at least 3 languages: Common plus two others.',
          method: 'Roll or choose from Standard Languages table',
          standardLanguages: [
            'Common (always known)',
            'Common Sign Language',
            'Draconic',
            'Dwarvish',
            'Elvish',
            'Giant',
            'Gnomish',
            'Goblin',
            'Halfling',
            'Orc'
          ],
          rareLanguages: [
            'Abyssal', 'Celestial', 'Deep Speech', 'Druidic',
            'Infernal', 'Primordial*', 'Sylvan', 'Thieves\' Cant', 'Undercommon'
          ],
          note: 'Primordial includes Aquan, Auran, Ignan, and Terran dialects',
          usesRule: 'language'
        }
      ],

      templates: [
        'character-header.hbs',
        'config/languages-config.hbs',
        'config/traits-config.hbs',
        'tabs/character-details.hbs'
      ]
    },

    {
      step: 3,
      name: 'Determine Ability Scores',
      description: 'Generate and assign six ability scores.',

      activities: [
        {
          id: 'generate-scores',
          name: 'Generate Ability Scores',
          type: 'activity',
          activityType: 'character-creation',
          roles: ['character'],
          description: 'Use one of three methods to generate scores.',
          methods: [
            {
              method: 'Standard Array',
              scores: [15, 14, 13, 12, 10, 8],
              description: 'Use these six predetermined scores.'
            },
            {
              method: 'Point Buy',
              budget: 27,
              range: [8, 15],
              costs: {
                8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9
              },
              description: 'Spend 27 points to buy scores between 8-15.'
            },
            {
              method: 'Roll',
              formula: '4d6 drop lowest',
              repeat: 6,
              description: 'Roll 4d6, drop lowest, repeat 6 times.'
            }
          ],
          usesRule: 'ability-score'
        },
        {
          id: 'assign-scores',
          name: 'Assign Scores to Abilities',
          description: 'Assign generated scores to STR, DEX, CON, INT, WIS, CHA.',
          consideration: 'Consider your class\'s primary ability.',
          usesRule: 'ability-score'
        },
        {
          id: 'apply-origin-increases',
          name: 'Apply Origin Increases',
          description: 'Background and species may increase ability scores.',
          usesRule: 'ability-score'
        }
      ],

      template: 'character-ability-scores.hbs',
      configTemplate: 'config/ability-config.hbs'
    },

    {
      step: 4,
      name: 'Choose Alignment',
      description: 'Alignment is shorthand for character\'s moral compass.',

      activities: [
        {
          id: 'choose-alignment',
          name: 'Choose Alignment',
          type: 'activity',
          activityType: 'character-creation',
          roles: ['character'],
          options: [
            { id: 'lg', name: 'Lawful Good' },
            { id: 'ng', name: 'Neutral Good' },
            { id: 'cg', name: 'Chaotic Good' },
            { id: 'ln', name: 'Lawful Neutral' },
            { id: 'n', name: 'True Neutral' },
            { id: 'cn', name: 'Chaotic Neutral' },
            { id: 'le', name: 'Lawful Evil' },
            { id: 'ne', name: 'Neutral Evil' },
            { id: 'ce', name: 'Chaotic Evil' }
          ],
          usesRule: 'alignment'
        }
      ],

      template: 'tabs/character-details.hbs'
    },

    {
      step: 5,
      name: 'Fill in Details',
      description: 'Complete remaining character sheet details.',

      activities: [
        {
          id: 'calculate-derived-stats',
          name: 'Calculate Derived Statistics',
          calculations: [
            {
              stat: 'Ability Modifiers',
              formula: '(Ability Score - 10) ÷ 2, rounded down',
              usesRule: 'ability-score'
            },
            {
              stat: 'Initiative',
              formula: 'Dexterity modifier',
              usesRule: 'initiative',
              configTemplate: 'config/initiative-config.hbs'
            },
            {
              stat: 'Armor Class (AC)',
              formula: '10 + Dexterity modifier (+ armor + shield)',
              usesRule: 'armor-class',
              configTemplate: 'config/armor-class-config.hbs'
            },
            {
              stat: 'Hit Points (HP)',
              formula: 'Class hit die maximum + Constitution modifier',
              usesRule: 'hit-points',
              configTemplate: 'config/hit-points-config.hbs'
            },
            {
              stat: 'Proficiency Bonus',
              level1: '+2',
              progression: 'Increases at levels 5, 9, 13, 17',
              usesRule: 'proficiency'
            }
          ]
        },
        {
          id: 'record-attacks',
          name: 'Record Attacks',
          description: 'Note weapons and spell attacks.',
          configTemplate: 'config/weapons-config.hbs'
        },
        {
          id: 'finalize-proficiencies',
          name: 'Finalize Proficiencies',
          description: 'Fill in bonuses for skills and tools.',
          formula: 'Ability modifier + Proficiency Bonus (if proficient)',
          configTemplate: 'config/skills-config.hbs'
        },
        {
          id: 'finishing-touches',
          name: 'Add Finishing Touches',
          details: [
            'Character name',
            'Physical appearance',
            'Personality traits',
            'Ideals, bonds, flaws'
          ],
          template: 'tabs/character-biography.hbs'
        }
      ],

      templates: [
        'character-ability-scores.hbs',
        'character-header.hbs',
        'character-sidebar.hbs',
        'tabs/character-details.hbs',
        'tabs/character-inventory.hbs'
      ]
    }
  ],

  // GM Activities for character creation
  gmActivities: [
    {
      id: 'gm-approve-character',
      name: 'Review and Approve Character',
      description: 'GM reviews completed character for campaign appropriateness.',
      checks: [
        'Ability scores generated correctly',
        'Class/species/background fit campaign',
        'Equipment appropriate for starting level',
        'No rule violations'
      ]
    },
    {
      id: 'gm-allow-homebrew',
      name: 'Allow Homebrew Options',
      description: 'GM may permit additional classes, species, or backgrounds.'
    }
  ],

  // Integration points
  integration: {
    officialModule: {
      system: 'dnd5e',
      version: '5.2.0+',
      templates: 'systems/dnd5e/templates/actors/',
      sheets: [
        'dnd5e.ActorSheet5eCharacter2',
        'dnd5e.ActorSheet5eCharacter'
      ]
    },
    coreConceptsHooks: [
      {
        hook: 'createActor',
        when: 'Actor of type "character" is created',
        action: 'Initialize character creation subsystem',
        data: 'Link to character creation rules and activities'
      },
      {
        hook: 'renderActorSheet',
        when: 'Character sheet is rendered',
        action: 'Inject rule references into templates',
        mapping: 'Use template mappings to link UI elements to rules'
      }
    ]
  },

  metadata: {
    source: 'SRD 5.2 - Character Creation',
    pages: '19-45',
    type: 'subsystem',
    category: 'setup',
    officialModuleCompatible: true
  }
};

export default characterCreation;
