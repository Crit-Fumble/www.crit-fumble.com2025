/**
 * Character Advancement Subsystem
 * Leveling up and gaining experience
 *
 * Source: SRD 5.2 - Character Advancement
 */

export const characterAdvancement = {
  id: 'character-advancement',
  name: 'Character Advancement',
  type: 'subsystem',
  category: 'progression',
  description: 'Rules for gaining experience points, leveling up, and advancing your character.',

  usesRules: [
    'experience-points',
    'level',
    'proficiency',
    'ability-score-improvement',
    'multiclassing'
  ],

  // Experience and Leveling
  experiencePoints: {
    description: 'Characters advance in level by earning Experience Points (XP).',

    xpTable: [
      { level: 1, xpRequired: 0, proficiencyBonus: 2 },
      { level: 2, xpRequired: 300, proficiencyBonus: 2 },
      { level: 3, xpRequired: 900, proficiencyBonus: 2 },
      { level: 4, xpRequired: 2700, proficiencyBonus: 2 },
      { level: 5, xpRequired: 6500, proficiencyBonus: 3 },
      { level: 6, xpRequired: 14000, proficiencyBonus: 3 },
      { level: 7, xpRequired: 23000, proficiencyBonus: 3 },
      { level: 8, xpRequired: 34000, proficiencyBonus: 3 },
      { level: 9, xpRequired: 48000, proficiencyBonus: 4 },
      { level: 10, xpRequired: 64000, proficiencyBonus: 4 },
      { level: 11, xpRequired: 85000, proficiencyBonus: 4 },
      { level: 12, xpRequired: 100000, proficiencyBonus: 4 },
      { level: 13, xpRequired: 120000, proficiencyBonus: 5 },
      { level: 14, xpRequired: 140000, proficiencyBonus: 5 },
      { level: 15, xpRequired: 165000, proficiencyBonus: 5 },
      { level: 16, xpRequired: 195000, proficiencyBonus: 5 },
      { level: 17, xpRequired: 225000, proficiencyBonus: 6 },
      { level: 18, xpRequired: 265000, proficiencyBonus: 6 },
      { level: 19, xpRequired: 305000, proficiencyBonus: 6 },
      { level: 20, xpRequired: 355000, proficiencyBonus: 6 }
    ],

    milestones: [
      {
        level: 1,
        significance: 'Starting level - choose class, species, background'
      },
      {
        level: 3,
        significance: 'Choose subclass (archetype)'
      },
      {
        level: 5,
        significance: 'Proficiency Bonus increases to +3, Extra Attack (for martial classes)'
      },
      {
        level: 9,
        significance: 'Proficiency Bonus increases to +4'
      },
      {
        level: 11,
        significance: 'Major class features, increased spell access'
      },
      {
        level: 13,
        significance: 'Proficiency Bonus increases to +5'
      },
      {
        level: 17,
        significance: 'Proficiency Bonus increases to +6, ninth-level spells'
      },
      {
        level: 20,
        significance: 'Capstone class features'
      }
    ]
  },

  // Level-Up Process
  levelUpProcess: {
    description: 'When you gain a level, follow these steps in order.',

    steps: [
      {
        step: 1,
        name: 'Gain Hit Points',
        description: 'Roll your class Hit Die and add your Constitution modifier.',
        alternative: 'Take the average (rounded up) instead of rolling.',
        minimum: 'Gain at least 1 HP per level',
        formula: '1 Hit Die + Constitution modifier (minimum 1)',
        usesRule: 'hit-points'
      },
      {
        step: 2,
        name: 'Gain Class Features',
        description: 'Check your class description to see what features you gain at this level.',
        examples: [
          'Spellcasting improvements',
          'Class features (like Extra Attack, Uncanny Dodge)',
          'Subclass features',
          'Ability Score Improvements'
        ]
      },
      {
        step: 3,
        name: 'Ability Score Improvement or Feat',
        description: 'At certain levels (4, 8, 12, 16, 19), choose one:',
        occursAtLevels: [4, 8, 12, 16, 19],
        options: [
          {
            option: 'Ability Score Improvement',
            description: 'Increase one ability score by 2, or two ability scores by 1 each.',
            maximum: 'No ability score can exceed 20 (unless specified by racial trait or other feature).',
            usesRule: 'ability-score-improvement'
          },
          {
            option: 'Feat',
            description: 'Gain a feat (see Feats section).',
            note: 'Some classes get additional ASI/Feat opportunities',
            usesRule: 'feat'
          }
        ]
      },
      {
        step: 4,
        name: 'Update Proficiency Bonus',
        description: 'If your Proficiency Bonus increases at this level, update all proficient skills, saves, and attacks.',
        increases: 'At levels 5, 9, 13, and 17',
        affects: [
          'Skill checks (if proficient)',
          'Saving throws (if proficient)',
          'Attack rolls (if proficient)',
          'Spell save DC',
          'Class features that use proficiency'
        ],
        usesRule: 'proficiency'
      },
      {
        step: 5,
        name: 'Gain Spell Slots (if applicable)',
        description: 'If you\'re a spellcaster, you may gain new spell slots or access to higher-level spells.',
        checkTable: 'See your class\'s Spellcasting table',
        usesRule: 'spell-slot'
      },
      {
        step: 6,
        name: 'Learn New Spells (if applicable)',
        description: 'Some classes learn new spells when they level up.',
        varies: [
          'Clerics, Druids: Can prepare different spells after Long Rest',
          'Wizards: Add 2 spells to spellbook',
          'Sorcerers, Bards, Warlocks: Replace one known spell (optional)',
          'Rangers, Paladins: Can swap prepared spells'
        ],
        usesRule: 'spell'
      },
      {
        step: 7,
        name: 'Update Character Sheet',
        description: 'Record your new level, HP, features, and any other changes.',
        updates: [
          'Current level and XP',
          'Maximum HP',
          'Class features',
          'Proficiency bonus',
          'Spell slots',
          'Known/prepared spells',
          'Ability scores (if improved)',
          'Feat (if taken)'
        ]
      }
    ]
  },

  // Multiclassing (optional rule)
  multiclassing: {
    description: 'Optional rule allowing characters to gain levels in multiple classes.',
    optional: true,

    prerequisites: {
      description: 'Must meet minimum ability score requirements for both current and new class.',
      requirements: [
        { class: 'Barbarian', minimum: { str: 13 } },
        { class: 'Bard', minimum: { cha: 13 } },
        { class: 'Cleric', minimum: { wis: 13 } },
        { class: 'Druid', minimum: { wis: 13 } },
        { class: 'Fighter', minimum: { str: 13, dex: 13 }, note: 'Str OR Dex' },
        { class: 'Monk', minimum: { dex: 13, wis: 13 } },
        { class: 'Paladin', minimum: { str: 13, cha: 13 } },
        { class: 'Ranger', minimum: { dex: 13, wis: 13 } },
        { class: 'Rogue', minimum: { dex: 13 } },
        { class: 'Sorcerer', minimum: { cha: 13 } },
        { class: 'Warlock', minimum: { cha: 13 } },
        { class: 'Wizard', minimum: { int: 13 } }
      ]
    },

    proficiencies: {
      description: 'When multiclassing, you gain only some proficiencies from the new class.',
      note: 'You don\'t gain all starting equipment or proficiencies.',
      gained: 'See Multiclassing Proficiencies table in PHB'
    },

    spellcasting: {
      description: 'If multiclassing between spellcasting classes, use special rules for spell slots.',
      fullCasters: ['Bard', 'Cleric', 'Druid', 'Sorcerer', 'Wizard'],
      halfCasters: ['Paladin', 'Ranger'],
      thirdCasters: ['Eldritch Knight Fighter', 'Arcane Trickster Rogue'],
      formula: 'Sum: (Full Caster levels) + (Half Caster levels / 2) + (Third Caster levels / 3)',
      important: 'You know/prepare spells as if single-classed, but have multiclass spell slots.'
    },

    considerations: [
      'Multiclassing can delay powerful class features',
      'Some class combinations synergize better than others',
      'GM may restrict multiclassing for campaign balance'
    ],

    usesRule: 'multiclassing'
  },

  // Activities
  activities: {
    gm: [
      'gm-award-xp',
      'gm-approve-level-up',
      'gm-allow-multiclassing',
      'gm-grant-milestone-level'
    ],
    player: [
      'level-up',
      'choose-asi-or-feat',
      'select-new-spells',
      'multiclass'
    ]
  },

  // Alternative: Milestone Leveling
  milestoneLeveling: {
    description: 'Alternative to XP - GM grants levels at story milestones.',
    benefits: [
      'Keeps party at same level',
      'Focuses on story over combat',
      'Simpler bookkeeping',
      'Rewards roleplaying and problem-solving'
    ],
    method: 'GM decides when party has achieved significant story goals.',
    typical: 'Level up every 2-5 sessions, or after major story beats.'
  },

  // Template integration
  templates: {
    officialModule: 'systems/dnd5e/templates/actors/',
    mappings: [
      {
        template: 'character-header.hbs',
        displays: ['level', 'xp'],
        activities: ['level-up'],
        relatedRules: ['level', 'experience-points', 'proficiency']
      },
      {
        template: 'tabs/character-details.hbs',
        displays: ['level', 'xp progress'],
        activities: ['level-up', 'choose-asi-or-feat'],
        relatedRules: ['level', 'ability-score-improvement', 'feat']
      }
    ]
  },

  metadata: {
    source: 'SRD 5.2 - Character Advancement',
    type: 'subsystem',
    category: 'progression'
  }
};

export default characterAdvancement;
