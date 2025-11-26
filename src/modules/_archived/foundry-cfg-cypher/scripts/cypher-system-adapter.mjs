/**
 * Cypher System Adapter
 * Maps official Cypher System to Core Concepts format
 *
 * Follows the same pattern as DnD5eMapper - no local data duplication.
 * Loads CSRD data from external OG-CSRD source and registers with TypesRegistry.
 *
 * LICENSE: Module code is MIT.
 * CSRD content is from Cypher System Open License (CSOL).
 * See LICENSE-CSOL for CSRD attribution.
 */

const MODULE_ID = 'foundry-cfg-cypher';
const MODULE_TITLE = 'CFG Cypher Bridge';

export class CypherSystemAdapter {
  constructor() {
    this.config = null;
    this.csrdTypes = {
      descriptors: [],
      types: [],
      foci: []
    };
    this.loaded = false;
  }

  /**
   * Initialize and load official Cypher System config
   */
  async initialize() {
    console.log(`${MODULE_TITLE} | Initializing Cypher System adapter...`);

    // Get official Cypher System config (if available)
    // Note: Cypher System v3.4.3 may not expose CONFIG.CYPHERSYSTEM like D&D 5e does
    // We'll check for it, but the main data comes from OG-CSRD
    this.config = game.cyphersystem?.config || game.system.config || {};

    console.log(`${MODULE_TITLE} | Cypher System config loaded (version ${game.system.version})`);

    // Load CSRD data from external source
    await this.loadCSRDData();

    this.loaded = true;
    return true;
  }

  /**
   * Load CSRD data from OG-CSRD external source
   * This keeps CSRD data separate from the module (following 5e pattern)
   */
  async loadCSRDData() {
    console.log(`${MODULE_TITLE} | Loading CSRD data from OG-CSRD...`);

    try {
      // In development, load from local file
      // In production, this could be a CDN or API endpoint
      const csrdPath = 'C:\\Users\\hobda\\Projects\\Crit-Fumble\\Notes\\.data\\C2\\og-csrd\\db\\og-csrd.json';

      // Try to load from file (development mode)
      // Note: This will work in Electron/Node.js but not in browser
      // For browser, we'd need to fetch from a URL
      const response = await fetch(`file:///${csrdPath}`).catch(() => null);

      if (!response || !response.ok) {
        console.warn(`${MODULE_TITLE} | Could not load OG-CSRD from file, using minimal fallback data`);
        this.loadFallbackData();
        return;
      }

      const csrdData = await response.json();

      // Extract descriptors
      this.csrdTypes.descriptors = this.extractDescriptors(csrdData.characterdescriptor || []);

      // Extract types (we'll add the 4 core types manually since they're standard)
      this.csrdTypes.types = this.getCoreTypes();

      // Extract foci
      this.csrdTypes.foci = this.extractFoci(csrdData.characterfocus || []);

      console.log(`${MODULE_TITLE} | CSRD data loaded: ${this.csrdTypes.descriptors.length} descriptors, ${this.csrdTypes.types.length} types, ${this.csrdTypes.foci.length} foci`);
    } catch (error) {
      console.error(`${MODULE_TITLE} | Error loading CSRD data:`, error);
      this.loadFallbackData();
    }
  }

  /**
   * Extract descriptors from OG-CSRD HTML format
   */
  extractDescriptors(htmlArray) {
    return htmlArray.map(html => {
      const text = this.extractText(html);
      const id = this.extractId(html);
      const { category, subcategory } = this.categorizeDescriptor(id, text);

      return {
        id: id || text.toLowerCase().replace(/\s+/g, '-'),
        name: text,
        category,
        subcategory,
        source: 'csrd',
        tags: [category, subcategory]
      };
    }).filter((descriptor, index, self) =>
      // Remove duplicates by name
      index === self.findIndex(d => d.name === descriptor.name)
    );
  }

  /**
   * Extract foci from OG-CSRD HTML format
   */
  extractFoci(htmlArray) {
    return htmlArray.map(html => {
      const text = this.extractText(html);
      const id = this.extractId(html);

      // Categorize foci by keyword in ID
      let category = 'core';
      if (id.includes('fantasy-')) category = 'fantasy';
      else if (id.includes('modern-')) category = 'modern';
      else if (id.includes('science-fiction-')) category = 'science-fiction';
      else if (id.includes('horror-')) category = 'horror';
      else if (id.includes('superhero-')) category = 'superhero';
      else if (id.includes('post-apocalyptic-')) category = 'post-apocalyptic';
      else if (id.includes('fairy-tale-')) category = 'fairy-tale';
      else if (id.includes('weird-west-')) category = 'weird-west';
      else if (id.includes('cyberpunk-')) category = 'cyberpunk';

      return {
        id: id || text.toLowerCase().replace(/\s+/g, '-'),
        name: text,
        category,
        subcategory: 'focus',
        source: 'csrd',
        tags: [category, 'focus']
      };
    }).filter((focus, index, self) =>
      // Remove duplicates by name
      index === self.findIndex(f => f.name === focus.name)
    );
  }

