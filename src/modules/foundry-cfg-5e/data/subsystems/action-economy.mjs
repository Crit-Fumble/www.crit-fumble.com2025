/**
 * Action Economy Subsystem
 * Governs what characters can do during their turn
 *
 * Source: SRD 5.2 - Playing the Game > Actions
 */

export const actionEconomy = {
  id: 'action-economy',
  name: 'Action Economy',
  type: 'subsystem',
  category: 'core',
  description: 'The system that governs how much a character can do at one time, using actions, bonus actions, and reactions.',

  usesRules: [
    'action',
    'bonus-action',
    'reaction',
    'movement',
    'free-action'
  ],

  // Main player activities (from Actions table in SRD)
  activities: [
    {
      id: 'attack',
      name: 'Attack',
      type: 'activity',
      activityType: 'action',
      roles: ['character'],
      summary: 'Attack with a weapon or an Unarmed Strike.',
      usesRules: ['attack-roll', 'damage-roll', 'unarmed-strike'],
      metadata: { source: 'SRD 5.2', page: 9, srd52: true }
    },
    {
      id: 'dash',
      name: 'Dash',
      type: 'activity',
      activityType: 'action',
      roles: ['character'],
      summary: 'For the rest of the turn, give yourself extra movement equal to your Speed.',
      usesRules: ['speed', 'movement'],
      metadata: { source: 'SRD 5.2', page: 9, srd52: true }
    },
    {
      id: 'disengage',
      name: 'Disengage',
      type: 'activity',
      activityType: 'action',
      roles: ['character'],
      summary: 'Your movement doesn\'t provoke Opportunity Attacks for the rest of the turn.',
      usesRules: ['opportunity-attack', 'movement'],
      metadata: { source: 'SRD 5.2', page: 9, srd52: true }
    },
    {
      id: 'dodge',
      name: 'Dodge',
      type: 'activity',
      activityType: 'action',
      roles: ['character'],
      summary: 'Until the start of your next turn, attack rolls against you have Disadvantage, and you make Dexterity saving throws with Advantage.',
      usesRules: ['advantage', 'disadvantage', 'attack-roll', 'saving-throw'],
      conditions: ['You lose this benefit if you have the Incapacitated condition or if your Speed is 0.'],
      metadata: { source: 'SRD 5.2', page: 9, srd52: true }
    },
    {
      id: 'help',
      name: 'Help',
      type: 'activity',
      activityType: 'action',
      roles: ['character'],
      summary: 'Help another creature\'s ability check or attack roll, or administer first aid.',
      usesRules: ['ability-check', 'attack-roll', 'advantage'],
      metadata: { source: 'SRD 5.2', page: 9, srd52: true }
    },
    {
      id: 'hide',
      name: 'Hide',
      type: 'activity',
      activityType: 'action',
      roles: ['character'],
      summary: 'Make a Dexterity (Stealth) check.',
      usesRules: ['ability-check', 'skill'],
      requiredSkill: 'stealth',
      metadata: { source: 'SRD 5.2', page: 9, srd52: true }
    },
    {
      id: 'influence',
      name: 'Influence',
      type: 'activity',
      activityType: 'action',
      roles: ['character'],
      summary: 'Make a Charisma (Deception, Intimidation, Performance, or Persuasion) or Wisdom (Animal Handling) check to alter a creature\'s attitude.',
      usesRules: ['ability-check', 'skill', 'attitude'],
      relevantSkills: ['deception', 'intimidation', 'performance', 'persuasion', 'animal-handling'],
      metadata: { source: 'SRD 5.2', page: 9, srd52: true }
    },
    {
      id: 'magic',
      name: 'Magic',
      type: 'activity',
      activityType: 'action',
      roles: ['character'],
      summary: 'Cast a spell, use a magic item, or use a magical feature.',
      usesRules: ['spell', 'spellcasting', 'concentration'],
      metadata: { source: 'SRD 5.2', page: 9, srd52: true }
    },
    {
      id: 'ready',
      name: 'Ready',
      type: 'activity',
      activityType: 'action',
      roles: ['character'],
      summary: 'Prepare to take an action in response to a trigger you define.',
      usesRules: ['reaction', 'trigger'],
      metadata: { source: 'SRD 5.2', page: 9, srd52: true }
    },
    {
      id: 'search',
      name: 'Search',
      type: 'activity',
      activityType: 'action',
      roles: ['character'],
      summary: 'Make a Wisdom (Insight, Medicine, Perception, or Survival) check.',
      usesRules: ['ability-check', 'skill'],
      relevantSkills: ['insight', 'medicine', 'perception', 'survival'],
      metadata: { source: 'SRD 5.2', page: 9, srd52: true }
    },
    {
      id: 'study',
      name: 'Study',
      type: 'activity',
      activityType: 'action',
      roles: ['character'],
      summary: 'Make an Intelligence (Arcana, History, Investigation, Nature, or Religion) check.',
      usesRules: ['ability-check', 'skill'],
      relevantSkills: ['arcana', 'history', 'investigation', 'nature', 'religion'],
      metadata: { source: 'SRD 5.2', page: 9, srd52: true }
    },
    {
      id: 'utilize',
      name: 'Utilize',
      type: 'activity',
      activityType: 'action',
      roles: ['character'],
      summary: 'Use a nonmagical object.',
      usesRules: ['object-interaction'],
      metadata: { source: 'SRD 5.2', page: 9, srd52: true }
    },
    {
      id: 'improvise',
      name: 'Improvise Action',
      type: 'activity',
      activityType: 'action',
      roles: ['character'],
      summary: 'Do something not covered by standard actions. The GM determines if it\'s possible and what D20 Test is required.',
      usesRules: ['d20-test'],
      metadata: { source: 'SRD 5.2', page: 9, srd52: true, improvised: true }
    }
  ],

  // GM Activities
  gmActivities: [
    {
      id: 'gm-describe-scene',
      name: 'Describe Scene',
      type: 'activity',
      activityType: 'gm-narration',
      roles: ['game-master'],
      summary: 'Describe the environment, creatures, objects, and events visible to the characters.',
      outputs: ['scene-description', 'available-options'],
      metadata: { source: 'SRD 5.2', page: 5 }
    },
    {
      id: 'gm-narrate-results',
      name: 'Narrate Results',
      type: 'activity',
      activityType: 'gm-narration',
      roles: ['game-master'],
      summary: 'Describe the outcome of player actions. May call for die rolls for uncertain outcomes.',
      inputs: ['declared-actions'],
      outputs: ['action-results', 'scene-updates'],
      usesRules: ['d20-test', 'ability-check', 'attack-roll', 'saving-throw'],
      metadata: { source: 'SRD 5.2', page: 5 }
    },
    {
      id: 'gm-determine-dc',
      name: 'Determine Difficulty Class',
      type: 'activity',
      activityType: 'gm-adjudication',
      roles: ['game-master'],
      summary: 'Set the DC for ability checks and saving throws based on task difficulty.',
      usesRules: ['difficulty-class'],
      metadata: { source: 'SRD 5.2' }
    },
    {
      id: 'gm-improvise-ruling',
      name: 'Make Ruling',
      type: 'activity',
      activityType: 'gm-adjudication',
      roles: ['game-master'],
      summary: 'Determine how to resolve improvised actions or unclear situations.',
      principle: 'exceptions-supersede-general-rules',
      metadata: { source: 'SRD 5.2', page: 5 }
    }
  ],

  // Constraints
  constraints: {
    oneActionPerTurn: {
      rule: 'You can take only one action at a time.',
      description: 'In combat and other structured situations, characters are limited to one main action per turn.',
      source: 'SRD 5.2, p. 9'
    },
    bonusActions: {
      rule: 'You can take only one Bonus Action on your turn.',
      description: 'Bonus Actions are granted by specific abilities, spells, or features. You can only take one per turn.',
      source: 'SRD 5.2, p. 10'
    },
    reactions: {
      rule: 'When you take a Reaction, you can\'t take another one until the start of your next turn.',
      description: 'Reactions are instant responses to triggers that can occur on any turn.',
      source: 'SRD 5.2, p. 10'
    }
  },

  metadata: {
    source: 'SRD 5.2',
    page: 9,
    type: 'subsystem'
  }
};

export default actionEconomy;
