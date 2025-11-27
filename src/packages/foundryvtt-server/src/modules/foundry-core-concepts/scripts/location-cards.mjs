/**
 * Location Cards System
 *
 * Extends Foundry's card system to support location/map cards that can be used
 * to quickly set up scenes at the table. Inspired by physical map cards used in IRL play.
 *
 * A Location Card can contain:
 * - Background map image(s) on card faces
 * - Grid configuration (type, size, scale)
 * - Initial token/tile placements
 * - Lighting and walls setup
 * - Location metadata (type, danger level, etc.)
 *
 * Usage:
 * 1. Create a card with type "location"
 * 2. Configure grid and initial layout in card's system data
 * 3. Drop card on canvas or use "Create Scene" button to spawn a new scene
 * 4. Scene inherits all settings from the location card template
 */

const MODULE_ID = 'foundry-core-concepts';

export class LocationCardsManager {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the location cards system
   */
  async initialize() {
    console.log('Location Cards | Initializing...');

    // Register custom card type
    this.registerCardType();

    // Register hooks
    this.registerHooks();

    this.initialized = true;
    console.log('Location Cards | Ready');
  }

  /**
   * Register "location" as a custom card type
   */
  registerCardType() {
    // Register with Foundry's type system
    CONFIG.Card.typeLabels = CONFIG.Card.typeLabels || {};
    CONFIG.Card.typeLabels.location = 'Location Card';

    // Add to valid card types if not already present
    if (!CONFIG.Card.types) {
      CONFIG.Card.types = ['base'];
    }
    if (!CONFIG.Card.types.includes('location')) {
      CONFIG.Card.types.push('location');
    }

    console.log('Location Cards | Registered "location" card type');
  }

  /**
   * Create a location card from an existing scene
   * This allows GMs to "snapshot" a scene into a reusable card
   */
  async createCardFromScene(scene, deckId = null) {
    if (!game.user.isGM) {
      ui.notifications.error('Only GMs can create location cards');
      return null;
    }

    // Extract scene data
    const locationData = this.extractSceneData(scene);

    // Create card data
    const cardData = {
      name: scene.name,
      type: 'location',
      description: scene.navName || scene.name,
      system: {
        // Location metadata
        locationType: this.inferLocationType(scene),

        // Grid configuration
        grid: {
          type: scene.grid.type,
          size: scene.grid.size,
          distance: scene.grid.distance,
          units: scene.grid.units,
          color: scene.grid.color,
          alpha: scene.grid.alpha
        },

        // Dimensions
        dimensions: {
          width: scene.width,
          height: scene.height,
          sceneWidth: scene.dimensions.sceneWidth,
          sceneHeight: scene.dimensions.sceneHeight,
          sceneX: scene.dimensions.sceneX,
          sceneY: scene.dimensions.sceneY,
          scaleTier: this.calculateScaleTier(scene.grid.distance)
        },

        // Initial tokens (templates, not actual placed tokens)
        tokenTemplates: locationData.tokens,

        // Initial tiles/background elements
        tiles: locationData.tiles,

        // Walls for line of sight
        walls: locationData.walls,

        // Lighting
        lights: locationData.lights,

        // Ambient sounds
        sounds: locationData.sounds,

        // Weather/environment
        environment: {
          darkness: scene.environment?.darknessLevel || 0,
          globalLight: scene.environment?.globalLight?.enabled || false
        },

        // Flags for Crit-Fumble sync
        critFumble: {
          sourceSceneId: scene.id,
          createdAt: Date.now(),
          version: '1.0'
        }
      },
      faces: [
        {
          name: scene.name,
          text: scene.navName || '',
          img: scene.background?.src || scene.thumb || ''
        }
      ],
      face: 0,
      back: {
        name: 'Location Template',
        text: `<p>Drag onto canvas to create scene</p><p><strong>Grid:</strong> ${scene.grid.type} (${scene.grid.distance}${scene.grid.units})</p>`,
        img: 'icons/svg/castle.svg'
      }
    };

    // Create card in deck or as standalone
    let card;
    if (deckId) {
      const deck = game.cards.get(deckId);
      if (!deck) {
        ui.notifications.error('Deck not found');
        return null;
      }
      card = await deck.createEmbeddedDocuments('Card', [cardData]);
      card = card[0];
    } else {
      // Create standalone Cards document with single card
      const cardsData = {
        name: `${scene.name} (Location)`,
        type: 'deck',
        cards: [cardData]
      };
      const cards = await Cards.create(cardsData);
      card = cards.cards.contents[0];
    }

    ui.notifications.info(`Created location card: ${scene.name}`);
    console.log('Location Cards | Created card from scene:', scene.name);

    return card;
  }

