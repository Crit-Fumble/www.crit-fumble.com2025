/**
 * D&D 5e Game Modes
 * Platform-agnostic mode definitions
 *
 * Modes represent different gameplay states that activate specific subsystems.
 * All modes follow the Rhythm of Play: GM Describes → Players Act → GM Narrates Results
 */

export const modes5e = [
  {
    id: 'social-interaction',
    name: 'Social Interaction',
    description: 'Roleplaying conversations, persuasion, and intrigue.',
    icon: 'fas fa-comments',
    category: 'adventure',
    pillar: 'social-interaction',

    // Core subsystems active in this mode
    subsystems: [
      'rhythm-of-play',
      'action-economy',
      'social-interaction',
      'd20-tests'
    ],

    // Primary activities available
    activities: {
      gm: ['gm-describe-scene', 'gm-narrate-results', 'gm-control-npc'],
      player: ['influence', 'search', 'study', 'help', 'improvise']
    },

    // Primary rules referenced
    primaryRules: [
      'ability-check',
      'skill',
      'advantage',
      'disadvantage',
      'attitude',
      'passive-perception'
    ],

    ui: {
      showActorDirectory: true,
      showItemDirectory: false,
      showScenes: true,
      showCombat: false,
      panels: ['NPC Tracker', 'Attitude Meters', 'Faction Relations']
    },

    metadata: {
      source: 'SRD 5.2',
      page: '12-14',
      type: 'mode'
    }
  },

  {
    id: 'exploration',
    name: 'Exploration',
    description: 'Explore dungeons, wilderness, and settlements.',
    icon: 'fas fa-compass',
    category: 'adventure',
    ui: {
      showActorDirectory: true,
      showItemDirectory: true,
      showScenes: true,
      showCombat: false,
      panels: ['Map', 'Inventory', 'Quest Log']
    },
    actions: [
      {
        id: 'move',
        name: 'Move',
        description: 'Move to a new location',
        speed: 'Character speed'
      },
      {
        id: 'search',
        name: 'Search',
        description: 'Search for hidden objects or creatures',
        check: 'Wisdom (Perception) or Intelligence (Investigation)'
      },
      {
        id: 'interact',
        name: 'Interact with Object',
        description: 'Use or manipulate an object in the environment',
        action: 'Free or Action'
      },
      {
        id: 'rest-short',
        name: 'Short Rest',
        description: 'Take a 1-hour rest to recover hit points',
        duration: '1 hour',
        benefits: ['Spend Hit Dice', 'Regain some class features']
      },
      {
        id: 'rest-long',
        name: 'Long Rest',
        description: 'Take an 8-hour rest to fully recover',
        duration: '8 hours',
        benefits: ['Regain all HP', 'Recover half total Hit Dice', 'Regain all spell slots']
      }
    ],
    mechanics: {
      lightLevels: ['Bright Light', 'Dim Light', 'Darkness'],
      vision: ['Normal', 'Darkvision', 'Blindsight', 'Truesight'],
      stealth: 'Hide action, Dexterity (Stealth) checks',
      perception: 'Passive Perception or active Wisdom (Perception)'
    },
    metadata: {
      source: 'PHB',
      page: '181-185'
    }
  },
  {
    id: 'combat',
    name: 'Combat',
    description: 'Tactical combat with initiative, turns, and actions.',
    icon: 'fas fa-fist-raised',
    category: 'adventure',
    ui: {
      showActorDirectory: true,
      showItemDirectory: true,
      showScenes: true,
      showCombat: true,
      panels: ['Combat Tracker', 'Turn Order', 'Conditions']
    },
    actions: [
      {
        id: 'attack',
        name: 'Attack',
        description: 'Make a melee or ranged attack',
        actionType: 'Action',
        roll: '1d20 + modifiers vs AC'
      },
      {
        id: 'cast-spell',
        name: 'Cast a Spell',
        description: 'Cast a spell with casting time of 1 action',
        actionType: 'Action',
        resource: 'Spell slots'
      },
      {
        id: 'dash',
        name: 'Dash',
        description: 'Double movement speed for this turn',
        actionType: 'Action',
        effect: 'Extra movement = Speed'
      },
      {
        id: 'disengage',
        name: 'Disengage',
        description: 'Avoid opportunity attacks when leaving reach',
        actionType: 'Action'
      },
      {
        id: 'dodge',
        name: 'Dodge',
        description: 'Focus on avoiding attacks',
        actionType: 'Action',
        effect: 'Attacks against you have disadvantage'
      },
      {
        id: 'help',
        name: 'Help',
        description: 'Give ally advantage on next check or attack',
        actionType: 'Action'
      },
      {
        id: 'hide',
        name: 'Hide',
        description: 'Attempt to hide from enemies',
        actionType: 'Action',
        check: 'Dexterity (Stealth)'
      },
      {
        id: 'ready',
        name: 'Ready',
        description: 'Prepare an action to trigger on a condition',
        actionType: 'Action',
        requires: 'Trigger and action to ready'
      },
      {
        id: 'bonus-action-offhand',
        name: 'Offhand Attack',
        description: 'Attack with offhand weapon (no ability modifier to damage)',
        actionType: 'Bonus Action',
        requires: 'Light weapons in both hands'
      },
      {
        id: 'opportunity-attack',
        name: 'Opportunity Attack',
        description: 'Attack enemy leaving your reach',
        actionType: 'Reaction',
        trigger: 'Enemy leaves reach without Disengaging'
      }
    ],
    mechanics: {
      initiativeRoll: '1d20 + Dexterity modifier',
      turnStructure: ['Start of turn', 'Movement', 'Action', 'Bonus Action', 'End of turn'],
      reactions: 'One per round',
      criticalHit: 'Natural 20 (double damage dice)',
      criticalMiss: 'Natural 1 (automatic miss)'
    },
    metadata: {
      source: 'PHB',
      page: '189-198'
    }
  },
  {
    id: 'social',
    name: 'Social Interaction',
    description: 'Roleplay conversations, persuasion, and intrigue.',
    icon: 'fas fa-comments',
    category: 'adventure',
    ui: {
      showActorDirectory: true,
      showItemDirectory: false,
      showScenes: true,
      showCombat: false,
      panels: ['NPC Tracker', 'Attitude', 'Faction Relations']
    },
    actions: [
      {
        id: 'persuade',
        name: 'Persuade',
        description: 'Convince someone with logical arguments or charm',
        check: 'Charisma (Persuasion)',
        dc: 'Based on NPC attitude'
      },
      {
        id: 'deceive',
        name: 'Deceive',
        description: 'Mislead or lie to someone',
        check: 'Charisma (Deception)',
        opposed: 'Wisdom (Insight)'
      },
      {
        id: 'intimidate',
        name: 'Intimidate',
        description: 'Threaten or coerce someone',
        check: 'Charisma (Intimidation)',
        risk: 'May turn NPC hostile'
      },
      {
        id: 'insight',
        name: 'Insight',
        description: 'Determine NPC motives and truthfulness',
        check: 'Wisdom (Insight)',
        opposed: 'Charisma (Deception)'
      },
      {
        id: 'gather-information',
        name: 'Gather Information',
        description: 'Ask around town for rumors and information',
        check: 'Charisma (Persuasion or Investigation)',
        timeRequired: '1-4 hours'
      }
    ],
    mechanics: {
      attitudes: ['Hostile', 'Unfriendly', 'Indifferent', 'Friendly', 'Helpful'],
      dcAdjustments: 'Attitude affects DC by ±5',
      consequences: 'Failed checks may worsen attitude',
      faction: 'Reputation affects starting attitude'
    },
    metadata: {
      source: 'PHB/DMG',
      page: 'DMG p. 244-245'
    }
  },
  {
    id: 'downtime',
    name: 'Downtime',
    description: 'Perform long-term activities between adventures.',
    icon: 'fas fa-home',
    category: 'between-adventures',
    ui: {
      showActorDirectory: true,
      showItemDirectory: true,
      showScenes: false,
      showCombat: false,
      panels: ['Calendar', 'Activities', 'Resources']
    },
    actions: [
      {
        id: 'craft',
        name: 'Craft Item',
        description: 'Create weapons, armor, or other items',
        timeRequired: '1 day per 5gp of item value',
        cost: 'Half item cost in materials',
        check: 'Tool proficiency required'
      },
      {
        id: 'train',
        name: 'Training',
        description: 'Learn a new language or tool proficiency',
        timeRequired: '250 days',
        cost: '1gp per day',
        benefit: 'Gain proficiency'
      },
      {
        id: 'research',
        name: 'Research',
        description: 'Study lore, magic, or historical information',
        timeRequired: 'Varies',
        cost: '1gp per day',
        check: 'Intelligence (Arcana, History, Religion, or Nature)'
      },
      {
        id: 'run-business',
        name: 'Run a Business',
        description: 'Manage a shop, tavern, or other enterprise',
        timeRequired: '1 month',
        benefit: 'Generate income or lose money',
        check: 'Complications table'
      },
      {
        id: 'carouse',
        name: 'Carousing',
        description: 'Spend time drinking, gambling, and socializing',
        timeRequired: '1 week',
        cost: 'Varies by lifestyle',
        benefit: 'Make contacts, gather rumors',
        risk: 'Complication table'
      }
    ],
    metadata: {
      source: 'PHB/DMG/XGE',
      page: 'XGE p. 123-134'
    }
  },
  {
    id: 'travel',
    name: 'Travel',
    description: 'Journey across the world map between locations.',
    icon: 'fas fa-route',
    category: 'adventure',
    ui: {
      showActorDirectory: false,
      showItemDirectory: false,
      showScenes: true,
      showCombat: false,
      panels: ['World Map', 'Travel Log', 'Supplies']
    },
    actions: [
      {
        id: 'set-destination',
        name: 'Set Destination',
        description: 'Choose where to travel on the map'
      },
      {
        id: 'set-pace',
        name: 'Set Travel Pace',
        description: 'Choose speed vs stealth',
        options: [
          { name: 'Fast', speed: '4 miles/hour', effect: '-5 to passive Perception' },
          { name: 'Normal', speed: '3 miles/hour', effect: 'No modifier' },
          { name: 'Slow', speed: '2 miles/hour', effect: 'Can use Stealth' }
        ]
      },
      {
        id: 'navigate',
        name: 'Navigate',
        description: 'Find the way through wilderness',
        check: 'Wisdom (Survival)',
        failure: 'Party becomes lost'
      },
      {
        id: 'forage',
        name: 'Forage for Food',
        description: 'Find food and water in the wild',
        check: 'Wisdom (Survival)',
        timeRequired: '1 hour per day',
        benefit: '1d6 + Wisdom pounds of food'
      },
      {
        id: 'manage-supplies',
        name: 'Manage Supplies',
        description: 'Track rations, water, and equipment',
        requirement: '1 pound of food and 1 gallon of water per day'
      }
    ],
    mechanics: {
      paces: ['Fast (30 mph/day)', 'Normal (24 mph/day)', 'Slow (18 mph/day)'],
      forcedMarch: 'Travel beyond 8 hours/day risks exhaustion',
      terrain: 'Difficult terrain halves speed',
      mounts: 'Horses travel faster (8 hours at gallop, walk, or trot)',
      randomEncounters: 'Check once per 4-hour travel period or per hex'
    },
    metadata: {
      source: 'PHB/DMG',
      page: 'PHB p. 181-183'
    }
  },
  {
    id: 'dungeon-delving',
    name: 'Dungeon Delving',
    description: 'Explore dungeons with traps, monsters, and treasure.',
    icon: 'fas fa-dungeon',
    category: 'adventure',
    ui: {
      showActorDirectory: true,
      showItemDirectory: true,
      showScenes: true,
      showCombat: false,
      panels: ['Dungeon Map', 'Marching Order', 'Light Sources']
    },
    actions: [
      {
        id: 'set-marching-order',
        name: 'Set Marching Order',
        description: 'Arrange party formation for dungeon exploration',
        options: ['Front Rank', 'Middle Rank', 'Rear Rank']
      },
      {
        id: 'check-for-traps',
        name: 'Check for Traps',
        description: 'Search for mechanical or magical traps',
        check: 'Intelligence (Investigation) or Wisdom (Perception)',
        timeRequired: '1 minute per 10-foot area'
      },
      {
        id: 'disarm-trap',
        name: 'Disarm Trap',
        description: 'Attempt to disable a discovered trap',
        check: 'Dexterity (Thieves\' Tools)',
        failure: 'Trap triggers'
      },
      {
        id: 'open-lock',
        name: 'Pick Lock',
        description: 'Open a locked door or chest',
        check: 'Dexterity (Thieves\' Tools)',
        dc: 'Based on lock complexity'
      },
      {
        id: 'listen-at-door',
        name: 'Listen at Door',
        description: 'Try to hear what\'s on the other side',
        check: 'Wisdom (Perception)',
        dc: 'Based on noise level'
      }
    ],
    mechanics: {
      lightSources: ['Torch (20ft bright, 20ft dim)', 'Lantern (30ft bright, 30ft dim)', 'Darkvision (60ft grayscale)'],
      squeezing: 'Moving through narrow spaces costs double movement',
      ceiling: 'Low ceilings may restrict combat or flight',
      doors: 'Stuck doors require Strength check to force open',
      secretDoors: 'Require successful Investigation or Perception to find'
    },
    metadata: {
      source: 'PHB/DMG',
      page: 'DMG p. 290-295'
    }
  }
];

export default modes5e;
