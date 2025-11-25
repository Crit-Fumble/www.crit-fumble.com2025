/**
 * D&D 5e Conditions
 * Core Concepts data format
 */

export const conditions = [
  {
    id: 'blinded',
    name: 'Blinded',
    type: 'condition',
    category: 'impairment',
    description: 'A blinded creature can\'t see and automatically fails any ability check that requires sight. Attack rolls against the creature have advantage, and the creature\'s attack rolls have disadvantage.',
    icon: 'icons/svg/blind.svg',
    effects: [
      { type: 'auto-fail', check: 'sight-based' },
      { type: 'advantage', target: 'attacks-against' },
      { type: 'disadvantage', target: 'attack-rolls' }
    ],
    tags: ['impairment', 'vision', 'combat'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Conditions'
    }
  },
  {
    id: 'charmed',
    name: 'Charmed',
    type: 'condition',
    category: 'mental',
    description: 'A charmed creature can\'t attack the charmer or target the charmer with harmful abilities or magical effects. The charmer has advantage on any ability check to interact socially with the creature.',
    icon: 'icons/svg/daze.svg',
    effects: [
      { type: 'cant-attack', target: 'charmer' },
      { type: 'cant-target-harmful', target: 'charmer' },
      { type: 'advantage', source: 'charmer', check: 'social-interaction' }
    ],
    tags: ['mental', 'social', 'restriction'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Conditions'
    }
  },
  {
    id: 'deafened',
    name: 'Deafened',
    type: 'condition',
    category: 'impairment',
    description: 'A deafened creature can\'t hear and automatically fails any ability check that requires hearing.',
    icon: 'icons/svg/deaf.svg',
    effects: [
      { type: 'auto-fail', check: 'hearing-based' }
    ],
    tags: ['impairment', 'hearing'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Conditions'
    }
  },
  {
    id: 'frightened',
    name: 'Frightened',
    type: 'condition',
    category: 'mental',
    description: 'A frightened creature has disadvantage on ability checks and attack rolls while the source of its fear is within line of sight. The creature can\'t willingly move closer to the source of its fear.',
    icon: 'icons/svg/terror.svg',
    effects: [
      { type: 'disadvantage', target: 'ability-checks', condition: 'source-visible' },
      { type: 'disadvantage', target: 'attack-rolls', condition: 'source-visible' },
      { type: 'movement-restriction', restriction: 'cant-move-closer', target: 'source' }
    ],
    tags: ['mental', 'fear', 'combat', 'movement'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Conditions'
    }
  },
  {
    id: 'grappled',
    name: 'Grappled',
    type: 'condition',
    category: 'movement',
    description: 'A grappled creature\'s speed becomes 0, and it can\'t benefit from any bonus to its speed. The condition ends if the grappler is incapacitated or if an effect removes the grappled creature from the reach of the grappler or grappling effect.',
    icon: 'icons/svg/net.svg',
    effects: [
      { type: 'set-speed', value: 0 },
      { type: 'ignore-bonus', target: 'speed' }
    ],
    tags: ['movement', 'restraint', 'combat'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Conditions'
    }
  },
  {
    id: 'incapacitated',
    name: 'Incapacitated',
    type: 'condition',
    category: 'impairment',
    description: 'An incapacitated creature can\'t take actions or reactions.',
    icon: 'icons/svg/unconscious.svg',
    effects: [
      { type: 'cant-act', target: 'actions' },
      { type: 'cant-act', target: 'reactions' }
    ],
    tags: ['impairment', 'action', 'severe'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Conditions'
    }
  },
  {
    id: 'invisible',
    name: 'Invisible',
    type: 'condition',
    category: 'concealment',
    description: 'An invisible creature is impossible to see without the aid of magic or a special sense. For the purpose of hiding, the creature is heavily obscured. The creature\'s location can be detected by any noise it makes or any tracks it leaves. Attack rolls against the creature have disadvantage, and the creature\'s attack rolls have advantage.',
    icon: 'icons/svg/invisible.svg',
    effects: [
      { type: 'concealment', level: 'heavy-obscurement' },
      { type: 'disadvantage', target: 'attacks-against' },
      { type: 'advantage', target: 'attack-rolls' }
    ],
    tags: ['concealment', 'vision', 'combat'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Conditions'
    }
  },
  {
    id: 'paralyzed',
    name: 'Paralyzed',
    type: 'condition',
    category: 'impairment',
    description: 'A paralyzed creature is incapacitated and can\'t move or speak. The creature automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage. Any attack that hits the creature is a critical hit if the attacker is within 5 feet of the creature.',
    icon: 'icons/svg/paralysis.svg',
    effects: [
      { type: 'apply-condition', condition: 'incapacitated' },
      { type: 'cant-move' },
      { type: 'cant-speak' },
      { type: 'auto-fail', save: 'strength' },
      { type: 'auto-fail', save: 'dexterity' },
      { type: 'advantage', target: 'attacks-against' },
      { type: 'auto-crit', condition: 'within-5ft' }
    ],
    tags: ['impairment', 'movement', 'severe', 'combat'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Conditions'
    }
  },
  {
    id: 'petrified',
    name: 'Petrified',
    type: 'condition',
    category: 'transformation',
    description: 'A petrified creature is transformed, along with any nonmagical object it is wearing or carrying, into a solid inanimate substance (usually stone). Its weight increases by a factor of ten, and it ceases aging. The creature is incapacitated, can\'t move or speak, and is unaware of its surroundings. Attack rolls against the creature have advantage. The creature automatically fails Strength and Dexterity saving throws. The creature has resistance to all damage. The creature is immune to poison and disease, although a poison or disease already in its system is suspended, not neutralized.',
    icon: 'icons/svg/statue.svg',
    effects: [
      { type: 'transformation', material: 'stone' },
      { type: 'weight-multiplier', value: 10 },
      { type: 'stop-aging' },
      { type: 'apply-condition', condition: 'incapacitated' },
      { type: 'cant-move' },
      { type: 'cant-speak' },
      { type: 'unaware' },
      { type: 'advantage', target: 'attacks-against' },
      { type: 'auto-fail', save: 'strength' },
      { type: 'auto-fail', save: 'dexterity' },
      { type: 'resistance', target: 'all-damage' },
      { type: 'immunity', target: 'poison' },
      { type: 'immunity', target: 'disease' }
    ],
    tags: ['transformation', 'severe', 'immunity'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Conditions'
    }
  },
  {
    id: 'poisoned',
    name: 'Poisoned',
    type: 'condition',
    category: 'impairment',
    description: 'A poisoned creature has disadvantage on attack rolls and ability checks.',
    icon: 'icons/svg/poison.svg',
    effects: [
      { type: 'disadvantage', target: 'attack-rolls' },
      { type: 'disadvantage', target: 'ability-checks' }
    ],
    tags: ['impairment', 'poison', 'combat'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Conditions'
    }
  },
  {
    id: 'prone',
    name: 'Prone',
    type: 'condition',
    category: 'position',
    description: 'A prone creature\'s only movement option is to crawl, unless it stands up and thereby ends the condition. The creature has disadvantage on attack rolls. An attack roll against the creature has advantage if the attacker is within 5 feet of the creature. Otherwise, the attack roll has disadvantage.',
    icon: 'icons/svg/falling.svg',
    effects: [
      { type: 'movement-restriction', restriction: 'crawl-only' },
      { type: 'disadvantage', target: 'attack-rolls' },
      { type: 'advantage', target: 'attacks-against', condition: 'within-5ft' },
      { type: 'disadvantage', target: 'attacks-against', condition: 'beyond-5ft' }
    ],
    tags: ['position', 'movement', 'combat'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Conditions'
    }
  },
  {
    id: 'restrained',
    name: 'Restrained',
    type: 'condition',
    category: 'movement',
    description: 'A restrained creature\'s speed becomes 0, and it can\'t benefit from any bonus to its speed. Attack rolls against the creature have advantage, and the creature\'s attack rolls have disadvantage. The creature has disadvantage on Dexterity saving throws.',
    icon: 'icons/svg/chains.svg',
    effects: [
      { type: 'set-speed', value: 0 },
      { type: 'ignore-bonus', target: 'speed' },
      { type: 'advantage', target: 'attacks-against' },
      { type: 'disadvantage', target: 'attack-rolls' },
      { type: 'disadvantage', save: 'dexterity' }
    ],
    tags: ['movement', 'restraint', 'combat'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Conditions'
    }
  },
  {
    id: 'stunned',
    name: 'Stunned',
    type: 'condition',
    category: 'impairment',
    description: 'A stunned creature is incapacitated, can\'t move, and can speak only falteringly. The creature automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage.',
    icon: 'icons/svg/stoned.svg',
    effects: [
      { type: 'apply-condition', condition: 'incapacitated' },
      { type: 'cant-move' },
      { type: 'speech-impairment', level: 'faltering' },
      { type: 'auto-fail', save: 'strength' },
      { type: 'auto-fail', save: 'dexterity' },
      { type: 'advantage', target: 'attacks-against' }
    ],
    tags: ['impairment', 'movement', 'severe', 'combat'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Conditions'
    }
  },
  {
    id: 'unconscious',
    name: 'Unconscious',
    type: 'condition',
    category: 'impairment',
    description: 'An unconscious creature is incapacitated, can\'t move or speak, and is unaware of its surroundings. The creature drops whatever it\'s holding and falls prone. The creature automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage. Any attack that hits the creature is a critical hit if the attacker is within 5 feet of the creature.',
    icon: 'icons/svg/sleep.svg',
    effects: [
      { type: 'apply-condition', condition: 'incapacitated' },
      { type: 'cant-move' },
      { type: 'cant-speak' },
      { type: 'unaware' },
      { type: 'drop-held-items' },
      { type: 'apply-condition', condition: 'prone' },
      { type: 'auto-fail', save: 'strength' },
      { type: 'auto-fail', save: 'dexterity' },
      { type: 'advantage', target: 'attacks-against' },
      { type: 'auto-crit', condition: 'within-5ft' }
    ],
    tags: ['impairment', 'severe', 'unconsciousness', 'combat'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Conditions'
    }
  },
  {
    id: 'exhaustion',
    name: 'Exhaustion',
    type: 'condition',
    category: 'resource-depletion',
    description: 'Exhaustion is measured in six levels. An effect can give a creature one or more levels of exhaustion.',
    icon: 'icons/svg/down.svg',
    levels: [
      { level: 1, effect: 'Disadvantage on ability checks' },
      { level: 2, effect: 'Speed halved' },
      { level: 3, effect: 'Disadvantage on attack rolls and saving throws' },
      { level: 4, effect: 'Hit point maximum halved' },
      { level: 5, effect: 'Speed reduced to 0' },
      { level: 6, effect: 'Death' }
    ],
    effects: [
      { type: 'stackable', levels: 6 }
    ],
    tags: ['resource-depletion', 'stacking', 'severe'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Conditions'
    }
  }
];