  /**
   * Create a scene from a location card
   */
  async createSceneFromCard(card) {
    if (!game.user.isGM) {
      ui.notifications.error('Only GMs can create scenes');
      return null;
    }

    if (card.type !== 'location') {
      ui.notifications.warn('This card is not a location card');
      return null;
    }

    const systemData = card.system;

    // Build scene data from card
    const sceneData = {
      name: card.name,
      navName: card.currentFace?.name || card.name,
      background: {
        src: card.currentFace?.img || card.back.img
      },

      // Grid from card template
      grid: {
        type: systemData.grid?.type || 1, // 1 = square
        size: systemData.grid?.size || 100,
        distance: systemData.grid?.distance || 5,
        units: systemData.grid?.units || 'ft',
        color: systemData.grid?.color || '#000000',
        alpha: systemData.grid?.alpha || 0.2
      },

      // Dimensions
      width: systemData.dimensions?.width || 4000,
      height: systemData.dimensions?.height || 3000,

      // Environment
      environment: {
        darknessLevel: systemData.environment?.darkness || 0,
        globalLight: {
          enabled: systemData.environment?.globalLight || true
        }
      },

      // Initial state
      initial: {
        x: systemData.dimensions?.sceneX || 0,
        y: systemData.dimensions?.sceneY || 0,
        scale: 1
      },

      // Flags for tracking
      flags: {
        [MODULE_ID]: {
          createdFromCard: card.id,
          locationCardName: card.name,
          locationType: systemData.locationType,
          templateVersion: systemData.critFumble?.version || '1.0'
        }
      }
    };

    // Create the scene
    const scene = await Scene.create(sceneData);

    // Add embedded documents (tokens, tiles, walls, lights, sounds)
    await this.populateSceneFromTemplate(scene, systemData);

    ui.notifications.info(`Created scene from location card: ${card.name}`);
    console.log('Location Cards | Created scene from card:', card.name);

    // Optionally activate the scene
    const shouldActivate = await Dialog.confirm({
      title: 'Activate Scene?',
      content: `<p>Scene "${scene.name}" created successfully. Would you like to activate it now?</p>`,
      defaultYes: true
    });

    if (shouldActivate) {
      await scene.activate();
    }

    return scene;
  }

  /**
   * Populate a scene with embedded documents from a location card template
   */
  async populateSceneFromTemplate(scene, templateData) {
    const promises = [];

    // Add token templates
    if (templateData.tokenTemplates?.length > 0) {
      const tokenData = templateData.tokenTemplates.map(t => ({
        ...t,
        x: t.x || 0,
        y: t.y || 0
      }));
      promises.push(scene.createEmbeddedDocuments('Token', tokenData));
    }

    // Add tiles
    if (templateData.tiles?.length > 0) {
      promises.push(scene.createEmbeddedDocuments('Tile', templateData.tiles));
    }

    // Add walls
    if (templateData.walls?.length > 0) {
      promises.push(scene.createEmbeddedDocuments('Wall', templateData.walls));
    }

    // Add lights
    if (templateData.lights?.length > 0) {
      promises.push(scene.createEmbeddedDocuments('AmbientLight', templateData.lights));
    }

    // Add sounds
    if (templateData.sounds?.length > 0) {
      promises.push(scene.createEmbeddedDocuments('AmbientSound', templateData.sounds));
    }

    await Promise.all(promises);

    console.log('Location Cards | Populated scene with template data');
  }

