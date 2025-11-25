/**
 * Rhythm of Play Subsystem
 * The fundamental 3-step pattern of D&D gameplay
 *
 * Source: SRD 5.2 - Playing the Game > Rhythm of Play
 */

export const rhythmOfPlay = {
  id: 'rhythm-of-play',
  name: 'Rhythm of Play',
  type: 'subsystem',
  category: 'core',
  description: 'The basic pattern that governs all D&D play across social interaction, exploration, and combat.',

  // The three pillars of play
  pillars: ['social-interaction', 'exploration', 'combat'],

  // The core 3-step cycle
  cycle: [
    {
      step: 1,
      name: 'GM Describes Scene',
      activity: 'gm-describe-scene',
      roles: ['game-master'],
      description: 'The GM tells the players where their adventurers are and what\'s around them.',
      outputs: ['scene-description', 'available-options']
    },
    {
      step: 2,
      name: 'Players Describe Actions',
      activity: 'player-declare-action',
      roles: ['character'],
      description: 'Players describe what their characters do. In combat, characters take turns. Outside combat, the GM ensures every character has a chance to act.',
      inputs: ['scene-description', 'available-options'],
      outputs: ['declared-actions']
    },
    {
      step: 3,
      name: 'GM Narrates Results',
      activity: 'gm-narrate-results',
      roles: ['game-master'],
      description: 'The GM describes the outcome of actions. May require die rolls for uncertain outcomes. Results often lead back to step 1.',
      inputs: ['declared-actions'],
      outputs: ['action-results', 'scene-updates'],
      usesRules: ['d20-test', 'ability-check', 'attack-roll', 'saving-throw'],
      loops: true // Returns to step 1
    }
  ],

  // Core principle
  principle: {
    name: 'Exceptions Supersede General Rules',
    description: 'General rules govern the game, but specific features (class abilities, spells, etc.) can override them. When an exception and general rule disagree, the exception wins.'
  },

  metadata: {
    source: 'SRD 5.2',
    page: 5,
    type: 'subsystem',
    fundamental: true // This is the most basic subsystem
  }
};

export default rhythmOfPlay;
