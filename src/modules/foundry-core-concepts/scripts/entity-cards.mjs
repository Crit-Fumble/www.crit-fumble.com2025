/**
 * Entity Cards System
 *
 * Cards are TEMPLATES/COMPENDIUM entries (reusable blueprints)
 * Sheets are INSTANCES/IMPLEMENTATIONS (tracked in actual play)
 *
 * Extends Foundry's card system to support core concept cards:
 * - Location Cards → Spawn Location Sheets (RpgSheet type: location)
 * - Creature Cards → Define creatures (RpgCreature with default token config)
 * - Thing Cards → Define items (RpgThing with default token config)
 * - Event Cards → Spawn Events (RpgEvent instances)
 * - Goal Cards → Define Goals (RpgGoal instances)
 * - Type Cards → Define categories for creatures/things (expansion system)
 * - Role Cards → Define permissions and special rules for creatures (player/GM/team roles)
 *
 * Architecture:
 * - CARD = Template (like compendium entry) - reusable, immutable blueprint
 * - SHEET/ENTITY = Instance (like active scene) - stateful, modified during play
 *
 * Examples:
 * - "Goblin" Creature Card → RpgCreature (with default token) → Multiple tokens on boards
 * - "Tavern" Location Card → Active Tavern Location Sheet with current state
 * - "Magic Sword" Thing Card → RpgThing (with default token) → Items in inventories
 * - "Combat Begins" Event Card → RpgEvent logged to session
 * - "Defeat the Dragon" Goal Card → RpgGoal tracked for campaign
 * - "Dragon" Type Card → Applied to all dragon creatures, can be disabled to filter them out
 *
 * Token System:
 * - Creature/Thing cards include default token appearance (references RpgAsset)
 * - RpgToken instances reference RpgCreature or RpgThing + position on board
 * - RpgAsset can be single image or sprite sheet
 *
 * Type System (Expansion Support):
 * - Type cards define creature types, classes, item categories, damage types
 * - GMs can enable/disable types to control which entities are available
 * - Expansion packs add new types via decks (e.g., "Psionics Expansion" adds "Psionic" class)
 * - Disabling a type filters out all creatures/things of that type
 *
 * Role System (Access Control & Permissions):
 * - Role cards define permissions and special rules for creatures
 * - Roles are assigned to creatures (players or NPCs) to grant permissions
 * - Control card visibility (GM-only cards, player-accessible cards)
 * - Examples: Game Master, Player, Captain, Scout, Spymaster
 * - Unique roles can only be assigned to one creature
 * - Prerequisites: can require specific types or other roles
 *
 * Card Access Control:
 * - Cards can be restricted to specific roles via `system.restrictedToRoles`
 * - GM-only cards: marked with restrictedToRoles: ['gm']
 * - Role permissions define which card types creatures can view/use/edit
 * - filterCardsByRoleAccess() filters cards by creature's roles
 *
 * Events are data-driven and depend on:
 * - Modes: Combat, Exploration, Social, Travel, etc.
 * - Systems: Specific game system rules (D&D, Pathfinder, etc.)
 * - Rules: Custom rule sets defined in the campaign
 *
 * This mirrors physical card usage at the table where GMs have pre-made
 * cards for common creatures, items, locations, events, and campaign goals.
 * The deck-building approach allows GMs to assemble campaigns from base + content + expansion decks.
 */

const MODULE_ID = 'foundry-core-concepts';

export class EntityCardsManager {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the entity cards system
   */
  async initialize() {
    console.log('Entity Cards | Initializing...');

    // Register custom card types
    this.registerCardTypes();

    // Register hooks
    this.registerHooks();

    this.initialized = true;
    console.log('Entity Cards | Ready');
  }

  /**
   * Register custom card types
   */
  registerCardTypes() {
    CONFIG.Card.typeLabels = CONFIG.Card.typeLabels || {};
    CONFIG.Card.typeLabels.location = 'Location Card';
    CONFIG.Card.typeLabels.creature = 'Creature Card';
    CONFIG.Card.typeLabels.thing = 'Thing Card';
    CONFIG.Card.typeLabels.event = 'Event Card';
    CONFIG.Card.typeLabels.goal = 'Goal Card';
    CONFIG.Card.typeLabels.type = 'Type Card';
    CONFIG.Card.typeLabels.role = 'Role Card';

    if (!CONFIG.Card.types) {
      CONFIG.Card.types = ['base'];
    }

    const customTypes = ['location', 'creature', 'thing', 'event', 'goal', 'type', 'role'];
    for (const type of customTypes) {
      if (!CONFIG.Card.types.includes(type)) {
        CONFIG.Card.types.push(type);
      }
    }

    console.log('Entity Cards | Registered custom card types: location, creature, thing, event, goal, type, role');
  }

  /* ========================================
   * LOCATION CARDS
   * ======================================== */

  /**
   * Create a location card from an existing scene
   */
  async createLocationCardFromScene(scene, deckId = null) {
    if (!game.user.isGM) {
      ui.notifications.error('Only GMs can create location cards');
      return null;
    }

    const locationData = this.extractSceneData(scene);

    const cardData = {
      name: scene.name,
      type: 'location',
      description: scene.navName || scene.name,
      system: {
        entityType: 'location',
        locationType: this.inferLocationType(scene),
        grid: {
          type: scene.grid.type,
          size: scene.grid.size,
          distance: scene.grid.distance,
          units: scene.grid.units,
          color: scene.grid.color,
          alpha: scene.grid.alpha
        },
        dimensions: {
          width: scene.width,
          height: scene.height,
          sceneWidth: scene.dimensions.sceneWidth,
          sceneHeight: scene.dimensions.sceneHeight,
          sceneX: scene.dimensions.sceneX,
          sceneY: scene.dimensions.sceneY,
          scaleTier: this.calculateScaleTier(scene.grid.distance)
        },
        tokenTemplates: locationData.tokens,
        tiles: locationData.tiles,
        walls: locationData.walls,
        lights: locationData.lights,
        sounds: locationData.sounds,
        environment: {
          darkness: scene.environment?.darknessLevel || 0,
          globalLight: scene.environment?.globalLight?.enabled || false
        },
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
        text: `<p>Drag onto canvas to create scene</p><p><strong>Grid:</strong> ${scene.grid.type === 1 ? 'Square' : 'Hex'} (${scene.grid.distance}${scene.grid.units})</p>`,
        img: 'icons/svg/castle.svg'
      }
    };

    return await this.createCard(cardData, deckId, 'location');
  }

