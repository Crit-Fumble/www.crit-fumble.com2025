/**
 * D&D 5e Damage Types
 * Core Concepts data format
 */

export const damageTypes = [
  {
    id: 'acid',
    name: 'Acid',
    type: 'damage-type',
    category: 'elemental',
    description: 'Corrosive effects that eat through materials.',
    icon: 'icons/svg/acid.svg',
    color: '#00ff00',
    tags: ['elemental', 'physical'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Damage Types'
    }
  },
  {
    id: 'bludgeoning',
    name: 'Bludgeoning',
    type: 'damage-type',
    category: 'physical',
    description: 'Blunt force attacks.',
    icon: 'icons/svg/hammer.svg',
    color: '#8b4513',
    tags: ['physical', 'weapon'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Damage Types'
    }
  },
  {
    id: 'cold',
    name: 'Cold',
    type: 'damage-type',
    category: 'elemental',
    description: 'Freezing temperatures and ice.',
    icon: 'icons/svg/frozen.svg',
    color: '#87ceeb',
    tags: ['elemental', 'energy'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Damage Types'
    }
  },
  {
    id: 'fire',
    name: 'Fire',
    type: 'damage-type',
    category: 'elemental',
    description: 'Heat and flames.',
    icon: 'icons/svg/fire.svg',
    color: '#ff4500',
    tags: ['elemental', 'energy'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Damage Types'
    }
  },
  {
    id: 'force',
    name: 'Force',
    type: 'damage-type',
    category: 'magical',
    description: 'Pure magical energy focused into a damaging form.',
    icon: 'icons/svg/explosion.svg',
    color: '#ff00ff',
    tags: ['magical', 'energy'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Damage Types'
    }
  },
  {
    id: 'lightning',
    name: 'Lightning',
    type: 'damage-type',
    category: 'elemental',
    description: 'Electrical discharge.',
    icon: 'icons/svg/lightning.svg',
    color: '#ffff00',
    tags: ['elemental', 'energy'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Damage Types'
    }
  },
  {
    id: 'necrotic',
    name: 'Necrotic',
    type: 'damage-type',
    category: 'magical',
    description: 'Energy that withers matter and the soul.',
    icon: 'icons/svg/skull.svg',
    color: '#4b0082',
    tags: ['magical', 'death'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Damage Types'
    }
  },
  {
    id: 'piercing',
    name: 'Piercing',
    type: 'damage-type',
    category: 'physical',
    description: 'Puncturing and impaling attacks.',
    icon: 'icons/svg/sword.svg',
    color: '#696969',
    tags: ['physical', 'weapon'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Damage Types'
    }
  },
  {
    id: 'poison',
    name: 'Poison',
    type: 'damage-type',
    category: 'physical',
    description: 'Venomous and toxic substances.',
    icon: 'icons/svg/poison.svg',
    color: '#32cd32',
    tags: ['physical', 'poison'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Damage Types'
    }
  },
  {
    id: 'psychic',
    name: 'Psychic',
    type: 'damage-type',
    category: 'magical',
    description: 'Mental assault that attacks the mind.',
    icon: 'icons/svg/daze.svg',
    color: '#ff1493',
    tags: ['magical', 'mental'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Damage Types'
    }
  },
  {
    id: 'radiant',
    name: 'Radiant',
    type: 'damage-type',
    category: 'magical',
    description: 'Searing light that can burn the undead.',
    icon: 'icons/svg/sun.svg',
    color: '#ffd700',
    tags: ['magical', 'holy', 'energy'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Damage Types'
    }
  },
  {
    id: 'slashing',
    name: 'Slashing',
    type: 'damage-type',
    category: 'physical',
    description: 'Cutting and slicing attacks.',
    icon: 'icons/svg/combat.svg',
    color: '#a9a9a9',
    tags: ['physical', 'weapon'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Damage Types'
    }
  },
  {
    id: 'thunder',
    name: 'Thunder',
    type: 'damage-type',
    category: 'elemental',
    description: 'Concussive blasts of sound.',
    icon: 'icons/svg/sound.svg',
    color: '#4169e1',
    tags: ['elemental', 'energy', 'sound'],
    metadata: {
      source: 'SRD 5.1',
      page: 'Damage Types'
    }
  }
];