  /**
   * Extract relevant data from a scene for card template
   */
  extractSceneData(scene) {
    return {
      tokens: scene.tokens.map(t => ({
        name: t.name,
        img: t.texture?.src,
        x: t.x,
        y: t.y,
        rotation: t.rotation,
        elevation: t.elevation,
        hidden: t.hidden,
        locked: t.locked,
        disposition: t.disposition,
        displayName: t.displayName,
        width: t.width,
        height: t.height,
        scale: t.texture?.scaleX || 1,
        flags: {
          [MODULE_ID]: {
            isTemplate: true,
            tokenName: t.name
          }
        }
      })),

      tiles: scene.tiles.map(t => ({
        img: t.texture?.src,
        x: t.x,
        y: t.y,
        width: t.width,
        height: t.height,
        rotation: t.rotation,
        z: t.z,
        hidden: t.hidden,
        locked: t.locked,
        alpha: t.alpha,
        tint: t.tint
      })),

      walls: scene.walls.map(w => ({
        c: w.c, // [x1, y1, x2, y2]
        door: w.door,
        ds: w.ds, // door state
        dir: w.dir,
        move: w.move,
        sight: w.sight,
        sound: w.sound,
        light: w.light
      })),

      lights: scene.lights.map(l => ({
        x: l.x,
        y: l.y,
        rotation: l.rotation,
        config: {
          dim: l.config?.dim || 0,
          bright: l.config?.bright || 0,
          angle: l.config?.angle || 360,
          color: l.config?.color,
          alpha: l.config?.alpha || 0.5,
          animation: l.config?.animation
        },
        hidden: l.hidden,
        locked: l.locked
      })),

      sounds: scene.sounds.map(s => ({
        path: s.path,
        x: s.x,
        y: s.y,
        radius: s.radius,
        volume: s.volume,
        easing: s.easing,
        repeat: s.repeat,
        hidden: s.hidden,
        locked: s.locked
      }))
    };
  }

  /**
   * Infer location type from scene properties
   */
  inferLocationType(scene) {
    const name = scene.name.toLowerCase();

    if (name.includes('dungeon') || name.includes('cave') || name.includes('crypt')) {
      return 'underground';
    }
    if (name.includes('tavern') || name.includes('inn') || name.includes('shop') || name.includes('house')) {
      return 'interior';
    }
    if (name.includes('city') || name.includes('town') || name.includes('village')) {
      return 'settlement';
    }
    if (name.includes('forest') || name.includes('mountain') || name.includes('plains') || name.includes('desert')) {
      return 'wilderness';
    }
    if (name.includes('castle') || name.includes('tower') || name.includes('fortress')) {
      return 'structure';
    }

    return 'location'; // Default
  }

  /**
   * Calculate scale tier based on grid distance
   * Scale tiers match Crit-Fumble's RpgSheet scale system
   */
  calculateScaleTier(gridDistance) {
    // Scale tier 0 = 1 inch (for minis)
    // Scale tier 1 = 5 feet (standard D&D)
    // Scale tier 2 = 10 feet
    // Scale tier 3 = 25 feet
    // Scale tier 4 = 50 feet
    // etc.

    if (gridDistance <= 1) return 0;
    if (gridDistance <= 5) return 1;
    if (gridDistance <= 10) return 2;
    if (gridDistance <= 25) return 3;
    if (gridDistance <= 50) return 4;
    if (gridDistance <= 100) return 5;
    if (gridDistance <= 250) return 6;
    if (gridDistance <= 500) return 7;
    if (gridDistance <= 1000) return 8;
    if (gridDistance <= 5000) return 9;
    if (gridDistance <= 10000) return 10;

    return 11; // Cosmic scale
  }