  /**
   * Create a scene from a location card
   */
  async createSceneFromLocationCard(card) {
    if (!game.user.isGM) {
      ui.notifications.error('Only GMs can create scenes');
      return null;
    }

    if (card.type !== 'location') {
      ui.notifications.warn('This card is not a location card');
      return null;
    }

    const systemData = card.system;

    const sceneData = {
      name: card.name,
      navName: card.currentFace?.name || card.name,
      background: {
        src: card.currentFace?.img || card.back.img
      },
      grid: {
        type: systemData.grid?.type || 1,
        size: systemData.grid?.size || 100,
        distance: systemData.grid?.distance || 5,
        units: systemData.grid?.units || 'ft',
        color: systemData.grid?.color || '#000000',
        alpha: systemData.grid?.alpha || 0.2
      },
      width: systemData.dimensions?.width || 4000,
      height: systemData.dimensions?.height || 3000,
      environment: {
        darknessLevel: systemData.environment?.darkness || 0,
        globalLight: {
          enabled: systemData.environment?.globalLight || true
        }
      },
      initial: {
        x: systemData.dimensions?.sceneX || 0,
        y: systemData.dimensions?.sceneY || 0,
        scale: 1
      },
      flags: {
        [MODULE_ID]: {
          createdFromCard: card.id,
          entityCardName: card.name,
          entityType: 'location',
          locationType: systemData.locationType,
          templateVersion: systemData.critFumble?.version || '1.0'
        }
      }
    };

    const scene = await Scene.create(sceneData);
    await this.populateSceneFromTemplate(scene, systemData);

    ui.notifications.info(`Created scene from location card: ${card.name}`);
    console.log('Entity Cards | Created scene from location card:', card.name);

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

  /* ========================================
   * CREATURE CARDS
   * ======================================== */

  /**
   * Create a creature card from an existing actor
   */
  async createCreatureCardFromActor(actor, deckId = null) {
    if (!game.user.isGM) {
      ui.notifications.error('Only GMs can create creature cards');
      return null;
    }

    const actorData = actor.toObject();

    const cardData = {
      name: actor.name,
      type: 'creature',
      description: actorData.system?.details?.biography?.value || actor.name,
      system: {
        entityType: 'creature',
        creatureType: actorData.type,

        // Store complete actor data for recreation
        actorData: {
          name: actor.name,
          type: actor.type,
          img: actor.img,
          system: actorData.system,
          items: actorData.items,
          effects: actorData.effects,
          flags: actorData.flags,
          prototypeToken: actorData.prototypeToken
        },

        // Quick reference stats (for card display)
        stats: this.extractCreatureStats(actor),

        // Crit-Fumble metadata
        critFumble: {
          sourceActorId: actor.id,
          createdAt: Date.now(),
          version: '1.0'
        }
      },
      faces: [
        {
          name: actor.name,
          text: this.formatCreatureCardText(actor),
          img: actor.img || actor.prototypeToken?.texture?.src || 'icons/svg/mystery-man.svg'
        }
      ],
      face: 0,
      back: {
        name: 'Creature Template',
        text: `<p>Drag onto scene to create token</p><p><strong>Type:</strong> ${actorData.type}</p>`,
        img: 'icons/svg/mystery-man.svg'
      }
    };

    return await this.createCard(cardData, deckId, 'creature');
  }

  /**
   * Create an actor from a creature card
   */
  async createActorFromCreatureCard(card) {
    if (!game.user.isGM) {
      ui.notifications.error('Only GMs can create actors');
      return null;
    }

    if (card.type !== 'creature') {
      ui.notifications.warn('This card is not a creature card');
      return null;
    }

    const actorData = card.system.actorData;

    // Create the actor
    const actor = await Actor.create({
      ...actorData,
      flags: {
        ...actorData.flags,
        [MODULE_ID]: {
          createdFromCard: card.id,
          entityCardName: card.name,
          entityType: 'creature',
          templateVersion: card.system.critFumble?.version || '1.0'
        }
      }
    });

    ui.notifications.info(`Created actor from creature card: ${card.name}`);
    console.log('Entity Cards | Created actor from creature card:', card.name);

    return actor;
  }

  /**
   * Create a token on the current scene from a creature card
   */
  async createTokenFromCreatureCard(card, x = 0, y = 0) {
    if (!game.user.isGM) {
      ui.notifications.error('Only GMs can create tokens');
      return null;
    }

    if (card.type !== 'creature') {
      ui.notifications.warn('This card is not a creature card');
      return null;
    }

    if (!canvas.scene) {
      ui.notifications.warn('No active scene');
      return null;
    }

    // First, create or find the actor
    let actor = game.actors.find(a =>
      a.getFlag(MODULE_ID, 'createdFromCard') === card.id
    );

    if (!actor) {
      actor = await this.createActorFromCreatureCard(card);
    }

    // Create token on scene
    const tokenData = {
      ...actor.prototypeToken,
      x: x,
      y: y,
      actorId: actor.id
    };

    const tokens = await canvas.scene.createEmbeddedDocuments('Token', [tokenData]);

    ui.notifications.info(`Placed ${card.name} on scene`);
    console.log('Entity Cards | Created token from creature card:', card.name);

    return tokens[0];
  }

  /* ========================================
   * THING CARDS
   * ======================================== */

  /**
   * Create a thing card from an existing item
   */
  async createThingCardFromItem(item, deckId = null) {
    if (!game.user.isGM) {
      ui.notifications.error('Only GMs can create thing cards');
      return null;
    }

    const itemData = item.toObject();

    const cardData = {
      name: item.name,
      type: 'thing',
      description: itemData.system?.description?.value || item.name,
      system: {
        entityType: 'thing',
        thingType: itemData.type,

        // Store complete item data for recreation
        itemData: {
          name: item.name,
          type: item.type,
          img: item.img,
          system: itemData.system,
          effects: itemData.effects,
          flags: itemData.flags
        },

        // Quick reference stats (for card display)
        stats: this.extractThingStats(item),

        // Crit-Fumble metadata
        critFumble: {
          sourceItemId: item.id,
          createdAt: Date.now(),
          version: '1.0'
        }
      },
      faces: [
        {
          name: item.name,
          text: this.formatThingCardText(item),
          img: item.img || 'icons/svg/item-bag.svg'
        }
      ],
      face: 0,
      back: {
        name: 'Item Template',
        text: `<p>Drag onto actor to add item</p><p><strong>Type:</strong> ${itemData.type}</p>`,
        img: 'icons/svg/item-bag.svg'
      }
    };

    return await this.createCard(cardData, deckId, 'thing');
  }

  /**
   * Create an item from a thing card
   */
  async createItemFromThingCard(card) {
    if (!game.user.isGM) {
      ui.notifications.error('Only GMs can create items');
      return null;
    }

    if (card.type !== 'thing') {
      ui.notifications.warn('This card is not a thing card');
      return null;
    }

    const itemData = card.system.itemData;

    // Create the item
    const item = await Item.create({
      ...itemData,
      flags: {
        ...itemData.flags,
        [MODULE_ID]: {
          createdFromCard: card.id,
          entityCardName: card.name,
          entityType: 'thing',
          templateVersion: card.system.critFumble?.version || '1.0'
        }
      }
    });

    ui.notifications.info(`Created item from thing card: ${card.name}`);
    console.log('Entity Cards | Created item from thing card:', card.name);

    return item;
  }

  /**
   * Add an item to an actor from a thing card
   */
  async addItemToActorFromThingCard(card, actor) {
    if (!game.user.isGM && actor.id !== game.user.character?.id) {
      ui.notifications.error('You cannot add items to this actor');
      return null;
    }

    if (card.type !== 'thing') {
      ui.notifications.warn('This card is not a thing card');
      return null;
    }

    if (!actor) {
      ui.notifications.warn('No actor specified');
      return null;
    }

    const itemData = {
      ...card.system.itemData,
      flags: {
        ...card.system.itemData.flags,
        [MODULE_ID]: {
          createdFromCard: card.id,
          entityCardName: card.name,
          entityType: 'thing',
          templateVersion: card.system.critFumble?.version || '1.0'
        }
      }
    };

    const items = await actor.createEmbeddedDocuments('Item', [itemData]);

    ui.notifications.info(`Added ${card.name} to ${actor.name}`);
    console.log('Entity Cards | Added item to actor from thing card:', card.name);

    return items[0];
  }

  /* ========================================
   * EVENT CARDS
   * ======================================== */

  /**
   * Create an event card from template data
   * Events are data-driven and depend on modes, systems, and rules
   */
  async createEventCard(eventData, deckId = null) {
    if (!game.user.isGM) {
      ui.notifications.error('Only GMs can create event cards');
      return null;
    }

    const cardData = {
      name: eventData.name,
      type: 'event',
      description: eventData.description || '',
      system: {
        entityType: 'event',
        eventType: eventData.eventType || 'custom', // combat, social, exploration, etc.

        // Mode-specific data (combat, exploration, social, travel, etc.)
        mode: eventData.mode || null,

        // System-specific rules (D&D, Pathfinder, etc.)
        system: eventData.system || null,

        // Custom rules that apply to this event
        rules: eventData.rules || [],

        // Event trigger conditions
        triggers: eventData.triggers || [],

        // Event effects/outcomes
        effects: eventData.effects || [],

        // Event participants (creature cards, locations, etc.)
        participants: eventData.participants || [],

        // Event metadata
        metadata: {
          duration: eventData.duration,
          difficulty: eventData.difficulty,
          tags: eventData.tags || []
        },

        // Crit-Fumble metadata
        critFumble: {
          createdAt: Date.now(),
          version: '1.0'
        }
      },
      faces: [
        {
          name: eventData.name,
          text: this.formatEventCardText(eventData),
          img: eventData.image || 'icons/svg/dice-target.svg'
        }
      ],
      face: 0,
      back: {
        name: 'Event Template',
        text: `<p>Play this card to trigger event</p><p><strong>Type:</strong> ${eventData.eventType}</p>`,
        img: 'icons/svg/dice-target.svg'
      }
    };

    return await this.createCard(cardData, deckId, 'event');
  }

  /**
   * Trigger an event from an event card
   * Creates an RpgEvent entry in the game log
   */
  async triggerEventFromCard(card) {
    if (!game.user.isGM) {
      ui.notifications.error('Only GMs can trigger events');
      return null;
    }

    if (card.type !== 'event') {
      ui.notifications.warn('This card is not an event card');
      return null;
    }

    const eventData = card.system;

    // Create chat message for the event
    const chatData = {
      user: game.user.id,
      speaker: { alias: 'Game Master' },
      content: `
        <div class="event-card">
          <h3>${card.name}</h3>
          <p>${card.description || ''}</p>
          ${eventData.mode ? `<p><strong>Mode:</strong> ${eventData.mode}</p>` : ''}
          ${eventData.metadata?.difficulty ? `<p><strong>Difficulty:</strong> ${eventData.metadata.difficulty}</p>` : ''}
        </div>
      `,
      flags: {
        [MODULE_ID]: {
          eventCard: card.id,
          eventType: eventData.eventType,
          mode: eventData.mode,
          system: eventData.system,
          timestamp: Date.now()
        }
      }
    };

    const message = await ChatMessage.create(chatData);

    // Apply event effects based on rules
    if (eventData.effects && game.coreConcepts?.rules) {
      for (const effect of eventData.effects) {
        await game.coreConcepts.rules.applyEffect(effect);
      }
    }

    // Trigger custom hook for other systems
    Hooks.callAll('coreConcepts.eventTriggered', card, eventData);

    ui.notifications.info(`Event triggered: ${card.name}`);
    console.log('Entity Cards | Event triggered from card:', card.name);

    return message;
  }

  /* ========================================
   * GOAL CARDS
   * ======================================== */

  /**
   * Create a goal card from template data
   */
  async createGoalCard(goalData, deckId = null) {
    if (!game.user.isGM) {
      ui.notifications.error('Only GMs can create goal cards');
      return null;
    }

    const cardData = {
      name: goalData.name,
      type: 'goal',
      description: goalData.description || '',
      system: {
        entityType: 'goal',
        goalType: goalData.goalType || 'quest', // quest, achievement, milestone, etc.

        // Goal status
        status: 'active', // active, completed, failed, hidden

        // Goal requirements
        requirements: goalData.requirements || [],

        // Goal rewards
        rewards: goalData.rewards || [],

        // Parent/child goal hierarchy
        parentGoalId: goalData.parentGoalId || null,
        subgoals: goalData.subgoals || [],

        // Progress tracking
        progress: {
          current: 0,
          max: goalData.progressMax || 100,
          metric: goalData.progressMetric || 'percentage'
        },

        // Goal metadata
        metadata: {
          difficulty: goalData.difficulty,
          priority: goalData.priority || 'normal',
          tags: goalData.tags || [],
          assignedTo: goalData.assignedTo || [] // Player/character IDs
        },

        // Crit-Fumble metadata
        critFumble: {
          createdAt: Date.now(),
          version: '1.0'
        }
      },
      faces: [
        {
          name: goalData.name,
          text: this.formatGoalCardText(goalData),
          img: goalData.image || 'icons/svg/target.svg'
        }
      ],
      face: 0,
      back: {
        name: 'Goal Template',
        text: `<p>Track this campaign goal</p><p><strong>Type:</strong> ${goalData.goalType}</p>`,
        img: 'icons/svg/target.svg'
      }
    };

    return await this.createCard(cardData, deckId, 'goal');
  }

  /**
   * Activate a goal from a goal card
   * Adds goal to active campaign tracking
   */
  async activateGoalFromCard(card) {
    if (!game.user.isGM) {
      ui.notifications.error('Only GMs can activate goals');
      return null;
    }

    if (card.type !== 'goal') {
      ui.notifications.warn('This card is not a goal card');
      return null;
    }

    const goalData = card.system;

    // Create journal entry for goal tracking
    const journalData = {
      name: card.name,
      content: `
        <h2>${card.name}</h2>
        <p>${card.description || ''}</p>
        <h3>Requirements:</h3>
        <ul>
          ${goalData.requirements.map(req => `<li>${req}</li>`).join('')}
        </ul>
        <h3>Rewards:</h3>
        <ul>
          ${goalData.rewards.map(reward => `<li>${reward}</li>`).join('')}
        </ul>
        <h3>Progress:</h3>
        <p>${goalData.progress.current} / ${goalData.progress.max} ${goalData.progress.metric}</p>
      `,
      flags: {
        [MODULE_ID]: {
          goalCard: card.id,
          goalType: goalData.goalType,
          status: goalData.status,
          progress: goalData.progress,
          createdAt: Date.now()
        }
      }
    };

    const journal = await JournalEntry.create(journalData);

    // Create chat announcement
    await ChatMessage.create({
      user: game.user.id,
      speaker: { alias: 'Game Master' },
      content: `
        <div class="goal-announcement">
          <h3>New Goal: ${card.name}</h3>
          <p>${card.description || ''}</p>
        </div>
      `
    });

    // Trigger custom hook
    Hooks.callAll('coreConcepts.goalActivated', card, goalData, journal);

    ui.notifications.info(`Goal activated: ${card.name}`);
    console.log('Entity Cards | Goal activated from card:', card.name);

    return journal;
  }

  /**
   * Update goal progress
   */
  async updateGoalProgress(card, progressDelta) {
    if (card.type !== 'goal') {
      ui.notifications.warn('This card is not a goal card');
      return null;
    }

    const newProgress = Math.min(
      card.system.progress.max,
      card.system.progress.current + progressDelta
    );

    await card.update({
      'system.progress.current': newProgress
    });

    // Check if goal completed
    if (newProgress >= card.system.progress.max && card.system.status === 'active') {
      await card.update({ 'system.status': 'completed' });

      await ChatMessage.create({
        user: game.user.id,
        speaker: { alias: 'Game Master' },
        content: `
          <div class="goal-completed">
            <h3>Goal Completed: ${card.name}</h3>
            <p>${card.description || ''}</p>
            ${card.system.rewards.length ? `<p><strong>Rewards:</strong> ${card.system.rewards.join(', ')}</p>` : ''}
          </div>
        `
      });

      Hooks.callAll('coreConcepts.goalCompleted', card);
    }

    return card;
  }

  /* ========================================
   * TYPE CARDS
   * ======================================== */

  /**
   * Create a type card from template data
   * Type cards define categories for creatures, things, and other entities
   * They grant properties, abilities, and rules to entities of that type
   *
   * Types enable:
   * - Expansion packs (add new types via decks)
   * - Campaign filtering (disable types to remove entities)
   * - Shared properties (all Dragons get certain abilities)
   */
  async createTypeCard(typeData, deckId = null) {
    if (!game.user.isGM) {
      ui.notifications.error('Only GMs can create type cards');
      return null;
    }

    const cardData = {
      name: typeData.name,
      type: 'type',
      description: typeData.description || '',
      system: {
        entityType: 'type',

        // What category of entity does this type apply to?
        // 'creature' = creature types (Dragon, Humanoid, Undead)
        // 'class' = character classes (Fighter, Wizard, Rogue)
        // 'item' = item categories (Weapon, Armor, Potion)
        // 'damage' = damage types (Fire, Cold, Slashing)
        // 'custom' = other type categories
        category: typeData.category || 'creature',

        // Is this type enabled in the current campaign?
        enabled: typeData.enabled !== false,

        // Properties granted to entities of this type
        properties: typeData.properties || {},

        // Abilities granted to entities of this type
        abilities: typeData.abilities || [],

        // Rules that apply to entities of this type
        rules: typeData.rules || [],

        // Related types (parent/child relationships)
        // Example: "Chromatic Dragon" is a child of "Dragon"
        parentType: typeData.parentType || null,
        childTypes: typeData.childTypes || [],

        // Expansion pack this type belongs to
        expansionPack: typeData.expansionPack || null,

        // Tags for filtering and searching
        tags: typeData.tags || [],

        // Crit-Fumble metadata
        critFumble: {
          createdAt: Date.now(),
          version: '1.0'
        }
      },
      faces: [
        {
          name: typeData.name,
          text: this.formatTypeCardText(typeData),
          img: typeData.image || this.getDefaultTypeImage(typeData.category)
        }
      ],
      face: 0,
      back: {
        name: 'Type Definition',
        text: `<p>Type: ${typeData.category}</p><p>${typeData.enabled !== false ? 'Enabled' : 'Disabled'}</p>`,
        img: this.getDefaultTypeImage(typeData.category)
      }
    };

    const card = await this.createCard(cardData, deckId, 'type');

    // Register this type with the types registry if available
    if (game.coreConcepts?.types) {
      await game.coreConcepts.types.registerType(card);
    }

    return card;
  }

  /**
   * Enable or disable a type card
   * Disabling a type filters out all entities of that type
   */
  async toggleTypeCard(card, enabled = null) {
    if (!game.user.isGM) {
      ui.notifications.error('Only GMs can toggle types');
      return null;
    }

    if (card.type !== 'type') {
      ui.notifications.warn('This card is not a type card');
      return null;
    }

    const newState = enabled !== null ? enabled : !card.system.enabled;

    await card.update({
      'system.enabled': newState
    });

    // Update the types registry
    if (game.coreConcepts?.types) {
      if (newState) {
        await game.coreConcepts.types.enableType(card);
      } else {
        await game.coreConcepts.types.disableType(card);
      }
    }

    ui.notifications.info(`${card.name} type ${newState ? 'enabled' : 'disabled'}`);
    console.log(`Entity Cards | Type ${newState ? 'enabled' : 'disabled'}:`, card.name);

    return card;
  }

  /**
   * Apply type properties to an entity card
   * Called when creating creatures/things to grant type-based abilities
   */
  async applyTypeToEntity(typeCard, entityCard) {
    if (typeCard.type !== 'type') {
      ui.notifications.warn('Not a type card');
      return null;
    }

    const typeData = typeCard.system;

    // Add type properties to entity
    const updates = {
      'system.appliedTypes': [
        ...(entityCard.system.appliedTypes || []),
        {
          typeId: typeCard.id,
          typeName: typeCard.name,
          properties: typeData.properties,
          abilities: typeData.abilities,
          rules: typeData.rules
        }
      ]
    };

    await entityCard.update(updates);

    ui.notifications.info(`Applied ${typeCard.name} to ${entityCard.name}`);
    console.log('Entity Cards | Applied type to entity:', typeCard.name, entityCard.name);

    return entityCard;
  }

  /**
   * Get all enabled type cards of a specific category
   */
  getEnabledTypes(category = null) {
    const typeCards = game.cards.reduce((acc, deck) => {
      const cards = deck.cards.filter(c =>
        c.type === 'type' &&
        c.system.enabled &&
        (!category || c.system.category === category)
      );
      return acc.concat(cards);
    }, []);

    return typeCards;
  }

  /**
   * Filter entity cards by enabled types
   * Used to hide creatures/things whose types are disabled
   */
  filterEntitiesByEnabledTypes(entityCards, category = null) {
    const enabledTypes = this.getEnabledTypes(category);
    const enabledTypeIds = new Set(enabledTypes.map(t => t.id));

    return entityCards.filter(entity => {
      // If entity has no types applied, it's always available
      if (!entity.system.appliedTypes || entity.system.appliedTypes.length === 0) {
        return true;
      }

      // Entity is available if at least one of its types is enabled
      return entity.system.appliedTypes.some(appliedType =>
        enabledTypeIds.has(appliedType.typeId)
      );
    });
  }

  /**
   * Get all entities that use a specific type
   * Useful for showing what will be affected by disabling a type
   */
  getEntitiesWithType(typeCard) {
    if (typeCard.type !== 'type') {
      return [];
    }

    const entities = game.cards.reduce((acc, deck) => {
      const cards = deck.cards.filter(c =>
        (c.type === 'creature' || c.type === 'thing') &&
        c.system.appliedTypes?.some(at => at.typeId === typeCard.id)
      );
      return acc.concat(cards);
    }, []);

    return entities;
  }

  /**
   * Format type data for card text
   */
  formatTypeCardText(typeData) {
    let text = '<div class="type-details">';

    text += `<p><strong>Category:</strong> ${typeData.category}</p>`;

    if (typeData.expansionPack) {
      text += `<p><strong>Expansion:</strong> ${typeData.expansionPack}</p>`;
    }

    if (typeData.parentType) {
      text += `<p><strong>Parent Type:</strong> ${typeData.parentType}</p>`;
    }

    if (Object.keys(typeData.properties || {}).length > 0) {
      text += '<p><strong>Properties:</strong></p><ul>';
      for (const [key, value] of Object.entries(typeData.properties)) {
        text += `<li>${key}: ${value}</li>`;
      }
      text += '</ul>';
    }

    if (typeData.abilities && typeData.abilities.length > 0) {
      text += '<p><strong>Abilities:</strong></p><ul>';
      for (const ability of typeData.abilities) {
        text += `<li>${typeof ability === 'string' ? ability : ability.name}</li>`;
      }
      text += '</ul>';
    }

    if (typeData.rules && typeData.rules.length > 0) {
      text += '<p><strong>Rules:</strong></p><ul>';
      for (const rule of typeData.rules) {
        text += `<li>${typeof rule === 'string' ? rule : rule.name}</li>`;
      }
      text += '</ul>';
    }

    text += '</div>';
    return text;
  }

  /**
   * Get default image for type category
   */
  getDefaultTypeImage(category) {
    const images = {
      creature: 'icons/svg/mystery-man.svg',
      class: 'icons/svg/book.svg',
      item: 'icons/svg/item-bag.svg',
      damage: 'icons/svg/explosion.svg',
      custom: 'icons/svg/dice-target.svg'
    };

    return images[category] || images.custom;
  }

  /* ========================================
   * ROLE CARDS
   * ======================================== */

  /**
   * Create a role card from template data
   * Role cards define special rules and permissions for creatures (players or NPCs)
   * Roles are distinct from types - they only apply to creatures and define permissions
   *
   * Examples:
   * - Ship roles: Captain, Pilot, Engineer, Gunner
   * - Party roles: Leader, Scout, Face, Healer
   * - Campaign roles: Game Master, Player, Spectator
   * - Special roles: Spymaster, Guild Leader, Noble
   */
  async createRoleCard(roleData, deckId = null) {
    if (!game.user.isGM) {
      ui.notifications.error('Only GMs can create role cards');
      return null;
    }

    const cardData = {
      name: roleData.name,
      type: 'role',
      description: roleData.description || '',
      system: {
        entityType: 'role',

        // What kind of role is this?
        // 'player' = player/character role (party leader, scout)
        // 'gm' = game master role
        // 'spectator' = observer role (no active participation)
        // 'team' = team/organization role (captain, guild master)
        // 'custom' = other role categories
        category: roleData.category || 'player',

        // Is this role currently active/available?
        enabled: roleData.enabled !== false,

        // Permissions granted by this role
        permissions: {
          // Card access control
          canViewCards: roleData.permissions?.canViewCards || [],
          canUseCards: roleData.permissions?.canUseCards || [],
          canEditCards: roleData.permissions?.canEditCards || [],

          // Entity access control
          canViewEntities: roleData.permissions?.canViewEntities || [],
          canControlEntities: roleData.permissions?.canControlEntities || [],
          canEditEntities: roleData.permissions?.canEditEntities || [],

          // System permissions
          canCreateContent: roleData.permissions?.canCreateContent || false,
          canModifyRules: roleData.permissions?.canModifyRules || false,
          canManageTeams: roleData.permissions?.canManageTeams || false,

          // Custom permissions
          custom: roleData.permissions?.custom || {}
        },

        // Properties granted to creatures with this role
        properties: roleData.properties || {},

        // Abilities granted to creatures with this role
        abilities: roleData.abilities || [],

        // Rules that apply to creatures with this role
        rules: roleData.rules || [],

        // Required types or other roles (prerequisites)
        requires: {
          types: roleData.requires?.types || [],
          roles: roleData.requires?.roles || [],
          other: roleData.requires?.other || []
        },

        // Can this role be assigned to multiple creatures?
        unique: roleData.unique || false,

        // Team/organization this role belongs to
        teamId: roleData.teamId || null,

        // Related roles (hierarchy)
        parentRole: roleData.parentRole || null,
        childRoles: roleData.childRoles || [],

        // Tags for filtering and searching
        tags: roleData.tags || [],

        // Crit-Fumble metadata
        critFumble: {
          createdAt: Date.now(),
          version: '1.0'
        }
      },
      faces: [
        {
          name: roleData.name,
          text: this.formatRoleCardText(roleData),
          img: roleData.image || this.getDefaultRoleImage(roleData.category)
        }
      ],
      face: 0,
      back: {
        name: 'Role Definition',
        text: `<p>Category: ${roleData.category}</p><p>${roleData.unique ? 'Unique role' : 'Multiple assignments allowed'}</p>`,
        img: this.getDefaultRoleImage(roleData.category)
      }
    };

    const card = await this.createCard(cardData, deckId, 'role');

    // Register this role with the types registry if available
    if (game.coreConcepts?.types) {
      await game.coreConcepts.types.registerRole(card);
    }

    return card;
  }

  /**
   * Assign a role to a creature (player or NPC)
   */
  async assignRoleToCreature(roleCard, creatureCard) {
    if (!game.user.isGM) {
      ui.notifications.error('Only GMs can assign roles');
      return null;
    }

    if (roleCard.type !== 'role') {
      ui.notifications.warn('Not a role card');
      return null;
    }

    if (creatureCard.type !== 'creature') {
      ui.notifications.warn('Roles can only be assigned to creatures');
      return null;
    }

    const roleData = roleCard.system;

    // Check if role is unique and already assigned
    if (roleData.unique) {
      const existingAssignment = this.getCreaturesWithRole(roleCard);
      if (existingAssignment.length > 0) {
        ui.notifications.warn(`${roleCard.name} is unique and already assigned to ${existingAssignment[0].name}`);
        return null;
      }
    }

    // Check prerequisites
    if (roleData.requires.types.length > 0) {
      const creatureTypes = (creatureCard.system.appliedTypes || []).map(t => t.typeName);
      const hasRequiredType = roleData.requires.types.some(req => creatureTypes.includes(req));
      if (!hasRequiredType) {
        ui.notifications.warn(`${creatureCard.name} does not have required type for ${roleCard.name}`);
        return null;
      }
    }

    // Add role to creature
    const updates = {
      'system.appliedRoles': [
        ...(creatureCard.system.appliedRoles || []),
        {
          roleId: roleCard.id,
          roleName: roleCard.name,
          roleCategory: roleData.category,
          permissions: roleData.permissions,
          properties: roleData.properties,
          abilities: roleData.abilities,
          rules: roleData.rules,
          assignedAt: Date.now()
        }
      ]
    };

    await creatureCard.update(updates);

    ui.notifications.info(`Assigned ${roleCard.name} to ${creatureCard.name}`);
    console.log('Entity Cards | Assigned role to creature:', roleCard.name, creatureCard.name);

    // Trigger hook for role assignment
    Hooks.callAll('coreConcepts.roleAssigned', roleCard, creatureCard);

    return creatureCard;
  }

  /**
   * Remove a role from a creature
   */
  async removeRoleFromCreature(roleCard, creatureCard) {
    if (!game.user.isGM) {
      ui.notifications.error('Only GMs can remove roles');
      return null;
    }

    if (roleCard.type !== 'role') {
      ui.notifications.warn('Not a role card');
      return null;
    }

    if (creatureCard.type !== 'creature') {
      ui.notifications.warn('Roles can only be removed from creatures');
      return null;
    }

    const appliedRoles = creatureCard.system.appliedRoles || [];
    const updatedRoles = appliedRoles.filter(r => r.roleId !== roleCard.id);

    await creatureCard.update({
      'system.appliedRoles': updatedRoles
    });

    ui.notifications.info(`Removed ${roleCard.name} from ${creatureCard.name}`);
    console.log('Entity Cards | Removed role from creature:', roleCard.name, creatureCard.name);

    return creatureCard;
  }

  /**
   * Get all creatures that have a specific role
   */
  getCreaturesWithRole(roleCard) {
    if (roleCard.type !== 'role') {
      return [];
    }

    const creatures = game.cards.reduce((acc, deck) => {
      const cards = deck.cards.filter(c =>
        c.type === 'creature' &&
        c.system.appliedRoles?.some(r => r.roleId === roleCard.id)
      );
      return acc.concat(cards);
    }, []);

    return creatures;
  }

  /**
   * Check if a card is accessible to a creature based on their roles
   */
  isCardAccessibleToCreature(card, creatureCard, accessType = 'view') {
    // GM cards are only accessible to creatures with GM role
    if (card.system?.restrictedToRoles?.includes('gm')) {
      const hasGMRole = (creatureCard.system.appliedRoles || []).some(
        r => r.roleCategory === 'gm'
      );
      if (!hasGMRole) return false;
    }

    // Check role-based permissions
    const creatureRoles = creatureCard.system.appliedRoles || [];

    for (const appliedRole of creatureRoles) {
      const permissions = appliedRole.permissions;

      if (accessType === 'view' && permissions.canViewCards?.includes(card.type)) {
        return true;
      }
      if (accessType === 'use' && permissions.canUseCards?.includes(card.type)) {
        return true;
      }
      if (accessType === 'edit' && permissions.canEditCards?.includes(card.type)) {
        return true;
      }
    }

    // If no explicit permissions, check if card is player-accessible
    if (!card.system?.restrictedToRoles) {
      return true; // Public card
    }

    return false;
  }

  /**
   * Filter cards by role accessibility
   */
  filterCardsByRoleAccess(cards, creatureCard, accessType = 'view') {
    return cards.filter(card => this.isCardAccessibleToCreature(card, creatureCard, accessType));
  }

  /**
   * Format role data for card text
   */
  formatRoleCardText(roleData) {
    let text = '<div class="role-details">';

    text += `<p><strong>Category:</strong> ${roleData.category}</p>`;

    if (roleData.unique) {
      text += `<p><strong>Unique:</strong> Can only be assigned to one creature</p>`;
    }

    if (roleData.teamId) {
      text += `<p><strong>Team Role:</strong> Assigned by team</p>`;
    }

    // Permissions
    if (roleData.permissions) {
      const perms = roleData.permissions;
      if (perms.canViewCards?.length > 0 || perms.canUseCards?.length > 0 || perms.canEditCards?.length > 0) {
        text += '<p><strong>Card Permissions:</strong></p><ul>';
        if (perms.canViewCards?.length > 0) text += `<li>View: ${perms.canViewCards.join(', ')}</li>`;
        if (perms.canUseCards?.length > 0) text += `<li>Use: ${perms.canUseCards.join(', ')}</li>`;
        if (perms.canEditCards?.length > 0) text += `<li>Edit: ${perms.canEditCards.join(', ')}</li>`;
        text += '</ul>';
      }

      const systemPerms = [];
      if (perms.canCreateContent) systemPerms.push('Create Content');
      if (perms.canModifyRules) systemPerms.push('Modify Rules');
      if (perms.canManageTeams) systemPerms.push('Manage Teams');
      if (systemPerms.length > 0) {
        text += `<p><strong>System Permissions:</strong> ${systemPerms.join(', ')}</p>`;
      }
    }

    // Prerequisites
    if (roleData.requires) {
      if (roleData.requires.types?.length > 0) {
        text += `<p><strong>Requires Type:</strong> ${roleData.requires.types.join(' or ')}</p>`;
      }
      if (roleData.requires.roles?.length > 0) {
        text += `<p><strong>Requires Role:</strong> ${roleData.requires.roles.join(' or ')}</p>`;
      }
    }

    // Properties
    if (Object.keys(roleData.properties || {}).length > 0) {
      text += '<p><strong>Properties:</strong></p><ul>';
      for (const [key, value] of Object.entries(roleData.properties)) {
        text += `<li>${key}: ${value}</li>`;
      }
      text += '</ul>';
    }

    // Abilities
    if (roleData.abilities && roleData.abilities.length > 0) {
      text += '<p><strong>Abilities:</strong></p><ul>';
      for (const ability of roleData.abilities) {
        text += `<li>${typeof ability === 'string' ? ability : ability.name}</li>`;
      }
      text += '</ul>';
    }

    text += '</div>';
    return text;
  }

  /**
   * Get default image for role category
   */
  getDefaultRoleImage(category) {
    const images = {
      player: 'icons/svg/player.svg',
      gm: 'icons/svg/crown.svg',
      spectator: 'icons/svg/eye.svg',
      team: 'icons/svg/group.svg',
      custom: 'icons/svg/badge.svg'
    };

    return images[category] || images.custom;
  }

  /* ========================================
   * HELPER METHODS
   * ======================================== */

  /**
   * Generic card creation helper
   */
  async createCard(cardData, deckId, cardType) {
    let card;

    if (deckId) {
      const deck = game.cards.get(deckId);
      if (!deck) {
        ui.notifications.error('Deck not found');
        return null;
      }
      const created = await deck.createEmbeddedDocuments('Card', [cardData]);
      card = created[0];
    } else {
      // Create standalone Cards document with single card
      const cardsData = {
        name: `${cardData.name} (${cardType})`,
        type: 'deck',
        cards: [cardData]
      };
      const cards = await Cards.create(cardsData);
      card = cards.cards.contents[0];
    }

    ui.notifications.info(`Created ${cardType} card: ${cardData.name}`);
    console.log(`Entity Cards | Created ${cardType} card:`, cardData.name);

    return card;
  }

  /**
   * Extract scene data for location cards
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
        c: w.c,
        door: w.door,
        ds: w.ds,
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
   * Populate scene with embedded documents from template
   */
  async populateSceneFromTemplate(scene, templateData) {
    const promises = [];

    if (templateData.tokenTemplates?.length > 0) {
      const tokenData = templateData.tokenTemplates.map(t => ({
        ...t,
        x: t.x || 0,
        y: t.y || 0
      }));
      promises.push(scene.createEmbeddedDocuments('Token', tokenData));
    }

    if (templateData.tiles?.length > 0) {
      promises.push(scene.createEmbeddedDocuments('Tile', templateData.tiles));
    }

    if (templateData.walls?.length > 0) {
      promises.push(scene.createEmbeddedDocuments('Wall', templateData.walls));
    }

    if (templateData.lights?.length > 0) {
      promises.push(scene.createEmbeddedDocuments('AmbientLight', templateData.lights));
    }

    if (templateData.sounds?.length > 0) {
      promises.push(scene.createEmbeddedDocuments('AmbientSound', templateData.sounds));
    }

    await Promise.all(promises);
  }

  /**
   * Extract key stats from creature for card display
   */
  extractCreatureStats(actor) {
    const stats = {};
    const system = actor.system;

    // Try to extract common stats (works for most systems)
    if (system.attributes?.hp) {
      stats.hp = system.attributes.hp.max || system.attributes.hp.value;
    }
    if (system.attributes?.ac) {
      stats.ac = system.attributes.ac.value;
    }
    if (system.details?.cr) {
      stats.cr = system.details.cr;
    }
    if (system.details?.level) {
      stats.level = system.details.level;
    }
    if (system.abilities) {
      stats.abilities = {};
      for (const [key, ability] of Object.entries(system.abilities)) {
        stats.abilities[key] = ability.value;
      }
    }

    return stats;
  }

  /**
   * Extract key stats from item for card display
   */
  extractThingStats(item) {
    const stats = {};
    const system = item.system;

    if (system.quantity) stats.quantity = system.quantity;
    if (system.weight) stats.weight = system.weight;
    if (system.price) stats.price = system.price;
    if (system.rarity) stats.rarity = system.rarity;
    if (system.damage) stats.damage = system.damage;
    if (system.armor) stats.armor = system.armor;
    if (system.activation) stats.activation = system.activation;
    if (system.duration) stats.duration = system.duration;
    if (system.range) stats.range = system.range;

    return stats;
  }

  /**
   * Format creature stats for card text
   */
  formatCreatureCardText(actor) {
    const stats = this.extractCreatureStats(actor);
    let text = '<div class="creature-stats">';

    if (stats.cr) text += `<p><strong>CR:</strong> ${stats.cr}</p>`;
    if (stats.level) text += `<p><strong>Level:</strong> ${stats.level}</p>`;
    if (stats.hp) text += `<p><strong>HP:</strong> ${stats.hp}</p>`;
    if (stats.ac) text += `<p><strong>AC:</strong> ${stats.ac}</p>`;

    text += '</div>';
    return text;
  }

  /**
   * Format item stats for card text
   */
  formatThingCardText(item) {
    const stats = this.extractThingStats(item);
    let text = '<div class="thing-stats">';

    if (stats.rarity) text += `<p><strong>Rarity:</strong> ${stats.rarity}</p>`;
    if (stats.damage) text += `<p><strong>Damage:</strong> ${stats.damage}</p>`;
    if (stats.armor) text += `<p><strong>Armor:</strong> ${stats.armor}</p>`;
    if (stats.weight) text += `<p><strong>Weight:</strong> ${stats.weight}</p>`;

    text += '</div>';
    return text;
  }

  /**
   * Format event data for card text
   */
  formatEventCardText(eventData) {
    let text = '<div class="event-details">';

    if (eventData.eventType) text += `<p><strong>Type:</strong> ${eventData.eventType}</p>`;
    if (eventData.mode) text += `<p><strong>Mode:</strong> ${eventData.mode}</p>`;
    if (eventData.metadata?.difficulty) text += `<p><strong>Difficulty:</strong> ${eventData.metadata.difficulty}</p>`;
    if (eventData.metadata?.duration) text += `<p><strong>Duration:</strong> ${eventData.metadata.duration}</p>`;

    if (eventData.triggers && eventData.triggers.length > 0) {
      text += '<p><strong>Triggers:</strong></p><ul>';
      for (const trigger of eventData.triggers) {
        text += `<li>${typeof trigger === 'string' ? trigger : JSON.stringify(trigger)}</li>`;
      }
      text += '</ul>';
    }

    text += '</div>';
    return text;
  }

  /**
   * Format goal data for card text
   */
  formatGoalCardText(goalData) {
    let text = '<div class="goal-details">';

    if (goalData.goalType) text += `<p><strong>Type:</strong> ${goalData.goalType}</p>`;
    if (goalData.difficulty) text += `<p><strong>Difficulty:</strong> ${goalData.difficulty}</p>`;

    if (goalData.requirements && goalData.requirements.length > 0) {
      text += '<p><strong>Requirements:</strong></p><ul>';
      for (const req of goalData.requirements) {
        text += `<li>${req}</li>`;
      }
      text += '</ul>';
    }

    if (goalData.rewards && goalData.rewards.length > 0) {
      text += '<p><strong>Rewards:</strong></p><ul>';
      for (const reward of goalData.rewards) {
        text += `<li>${reward}</li>`;
      }
      text += '</ul>';
    }

    text += '</div>';
    return text;
  }

  /**
   * Infer location type from scene name
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

    return 'location';
  }

  /**
   * Calculate scale tier from grid distance
   */
  calculateScaleTier(gridDistance) {
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
    return 11;
  }

  /* ========================================
   * HOOKS AND UI INTEGRATION
   * ======================================== */

  /**
   * Register hooks for entity cards system
   */
  registerHooks() {
    this.registerLocationCardHooks();
    this.registerCreatureCardHooks();
    this.registerThingCardHooks();
    this.registerGenericCardHooks();
  }

  registerLocationCardHooks() {
    // Add "Create Location Card" button to scene configuration
    Hooks.on('getSceneConfigHeaderButtons', (config, buttons) => {
      if (!game.user.isGM) return;

      buttons.unshift({
        label: 'Create Location Card',
        class: 'create-location-card',
        icon: 'fas fa-cards-blank',
        onclick: async () => {
          await this.showCreateCardDialog(config.object, 'scene');
        }
      });
    });

    // Drag-to-canvas for location cards
    Hooks.on('dropCanvasData', async (canvas, data) => {
      if (data.type !== 'Card') return true;

      const card = await fromUuid(data.uuid);
      if (!card || card.type !== 'location') return true;

      if (game.user.isGM) {
        ui.notifications.info('Creating scene from location card...');
        await this.createSceneFromLocationCard(card);
        return false;
      }

      return true;
    });
  }

  registerCreatureCardHooks() {
    // Add "Create Creature Card" button to actor configuration
    Hooks.on('getActorSheetHeaderButtons', (sheet, buttons) => {
      if (!game.user.isGM) return;

      buttons.unshift({
        label: 'Create Creature Card',
        class: 'create-creature-card',
        icon: 'fas fa-cards-blank',
        onclick: async () => {
          await this.showCreateCardDialog(sheet.object, 'actor');
        }
      });
    });

    // Drag creature card to scene to create token
    Hooks.on('dropCanvasData', async (canvas, data) => {
      if (data.type !== 'Card') return true;

      const card = await fromUuid(data.uuid);
      if (!card || card.type !== 'creature') return true;

      if (game.user.isGM) {
        const pos = canvas.canvasCoordinatesFromClient({ x: data.x, y: data.y });
        await this.createTokenFromCreatureCard(card, pos.x, pos.y);
        return false;
      }

      return true;
    });
  }

  registerThingCardHooks() {
    // Add "Create Thing Card" button to item configuration
    Hooks.on('getItemSheetHeaderButtons', (sheet, buttons) => {
      if (!game.user.isGM) return;

      buttons.unshift({
        label: 'Create Thing Card',
        class: 'create-thing-card',
        icon: 'fas fa-cards-blank',
        onclick: async () => {
          await this.showCreateCardDialog(sheet.object, 'item');
        }
      });
    });

    // Drag thing card to actor sheet to add item
    Hooks.on('dropActorSheetData', async (actor, sheet, data) => {
      if (data.type !== 'Card') return true;

      const card = await fromUuid(data.uuid);
      if (!card || card.type !== 'thing') return true;

      await this.addItemToActorFromThingCard(card, actor);
      return false;
    });
  }

  registerGenericCardHooks() {
    // Add "Create Entity" button to card sheets based on type
    Hooks.on('renderCardConfig', (config, html) => {
      const card = config.object;
      const header = html.find('.window-header');

      let buttonLabel, buttonAction;

      if (card.type === 'location') {
        buttonLabel = 'Create Scene';
        buttonAction = () => this.createSceneFromLocationCard(card);
      } else if (card.type === 'creature') {
        buttonLabel = 'Create Actor';
        buttonAction = () => this.createActorFromCreatureCard(card);
      } else if (card.type === 'thing') {
        buttonLabel = 'Create Item';
        buttonAction = () => this.createItemFromThingCard(card);
      } else if (card.type === 'event') {
        buttonLabel = 'Trigger Event';
        buttonAction = () => this.triggerEventFromCard(card);
      } else if (card.type === 'goal') {
        buttonLabel = 'Activate Goal';
        buttonAction = () => this.activateGoalFromCard(card);
      } else if (card.type === 'type') {
        buttonLabel = card.system.enabled ? 'Disable Type' : 'Enable Type';
        buttonAction = () => this.toggleTypeCard(card);
      } else if (card.type === 'role') {
        buttonLabel = 'Assign Role';
        buttonAction = () => this.showAssignRoleDialog(card);
      } else {
        return;
      }

      const button = $(`
        <a class="create-entity-from-card" title="${buttonLabel} from this card">
          <i class="fas fa-${card.type === 'type' ? 'toggle-on' : 'plus'}"></i> ${buttonLabel}
        </a>
      `);

      button.on('click', async (event) => {
        event.preventDefault();
        await buttonAction();
      });

      header.find('.window-title').after(button);

      button.css({
        'margin-left': '10px',
        'padding': '4px 8px',
        'background': 'rgba(0, 0, 0, 0.2)',
        'border-radius': '3px',
        'cursor': 'pointer'
      });
    });
  }

  /**
   * Show dialog for assigning a role to a creature
   */
  async showAssignRoleDialog(roleCard) {
    // Get all creature cards
    const creatureCards = game.cards.reduce((acc, deck) => {
      const creatures = deck.cards.filter(c => c.type === 'creature');
      return acc.concat(creatures);
    }, []);

    if (creatureCards.length === 0) {
      ui.notifications.warn('No creature cards found');
      return;
    }

    let html = '<form><div class="form-group">';
    html += '<label>Assign to Creature:</label>';
    html += '<select name="creature" style="width: 100%">';
    for (const creature of creatureCards) {
      const hasRole = creature.system.appliedRoles?.some(r => r.roleId === roleCard.id);
      html += `<option value="${creature.id}">${creature.name}${hasRole ? ' (already has role)' : ''}</option>`;
    }
    html += '</select>';
    html += '</div></form>';

    new Dialog({
      title: `Assign ${roleCard.name} Role`,
      content: html,
      buttons: {
        assign: {
          label: 'Assign Role',
          callback: async (html) => {
            const creatureId = html.find('[name="creature"]').val();
            const creature = creatureCards.find(c => c.id === creatureId);
            if (creature) {
              await this.assignRoleToCreature(roleCard, creature);
            }
          }
        },
        cancel: {
          label: 'Cancel'
        }
      },
      default: 'assign'
    }).render(true);
  }

  /**
   * Show dialog for creating a card from an entity
   */
  async showCreateCardDialog(entity, entityType) {
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
      title: `Create ${entityType === 'scene' ? 'Location' : entityType === 'actor' ? 'Creature' : 'Thing'} Card`,
      content: html,
      buttons: {
        create: {
          label: 'Create Card',
          callback: async (html) => {
            const deckId = html.find('[name="deck"]').val();

            if (entityType === 'scene') {
              await this.createLocationCardFromScene(entity, deckId || null);
            } else if (entityType === 'actor') {
              await this.createCreatureCardFromActor(entity, deckId || null);
            } else if (entityType === 'item') {
              await this.createThingCardFromItem(entity, deckId || null);
            }
          }
        },
        cancel: {
          label: 'Cancel'
        }
      },
      default: 'create'
    }).render(true);
  }

  /**
   * Cleanup
   */
  async cleanup() {
    this.initialized = false;
  }
}