  /**
   * Get the 4 core Cypher System types
   * These are standard and don't change
   */
  getCoreTypes() {
    return [
      {
        id: 'type-warrior',
        name: 'Warrior',
        category: 'core',
        subcategory: 'type',
        description: 'Warriors are physical characters who solve problems through combat, whether with weapons, fists, or feet.',
        source: 'csrd',
        tags: ['core', 'combat', 'physical']
      },
      {
        id: 'type-adept',
        name: 'Adept',
        category: 'core',
        subcategory: 'type',
        description: 'Adepts are usually clever, learned people who solve problems through knowledge and understanding.',
        source: 'csrd',
        tags: ['core', 'magic', 'knowledge']
      },
      {
        id: 'type-explorer',
        name: 'Explorer',
        category: 'core',
        subcategory: 'type',
        description: 'Explorers are characters who like to discover new places and uncover secrets.',
        source: 'csrd',
        tags: ['core', 'exploration', 'stealth']
      },
      {
        id: 'type-speaker',
        name: 'Speaker',
        category: 'core',
        subcategory: 'type',
        description: 'Speakers are smooth talkers who solve problems through wit, charm, and understanding people.',
        source: 'csrd',
        tags: ['core', 'social', 'persuasion']
      }
    ];
  }

  /**
   * Load minimal fallback data if OG-CSRD not available
   */
  loadFallbackData() {
    console.log(`${MODULE_TITLE} | Using fallback CSRD data (core types only)`);

    // At minimum, we have the 4 core types
    this.csrdTypes.types = this.getCoreTypes();

    // Basic descriptors (most common)
    this.csrdTypes.descriptors = [
      { id: 'clever', name: 'Clever', category: 'core', subcategory: 'descriptor', source: 'csrd', tags: ['core', 'descriptor'] },
      { id: 'tough', name: 'Tough', category: 'core', subcategory: 'descriptor', source: 'csrd', tags: ['core', 'descriptor'] },
      { id: 'swift', name: 'Swift', category: 'core', subcategory: 'descriptor', source: 'csrd', tags: ['core', 'descriptor'] },
      { id: 'charming', name: 'Charming', category: 'core', subcategory: 'descriptor', source: 'csrd', tags: ['core', 'descriptor'] }
    ];

    // Basic foci (most common)
    this.csrdTypes.foci = [
      { id: 'masters-weaponry', name: 'Masters Weaponry', category: 'core', subcategory: 'focus', source: 'csrd', tags: ['core', 'focus'] },
      { id: 'explores-dark-places', name: 'Explores Dark Places', category: 'core', subcategory: 'focus', source: 'csrd', tags: ['core', 'focus'] },
      { id: 'focuses-mind-over-matter', name: 'Focuses Mind Over Matter', category: 'core', subcategory: 'focus', source: 'csrd', tags: ['core', 'focus'] },
      { id: 'leads', name: 'Leads', category: 'core', subcategory: 'focus', source: 'csrd', tags: ['core', 'focus'] }
    ];
  }

  /**
   * Register CSRD types with Core Concepts TypesRegistry
   */
  registerWithCoreСoncepts() {
    if (!game.coreConcepts?.types) {
      console.error(`${MODULE_TITLE} | Core Concepts TypesRegistry not available`);
      return false;
    }

    console.log(`${MODULE_TITLE} | Registering CSRD types with Core Concepts...`);

    // Register descriptors
    for (const descriptor of this.csrdTypes.descriptors) {
      game.coreConcepts.types.registerType('cypher-descriptor', {
        id: descriptor.id,
        name: descriptor.name,
        category: descriptor.category,
        subcategory: descriptor.subcategory,
        tags: descriptor.tags,
        metadata: {
          source: descriptor.source
        }
      });
    }

    // Register types
    for (const type of this.csrdTypes.types) {
      game.coreConcepts.types.registerType('cypher-type', {
        id: type.id,
        name: type.name,
        category: type.category,
        subcategory: type.subcategory,
        description: type.description,
        tags: type.tags,
        metadata: {
          source: type.source
        }
      });
    }

    // Register foci
    for (const focus of this.csrdTypes.foci) {
      game.coreConcepts.types.registerType('cypher-focus', {
        id: focus.id,
        name: focus.name,
        category: focus.category,
        subcategory: focus.subcategory,
        tags: focus.tags,
        metadata: {
          source: focus.source
        }
      });
    }

    console.log(`${MODULE_TITLE} | CSRD types registered with Core Concepts`);
    return true;
  }