  /**
   * Register hooks for location cards system
   */
  registerHooks() {
    // Add "Create Location Card" button to scene configuration
    Hooks.on('getSceneConfigHeaderButtons', (config, buttons) => {
      if (!game.user.isGM) return;

      buttons.unshift({
        label: 'Create Location Card',
        class: 'create-location-card',
        icon: 'fas fa-cards-blank',
        onclick: async () => {
          const scene = config.object;

          // Show dialog to select deck or create standalone
          const decks = game.cards.filter(c => c.type === 'deck');

          let html = '<form><div class="form-group">';
          html += '<label>Add to Deck (optional):</label>';
          html += '<select name="deck">';
          html += '<option value="">-- Standalone Card --</option>';
          for (const deck of decks) {
            html += `<option value="${deck.id}">${deck.name}</option>`;
          }
          html += '</select>';
          html += '</div></form>';

          new Dialog({
            title: 'Create Location Card',
            content: html,
            buttons: {
              create: {
                label: 'Create Card',
                callback: async (html) => {
                  const deckId = html.find('[name="deck"]').val();
                  await this.createCardFromScene(scene, deckId || null);
                }
              },
              cancel: {
                label: 'Cancel'
              }
            },
            default: 'create'
          }).render(true);
        }
      });
    });

    // Add "Create Scene" button to location card sheets
    Hooks.on('renderCardConfig', (config, html) => {
      const card = config.object;

      if (card.type !== 'location') return;
      if (!game.user.isGM) return;

      // Add button to header
      const header = html.find('.window-header');
      const button = $(`
        <a class="create-scene-from-card" title="Create Scene from this Location Card">
          <i class="fas fa-map"></i> Create Scene
        </a>
      `);

      button.on('click', async (event) => {
        event.preventDefault();
        await this.createSceneFromCard(card);
      });

      header.find('.window-title').after(button);

      // Style the button
      button.css({
        'margin-left': '10px',
        'padding': '4px 8px',
        'background': 'rgba(0, 0, 0, 0.2)',
        'border-radius': '3px',
        'cursor': 'pointer'
      });
    });

    // Add drag-to-canvas functionality for location cards
    Hooks.on('dropCanvasData', async (canvas, data) => {
      if (data.type !== 'Card') return true;

      const card = await fromUuid(data.uuid);
      if (!card || card.type !== 'location') return true;

      // Prevent default and create scene instead
      if (game.user.isGM) {
        ui.notifications.info('Creating scene from location card...');
        await this.createSceneFromCard(card);
        return false; // Prevent default drop behavior
      }

      return true;
    });

    // Add context menu option to cards in card stacks
    Hooks.on('getCardsDirectoryEntryContext', (html, options) => {
      options.push({
        name: 'Create Scene from Location Cards',
        icon: '<i class="fas fa-map"></i>',
        condition: (li) => {
          const cards = game.cards.get(li.data('documentId'));
          return game.user.isGM && cards && cards.cards.some(c => c.type === 'location');
        },
        callback: async (li) => {
          const cardsDoc = game.cards.get(li.data('documentId'));
          const locationCards = cardsDoc.cards.filter(c => c.type === 'location');

          if (locationCards.length === 1) {
            await this.createSceneFromCard(locationCards[0]);
            return;
          }

          // Show selection dialog
          let html = '<form><div class="form-group">';
          html += '<label>Select Location Card:</label>';
          html += '<select name="card">';
          for (const card of locationCards) {
            html += `<option value="${card.id}">${card.name}</option>`;
          }
          html += '</select>';
          html += '</div></form>';

          new Dialog({
            title: 'Create Scene from Card',
            content: html,
            buttons: {
              create: {
                label: 'Create Scene',
                callback: async (html) => {
                  const cardId = html.find('[name="card"]').val();
                  const card = cardsDoc.cards.get(cardId);
                  await this.createSceneFromCard(card);
                }
              },
              cancel: {
                label: 'Cancel'
              }
            },
            default: 'create'
          }).render(true);
        }
      });
    });
  }

  /**
   * Cleanup
   */
  async cleanup() {
    this.initialized = false;
  }
}
