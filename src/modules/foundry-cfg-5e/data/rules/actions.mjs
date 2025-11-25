/**
 * D&D 5e Actions
 * Core Concepts data format
 */

export const actions = [
  {
    id: 'attack',
    name: 'Attack',
    type: 'action',
    category: 'combat',
    actionType: 'action',
    description: 'Make one melee or ranged attack.',
    icon: 'icons/svg/sword.svg',
    tags: ['combat', 'basic'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Actions in Combat'
    }
  },
  {
    id: 'cast-spell',
    name: 'Cast a Spell',
    type: 'action',
    category: 'magic',
    actionType: 'action',
    description: 'Cast a spell with a casting time of 1 action.',
    icon: 'icons/svg/book.svg',
    tags: ['magic', 'spellcasting'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Actions in Combat'
    }
  },
  {
    id: 'dash',
    name: 'Dash',
    type: 'action',
    category: 'movement',
    actionType: 'action',
    description: 'Gain extra movement equal to your speed for the current turn.',
    icon: 'icons/svg/running.svg',
    tags: ['movement', 'basic'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Actions in Combat'
    }
  },
  {
    id: 'disengage',
    name: 'Disengage',
    type: 'action',
    category: 'movement',
    actionType: 'action',
    description: 'Your movement doesn\'t provoke opportunity attacks for the rest of the turn.',
    icon: 'icons/svg/cancel.svg',
    tags: ['movement', 'tactical'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Actions in Combat'
    }
  },
  {
    id: 'dodge',
    name: 'Dodge',
    type: 'action',
    category: 'defense',
    actionType: 'action',
    description: 'Focus entirely on avoiding attacks. Until the start of your next turn, any attack roll made against you has disadvantage if you can see the attacker, and you make Dexterity saving throws with advantage.',
    icon: 'icons/svg/shield.svg',
    tags: ['defense', 'tactical'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Actions in Combat'
    }
  },
  {
    id: 'help',
    name: 'Help',
    type: 'action',
    category: 'support',
    actionType: 'action',
    description: 'Aid a friendly creature in completing a task or grant advantage on their next attack roll against a creature within 5 feet of you.',
    icon: 'icons/svg/up.svg',
    tags: ['support', 'tactical'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Actions in Combat'
    }
  },
  {
    id: 'hide',
    name: 'Hide',
    type: 'action',
    category: 'stealth',
    actionType: 'action',
    description: 'Make a Dexterity (Stealth) check in an attempt to hide.',
    icon: 'icons/svg/mystery-man.svg',
    tags: ['stealth', 'tactical'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Actions in Combat'
    }
  },
  {
    id: 'ready',
    name: 'Ready',
    type: 'action',
    category: 'tactical',
    actionType: 'action',
    description: 'Prepare an action to trigger as a reaction when a specific circumstance occurs.',
    icon: 'icons/svg/clockwork.svg',
    tags: ['tactical', 'reaction-setup'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Actions in Combat'
    }
  },
  {
    id: 'search',
    name: 'Search',
    type: 'action',
    category: 'exploration',
    actionType: 'action',
    description: 'Make a Wisdom (Perception) or Intelligence (Investigation) check to find something.',
    icon: 'icons/svg/search.svg',
    tags: ['exploration', 'skill-check'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Actions in Combat'
    }
  },
  {
    id: 'use-object',
    name: 'Use an Object',
    type: 'action',
    category: 'interaction',
    actionType: 'action',
    description: 'Interact with a second object on your turn (you can interact with one object for free).',
    icon: 'icons/svg/item-bag.svg',
    tags: ['interaction', 'basic'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Actions in Combat'
    }
  },
  {
    id: 'opportunity-attack',
    name: 'Opportunity Attack',
    type: 'action',
    category: 'combat',
    actionType: 'reaction',
    description: 'Make a melee attack against a creature that moves out of your reach.',
    icon: 'icons/svg/target.svg',
    tags: ['combat', 'reaction'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Reactions'
    }
  },
  {
    id: 'grapple',
    name: 'Grapple',
    type: 'action',
    category: 'combat',
    actionType: 'action',
    description: 'Attempt to grab a creature or wrestle with it. Make an Athletics check contested by the target\'s Athletics or Acrobatics check.',
    icon: 'icons/svg/net.svg',
    tags: ['combat', 'contest', 'condition-inflict'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Grappling'
    }
  },
  {
    id: 'shove',
    name: 'Shove',
    type: 'action',
    category: 'combat',
    actionType: 'action',
    description: 'Knock a creature prone or push it away. Make an Athletics check contested by the target\'s Athletics or Acrobatics check.',
    icon: 'icons/svg/falling.svg',
    tags: ['combat', 'contest', 'condition-inflict'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Shoving'
    }
  },
  {
    id: 'bonus-action-offhand',
    name: 'Offhand Attack',
    type: 'action',
    category: 'combat',
    actionType: 'bonus-action',
    description: 'When you take the Attack action and attack with a light melee weapon, you can use a bonus action to attack with a different light melee weapon in your other hand.',
    icon: 'icons/svg/sword.svg',
    tags: ['combat', 'two-weapon'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Two-Weapon Fighting'
    }
  },
  {
    id: 'improvise',
    name: 'Improvise an Action',
    type: 'action',
    category: 'creative',
    actionType: 'varies',
    description: 'Perform an action not described elsewhere. The DM determines whether it\'s possible and what kind of roll is needed.',
    icon: 'icons/svg/dice-target.svg',
    tags: ['creative', 'dm-discretion'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Actions in Combat'
    }
  }
];
