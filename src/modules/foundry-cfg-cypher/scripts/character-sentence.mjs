/**
 * Character Sentence Builder
 *
 * Utilities for building and parsing Cypher System character sentences.
 * Pattern: "I am a [DESCRIPTOR] [TYPE] who [FOCUS]"
 *
 * Examples:
 * - "I am a Clever Nano who Talks to Machines"
 * - "I am a Strong-Willed Jack who Explores Dark Places"
 * - "I am a Mystical Glaive who Bears a Halo of Fire"
 */

export class CharacterSentenceBuilder {
  /**
   * Build a character sentence from components
   *
   * @param {Object} components - Character components
   * @param {string} components.descriptor - Descriptor name
   * @param {string} components.type - Type name
   * @param {string} components.focus - Focus name
   * @returns {string} Character sentence
   */
  static build({ descriptor, type, focus }) {
    if (!descriptor || !type || !focus) {
      return '';
    }

    return `I am a ${descriptor} ${type} who ${focus}`;
  }

  /**
   * Parse a character sentence into components
   *
   * @param {string} sentence - Character sentence
   * @returns {Object|null} Parsed components or null if invalid
   */
  static parse(sentence) {
    if (!sentence) {
      return null;
    }

    // Match pattern: "I am a [descriptor] [type] who [focus]"
    const match = sentence.match(/^I am a (.+?) (.+?) who (.+)$/i);

    if (!match) {
      return null;
    }

    const [, descriptor, type, focus] = match;

    return {
      descriptor: descriptor.trim(),
      type: type.trim(),
      focus: focus.trim()
    };
  }

  /**
   * Validate a character sentence
   *
   * @param {string} sentence - Character sentence
   * @returns {boolean} True if valid
   */
  static validate(sentence) {
    return this.parse(sentence) !== null;
  }

  /**
   * Get a formatted sentence with proper article
   *
   * @param {Object} components - Character components
   * @returns {string} Formatted sentence with proper article (a/an)
   */
  static buildWithArticle({ descriptor, type, focus }) {
    if (!descriptor || !type || !focus) {
      return '';
    }

    // Determine if descriptor starts with a vowel sound
    const article = this.getArticle(descriptor);

    return `I am ${article} ${descriptor} ${type} who ${focus}`;
  }

  /**
   * Get the appropriate article (a/an) for a word
   *
   * @param {string} word - Word to check
   * @returns {string} 'a' or 'an'
   */
  static getArticle(word) {
    const vowelSounds = /^[aeiou]/i;

    // Special cases
    const startsWithU = /^u/i.test(word);
    const startsWithO = /^o/i.test(word);

    // "an" for most vowel sounds, except "u" sounds like "you"
    if (vowelSounds.test(word)) {
      if (startsWithU && !/^uni|^usu|^eur/i.test(word)) {
        return 'a';
      }
      return 'an';
    }

    // "an" for silent h (hour, honest, etc.)
    if (/^h(our|onest|onor)/i.test(word)) {
      return 'an';
    }

    return 'a';
  }

  /**
   * Extract components from an actor
   *
   * @param {Actor} actor - Cypher System actor
   * @returns {Object} Character components
   */
  static extractFromActor(actor) {
    return {
      descriptor: actor.system.basic?.descriptor || '',
      type: actor.system.basic?.type || '',
      focus: actor.system.basic?.focus || ''
    };
  }

  /**
   * Build sentence from an actor
   *
   * @param {Actor} actor - Cypher System actor
   * @returns {string} Character sentence
   */
  static buildFromActor(actor) {
    const components = this.extractFromActor(actor);
    return this.build(components);
  }

  /**
   * Update actor with sentence components
   *
   * @param {Actor} actor - Cypher System actor
   * @param {Object} components - Character components
   */
  static async updateActor(actor, { descriptor, type, focus }) {
    await actor.update({
      'system.basic.descriptor': descriptor || '',
      'system.basic.type': type || '',
      'system.basic.focus': focus || ''
    });
  }

  /**
   * Get a formatted display for character sheet
   *
   * @param {Object} components - Character components
   * @returns {string} HTML formatted sentence
   */
  static buildHTML({ descriptor, type, focus }) {
    if (!descriptor && !type && !focus) {
      return '<em>Character sentence not set</em>';
    }

    const descriptorHTML = descriptor
      ? `<strong>${descriptor}</strong>`
      : '<em>descriptor</em>';

    const typeHTML = type
      ? `<strong>${type}</strong>`
      : '<em>type</em>';

    const focusHTML = focus
      ? `<strong>${focus}</strong>`
      : '<em>focus</em>';

    return `I am a ${descriptorHTML} ${typeHTML} who ${focusHTML}`;
  }

  /**
   * Get component status (complete/incomplete)
   *
   * @param {Object} components - Character components
   * @returns {Object} Status object
   */
  static getStatus({ descriptor, type, focus }) {
    return {
      hasDescriptor: !!descriptor,
      hasType: !!type,
      hasFocus: !!focus,
      isComplete: !!(descriptor && type && focus)
    };
  }

  /**
   * Get missing components
   *
   * @param {Object} components - Character components
   * @returns {string[]} Array of missing component names
   */
  static getMissing({ descriptor, type, focus }) {
    const missing = [];

    if (!descriptor) missing.push('descriptor');
    if (!type) missing.push('type');
    if (!focus) missing.push('focus');

    return missing;
  }

  /**
   * Create a character sentence template for a specific game
   *
   * @param {string} gameMode - Game mode (numenera, the-strange, etc.)
   * @returns {Object} Template with examples
   */
  static getTemplate(gameMode) {
    const templates = {
      numenera: {
        pattern: 'I am a [DESCRIPTOR] [TYPE] who [FOCUS]',
        examples: [
          'I am a Clever Nano who Talks to Machines',
          'I am a Mystical Glaive who Bears a Halo of Fire',
          'I am a Strong-Willed Jack who Explores Dark Places'
        ],
        types: ['Glaive', 'Nano', 'Jack'],
        description: 'In the Ninth World of Numenera'
      },
      'the-strange': {
        pattern: 'I am a [DESCRIPTOR] [TYPE] who [FOCUS]',
        examples: [
          'I am a Skeptical Vector who Solves Mysteries',
          'I am a Intelligent Paradox who Translates',
          'I am a Graceful Spinner who Entertains'
        ],
        types: ['Vector', 'Paradox', 'Spinner'],
        description: 'A traveler of The Strange'
      },
      cypher: {
        pattern: 'I am a [DESCRIPTOR] [TYPE] who [FOCUS]',
        examples: [
          'I am a Tough Warrior who Masters Weaponry',
          'I am a Clever Adept who Focuses Mind Over Matter',
          'I am a Swift Explorer who Explores Dark Places',
          'I am a Charming Speaker who Leads'
        ],
        types: ['Warrior', 'Adept', 'Explorer', 'Speaker'],
        description: 'A hero in the Cypher System'
      }
    };

    return templates[gameMode] || templates.cypher;
  }
}