  /**
   * Map Cypher System actor to Core Concepts creature
   * This is the main adapter method called by sync
   */
  mapActorToCreature(actor) {
    if (actor.type === 'pc') {
      return this.mapPCToCreature(actor);
    }

    if (actor.type === 'npc') {
      return this.mapNPCToCreature(actor);
    }

    // Unsupported actor types (companion, community, vehicle, marker)
    return null;
  }

  /**
   * Map PC actor to creature
   */
  mapPCToCreature(actor) {
    return {
      name: actor.name,
      race: actor.system.basic?.descriptor || '',
      class: actor.system.basic?.type || '',
      level: actor.system.basic?.tier || 1,
      imageUrl: actor.img,
      alignment: null,
      stats: {
        might: actor.system.pools?.might || { value: 0, max: 0, edge: 0 },
        speed: actor.system.pools?.speed || { value: 0, max: 0, edge: 0 },
        intellect: actor.system.pools?.intellect || { value: 0, max: 0, edge: 0 }
      },
      inventory: actor.items.contents.map(i => ({
        itemId: i.id,
        name: i.name,
        count: i.system.quantity || 1
      })),
      metadata: {
        cypher: {
          // Character sentence
          descriptor: actor.system.basic?.descriptor || '',
          type: actor.system.basic?.type || '',
          focus: actor.system.basic?.focus || '',
          tier: actor.system.basic?.tier || 1,

          // Stat pools
          pools: {
            might: actor.system.pools?.might || {},
            speed: actor.system.pools?.speed || {},
            intellect: actor.system.pools?.intellect || {},
            additional: actor.system.pools?.additional || {}
          },

          // Damage track
          damageTrack: {
            state: actor.system.combat?.damageTrack?.state || 'Hale',
            applyImpaired: actor.system.combat?.damageTrack?.applyImpaired ?? true,
            applyDebilitated: actor.system.combat?.damageTrack?.applyDebilitated ?? true
          },

          // Recovery rolls
          recoveries: {
            roll: actor.system.combat?.recoveries?.roll || '1d6+1',
            oneAction: actor.system.combat?.recoveries?.oneAction || false,
            tenMinutes: actor.system.combat?.recoveries?.tenMinutes || false,
            oneHour: actor.system.combat?.recoveries?.oneHour || false,
            tenHours: actor.system.combat?.recoveries?.tenHours || false
          },

          // Armor
          armor: {
            rating: actor.system.combat?.armor?.rating || 0,
            speedCost: actor.system.combat?.armor?.speedCost || 0
          },

          // Cypher limit
          cypherLimit: actor.system.combat?.cypherLimit || 2,

          // Effort
          effort: actor.system.basic?.effort || 1,

          // XP
          xp: actor.system.basic?.xp || 0
        },
        foundryId: actor.id,
        foundryActorType: actor.type,
        systemName: 'cyphersystem',
        systemVersion: game.system.version
      },
      tags: this.extractTags(actor)
    };
  }

  /**
   * Map NPC actor to creature
   */
  mapNPCToCreature(actor) {
    return {
      name: actor.name,
      level: actor.system.basic?.level || 1,
      imageUrl: actor.img,
      stats: {
        health: actor.system.combat?.health || 0,
        damage: actor.system.combat?.damage || 0,
        armor: actor.system.combat?.armor || 0
      },
      metadata: {
        cypher: {
          level: actor.system.basic?.level || 1,
          health: actor.system.combat?.health || 0,
          damage: actor.system.combat?.damage || 0,
          armor: actor.system.combat?.armor || 0,
          modifications: actor.system.basic?.modifications || '',
          movement: actor.system.basic?.movement || 'short',
          description: actor.system.description || ''
        },
        foundryId: actor.id,
        foundryActorType: actor.type,
        systemName: 'cyphersystem',
        systemVersion: game.system.version
      },
      tags: this.extractTags(actor)
    };
  }

  /**
   * Map Cypher System item to Core Concepts RpgItem
   */
  mapItemToRpgItem(item) {
    return {
      name: item.name,
      title: item.name,
      description: item.system.description || '',
      thingType: item.type,
      properties: item.system,
      imageUrl: item.img,
      systemName: 'cyphersystem',
      metadata: {
        cypher: {
          itemType: item.type,
          level: item.system.basic?.level,
          form: item.system.basic?.form,
          effect: item.system.basic?.effect,
          depletion: item.system.basic?.depletion,
          price: item.system.basic?.price
        },
        foundryId: item.id,
        systemVersion: game.system.version
      },
      tags: this.extractTags(item)
    };
  }

  /**
   * Map Cypher System scene to Core Concepts RpgBoard
   */
  mapSceneToBoard(scene) {
    return {
      name: scene.name,
      description: scene.navName || scene.name,
      backgroundUrl: scene.background?.src,
      width: scene.width,
      height: scene.height,
      gridSize: scene.grid.size,
      gridType: scene.grid.type === 1 ? 'square' : 'hex',
      tokens: scene.tokens.contents.map(t => ({
        id: t.id,
        x: t.x,
        y: t.y,
        actorId: t.actorId,
        name: t.name,
        img: t.texture.src
      })),
      metadata: {
        cypher: {
          sceneType: 'scene',
          tiles: scene.tiles.contents.map(t => ({
            id: t.id,
            x: t.x,
            y: t.y,
            width: t.width,
            height: t.height,
            texture: t.texture.src,
            z: t.z
          })),
          walls: scene.walls.contents.map(w => ({
            id: w.id,
            coords: w.c
          })),
          lights: scene.lights.contents.map(l => ({
            id: l.id,
            x: l.x,
            y: l.y
          }))
        },
        foundryId: scene.id,
        systemName: 'cyphersystem',
        systemVersion: game.system.version
      },
      tags: this.extractTags(scene)
    };
  }

  /**
   * Extract tags from document (folders, flags, etc.)
   */
  extractTags(document) {
    const tags = ['cyphersystem'];

    if (document.folder) {
      tags.push(document.folder.name);
    }

    if (document.flags?.tags) {
      tags.push(...document.flags.tags);
    }

    return [...new Set(tags)];
  }

  /**
   * Helper: Extract text from HTML anchor tag
   */
  extractText(html) {
    const match = html.match(/>([^<]+)</);
    return match ? match[1].trim() : html;
  }

  /**
   * Helper: Extract ID from HTML anchor
   */
  extractId(html) {
    const match = html.match(/#([^']+)'/);
    return match ? match[1] : null;
  }

  /**
   * Helper: Categorize descriptor by prefix
   */
  categorizeDescriptor(id, text) {
    if (!id) return { category: 'core', subcategory: 'descriptor' };

    if (id.startsWith('fantasy-species-')) return { category: 'fantasy', subcategory: 'species' };
    if (id.startsWith('modern-magic-descriptor-')) return { category: 'modern-magic', subcategory: 'descriptor' };
    if (id.startsWith('post-apocalyptic-descriptor-')) return { category: 'post-apocalyptic', subcategory: 'descriptor' };
    if (id.startsWith('post-apocalyptic-species-')) return { category: 'post-apocalyptic', subcategory: 'species' };
    if (id.startsWith('science-fiction-species-')) return { category: 'science-fiction', subcategory: 'species' };
    if (id.startsWith('superhero-descriptor-')) return { category: 'superhero', subcategory: 'descriptor' };
    if (id.startsWith('fairy-tale-descriptor-')) return { category: 'fairy-tale', subcategory: 'descriptor' };
    if (id.startsWith('weird-west-descriptor-')) return { category: 'weird-west', subcategory: 'descriptor' };
    if (id.startsWith('weird-west-species-')) return { category: 'weird-west', subcategory: 'species' };
    if (id.startsWith('cyberpunk-descriptor-')) return { category: 'cyberpunk', subcategory: 'descriptor' };

    return { category: 'core', subcategory: 'descriptor' };
  }

  /**
   * Get filtered options for a specific game mode
   */
  getFilteredOptions(gameMode = 'cypher') {
    let categoryFilter;

    switch (gameMode) {
      case 'numenera':
        categoryFilter = ['core', 'fantasy', 'science-fiction'];
        break;
      case 'the-strange':
        categoryFilter = ['core', 'fantasy', 'modern', 'science-fiction'];
        break;
      case 'predation':
        categoryFilter = ['core', 'science-fiction', 'post-apocalyptic'];
        break;
      case 'gods-of-the-fall':
        categoryFilter = ['core', 'fantasy', 'superhero'];
        break;
      case 'unmasked':
        categoryFilter = ['core', 'superhero'];
        break;
      case 'fairy-tale':
        categoryFilter = ['core', 'fairy-tale', 'fantasy'];
        break;
      case 'weird-west':
        categoryFilter = ['core', 'weird-west'];
        break;
      case 'cyberpunk':
        categoryFilter = ['core', 'cyberpunk', 'science-fiction'];
        break;
      default:
        // Generic Cypher - all categories
        return {
          descriptors: this.csrdTypes.descriptors,
          types: this.csrdTypes.types,
          foci: this.csrdTypes.foci
        };
    }

    return {
      descriptors: this.csrdTypes.descriptors.filter(d =>
        categoryFilter.includes(d.category)
      ),
      types: this.csrdTypes.types.filter(t =>
        categoryFilter.includes(t.category)
      ),
      foci: this.csrdTypes.foci.filter(f =>
        categoryFilter.includes(f.category)
      )
    };
  }
}
