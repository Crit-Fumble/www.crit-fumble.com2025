/**
 * Sync Endpoints for Foundry VTT ↔ Crit-Fumble Database
 * Bidirectional synchronization between Foundry and PostgreSQL
 */

/**
 * Register sync routes
 * @param {express.Application} app - Express app
 * @param {Object} config - Configuration
 */
export function registerSyncRoutes(app, config) {

  // ============================================================================
  // FOUNDRY → CRIT-FUMBLE (Import from Foundry to Database)
  // ============================================================================

  /**
   * Import entire world from Foundry to Crit-Fumble database
   * POST /sync/import/world
   */
  app.post('/sync/import/world', async (req, res) => {
    try {
      const {
        rpgWorldId,     // Target RpgWorld ID in database
        entities = {},  // Which entities to sync
        options = {}    // Sync options
      } = req.body;

      if (!rpgWorldId) {
        return res.status(400).json({ error: 'rpgWorldId required' });
      }

      const result = {
        worldId: rpgWorldId,
        foundryWorldId: game.world.id,
        timestamp: new Date().toISOString(),
        imported: {}
      };

      // Import actors → RpgCreature
      if (entities.actors !== false) {
        result.imported.actors = await importActors(rpgWorldId, options);
      }

      // Import items → RpgThing
      if (entities.items !== false) {
        result.imported.items = await importItems(rpgWorldId, options);
      }

      // Import scenes → RpgBoard
      if (entities.scenes !== false) {
        result.imported.scenes = await importScenes(rpgWorldId, options);
      }

      // Import journal entries → RpgBook
      if (entities.journal !== false) {
        result.imported.journal = await importJournal(rpgWorldId, options);
      }

      // Import tables → RpgTable
      if (entities.tables !== false) {
        result.imported.tables = await importTables(rpgWorldId, options);
      }

      // Import macros → RpgRule
      if (entities.macros !== false) {
        result.imported.macros = await importMacros(rpgWorldId, options);
      }

      // Import playlists → RpgBoard.metadata
      if (entities.playlists !== false) {
        result.imported.playlists = await importPlaylists(rpgWorldId, options);
      }

      // Import chat messages → RpgEvent
      if (entities.chat !== false) {
        result.imported.chat = await importChatMessages(rpgWorldId, options);
      }

      // Import combat encounters → RpgSheet (type='combat')
      if (entities.combats !== false) {
        result.imported.combats = await importCombats(rpgWorldId, options);
      }

      res.json({
        success: true,
        result
      });

    } catch (error) {
      console.error('[Sync] Import failed:', error);
      res.status(500).json({
        error: error.message,
        stack: config.debugMode ? error.stack : undefined
      });
    }
  });

  /**
   * Import specific entities
   * POST /sync/import/entities
   */
  app.post('/sync/import/entities', async (req, res) => {
    try {
      const {
        entityType,  // 'actors', 'items', 'scenes', etc.
        entityIds,   // Optional array of specific IDs
        rpgWorldId,
        options = {}
      } = req.body;

      if (!entityType || !rpgWorldId) {
        return res.status(400).json({ error: 'entityType and rpgWorldId required' });
      }

      let result;

      switch (entityType) {
        case 'actors':
          result = await importActors(rpgWorldId, { ...options, ids: entityIds });
          break;
        case 'items':
          result = await importItems(rpgWorldId, { ...options, ids: entityIds });
          break;
        case 'scenes':
          result = await importScenes(rpgWorldId, { ...options, ids: entityIds });
          break;
        case 'journal':
          result = await importJournal(rpgWorldId, { ...options, ids: entityIds });
          break;
        case 'tables':
          result = await importTables(rpgWorldId, { ...options, ids: entityIds });
          break;
        case 'macros':
          result = await importMacros(rpgWorldId, { ...options, ids: entityIds });
          break;
        case 'chat':
          result = await importChatMessages(rpgWorldId, { ...options, ids: entityIds });
          break;
        case 'combats':
          result = await importCombats(rpgWorldId, { ...options, ids: entityIds });
          break;
        default:
          return res.status(400).json({ error: `Unknown entity type: ${entityType}` });
      }

      res.json({
        success: true,
        entityType,
        count: result.count,
        created: result.created,
        updated: result.updated,
        errors: result.errors || []
      });

    } catch (error) {
      console.error('[Sync] Entity import failed:', error);
      res.status(500).json({
        error: error.message,
        stack: config.debugMode ? error.stack : undefined
      });
    }
  });

  // ============================================================================
  // CRIT-FUMBLE → FOUNDRY (Export from Database to Foundry)
  // ============================================================================

  /**
   * Export entire world from Crit-Fumble to Foundry
   * POST /sync/export/world
   */
  app.post('/sync/export/world', async (req, res) => {
    try {
      const {
        rpgWorldId,     // Source RpgWorld ID from database
        entities = {},  // Which entities to sync
        options = {}    // Sync options
      } = req.body;

      if (!rpgWorldId) {
        return res.status(400).json({ error: 'rpgWorldId required' });
      }

      const result = {
        worldId: rpgWorldId,
        foundryWorldId: game.world.id,
        timestamp: new Date().toISOString(),
        exported: {}
      };

      // Export RpgCreature → Actors
      if (entities.creatures !== false) {
        result.exported.creatures = await exportCreatures(rpgWorldId, options);
      }

      // Export RpgThing → Items
      if (entities.things !== false) {
        result.exported.things = await exportThings(rpgWorldId, options);
      }

      // Export RpgBoard → Scenes
      if (entities.boards !== false) {
        result.exported.boards = await exportBoards(rpgWorldId, options);
      }

      // Export RpgBook → Journal Entries
      if (entities.books !== false) {
        result.exported.books = await exportBooks(rpgWorldId, options);
      }

      // Export RpgTable → Rollable Tables
      if (entities.tables !== false) {
        result.exported.tables = await exportTables(rpgWorldId, options);
      }

      // Export RpgRule → Macros
      if (entities.rules !== false) {
        result.exported.rules = await exportRules(rpgWorldId, options);
      }

      // Export RpgEvent (chat) → Chat Messages
      if (entities.events?.chat !== false) {
        result.exported.chatEvents = await exportChatEvents(rpgWorldId, options);
      }

      // Export RpgSheet (combat) → Combat Encounters
      if (entities.combatSheets !== false) {
        result.exported.combatSheets = await exportCombatSheets(rpgWorldId, options);
      }

      res.json({
        success: true,
        result
      });

    } catch (error) {
      console.error('[Sync] Export failed:', error);
      res.status(500).json({
        error: error.message,
        stack: config.debugMode ? error.stack : undefined
      });
    }
  });

  /**
   * Get sync status for a world
   * GET /sync/status/:rpgWorldId
   */
  app.get('/sync/status/:rpgWorldId', async (req, res) => {
    try {
      const { rpgWorldId } = req.params;

      // Get counts from Foundry
      const foundryCounts = {
        actors: game.actors.size,
        items: game.items.size,
        scenes: game.scenes.size,
        journal: game.journal.size,
        tables: game.tables.size,
        macros: game.macros.size,
        playlists: game.playlists.size,
        combats: game.combats.size
      };

      // Query database counts (would need to make HTTP request to Crit-Fumble API)
      // For now, just return Foundry counts
      res.json({
        rpgWorldId,
        foundryWorldId: game.world.id,
        foundry: foundryCounts,
        lastSync: null, // TODO: Track last sync timestamp
        status: 'ready'
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

// ============================================================================
// IMPORT FUNCTIONS (Foundry → Crit-Fumble)
// ============================================================================

/**
 * Import actors to RpgCreature (system-agnostic via adapters)
 */
async function importActors(rpgWorldId, options = {}) {
  const actors = options.ids
    ? options.ids.map(id => game.actors.get(id)).filter(a => a)
    : game.actors.contents;

  const result = { count: 0, created: 0, updated: 0, errors: [] };

  // Get system adapter from Core Concepts SystemsManager
  const adapter = game.coreConcepts?.systems?.getAdapter(game.system.id);

  if (!adapter) {
    console.warn('[Sync] No adapter found for system:', game.system.id);
    console.warn('[Sync] Falling back to generic mapping');
  }

  for (const actor of actors) {
    try {
      let creatureData;

      // Use adapter if available, otherwise fall back to generic mapping
      if (adapter && typeof adapter.mapActorToCreature === 'function') {
        creatureData = adapter.mapActorToCreature(actor);

        // Ensure required fields
        if (!creatureData) {
          console.warn('[Sync] Adapter returned null for actor:', actor.name);
          continue;
        }

        // Add sync metadata
        creatureData.foundryId = actor.id;
        creatureData.worldId = rpgWorldId;
        if (!creatureData.metadata) creatureData.metadata = {};
        creatureData.metadata.foundryActorType = actor.type;
        creatureData.metadata.foundryFlags = actor.flags;
        creatureData.metadata.folder = actor.folder?.name;
        if (!creatureData.tags) creatureData.tags = extractTags(actor);
      } else {
        // Generic fallback mapping (works for most systems)
        creatureData = {
          foundryId: actor.id,
          worldId: rpgWorldId,
          name: actor.name,
          race: actor.system.details?.race || actor.system.race || actor.system.basic?.descriptor || '',
          class: actor.system.details?.class || actor.system.class || actor.system.basic?.type || '',
          level: actor.system.details?.level || actor.system.level || actor.system.basic?.tier || 0,
          imageUrl: actor.img,
          alignment: actor.system.details?.alignment || '',
          stats: actor.system, // Store full system data as JSON
          inventory: actor.items.contents.map(i => ({
            itemId: i.id,
            name: i.name,
            count: i.system.quantity || 1
          })),
          metadata: {
            foundryActorType: actor.type,
            foundryFlags: actor.flags,
            folder: actor.folder?.name,
            gameSystem: game.system.id
          },
          tags: extractTags(actor)
        };
      }

      // Make HTTP request to Crit-Fumble API to create/update creature
      await sendToCritFumbleAPI('/api/creatures', 'POST', creatureData);

      result.created++;
    } catch (error) {
      result.errors.push({ actorId: actor.id, error: error.message });
    }
    result.count++;
  }

  return result;
}

/**
 * Import items to RpgThing (system-agnostic via adapters)
 */
async function importItems(rpgWorldId, options = {}) {
  const items = options.ids
    ? options.ids.map(id => game.items.get(id)).filter(i => i)
    : game.items.contents;

  const result = { count: 0, created: 0, updated: 0, errors: [] };

  // Get system adapter from Core Concepts SystemsManager
  const adapter = game.coreConcepts?.systems?.getAdapter(game.system.id);

  for (const item of items) {
    try {
      let thingData;

      // Use adapter if available, otherwise fall back to generic mapping
      if (adapter && typeof adapter.mapItemToRpgItem === 'function') {
        thingData = adapter.mapItemToRpgItem(item);

        if (!thingData) {
          console.warn('[Sync] Adapter returned null for item:', item.name);
          continue;
        }

        // Add sync metadata
        thingData.foundryId = item.id;
        if (!thingData.metadata) thingData.metadata = {};
        thingData.metadata.foundryFlags = item.flags;
        thingData.metadata.folder = item.folder?.name;
        if (!thingData.tags) thingData.tags = extractTags(item);
      } else {
        // Generic fallback mapping
        thingData = {
          foundryId: item.id,
          name: item.name,
          title: item.name,
          description: item.system.description?.value || '',
          thingType: item.type,
          properties: item.system,
          imageUrl: item.img,
          systemName: game.system.id,
          metadata: {
            foundryFlags: item.flags,
            folder: item.folder?.name,
            gameSystem: game.system.id
          },
          tags: extractTags(item)
        };
      }

      await sendToCritFumbleAPI('/api/things', 'POST', thingData);
      result.created++;
    } catch (error) {
      result.errors.push({ itemId: item.id, error: error.message });
    }
    result.count++;
  }

  return result;
}

/**
 * Import scenes to RpgBoard (system-agnostic via adapters)
 */
async function importScenes(rpgWorldId, options = {}) {
  const scenes = options.ids
    ? options.ids.map(id => game.scenes.get(id)).filter(s => s)
    : game.scenes.contents;

  const result = { count: 0, created: 0, updated: 0, errors: [] };

  // Get system adapter from Core Concepts SystemsManager
  const adapter = game.coreConcepts?.systems?.getAdapter(game.system.id);

  for (const scene of scenes) {
    try {
      let boardData;

      // Use adapter if available, otherwise fall back to generic mapping
      if (adapter && typeof adapter.mapSceneToBoard === 'function') {
        boardData = adapter.mapSceneToBoard(scene);

        if (!boardData) {
          console.warn('[Sync] Adapter returned null for scene:', scene.name);
          continue;
        }

        // Add sync metadata
        boardData.foundryId = scene.id;
        if (!boardData.metadata) boardData.metadata = {};
        boardData.metadata.foundryFlags = scene.flags;
        if (!boardData.tags) boardData.tags = extractTags(scene);
      } else {
        // Generic fallback mapping (works for most systems)
        boardData = {
          foundryId: scene.id,
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
          walls: convertWallsToVoxels(scene.walls.contents),
          lights: convertLightsToVoxels(scene.lights.contents),
          sounds: convertSoundsToVoxels(scene.sounds.contents),
          drawings: convertDrawingsToVoxels(scene.drawings.contents),
          metadata: {
            foundryFlags: scene.flags,
            tiles: scene.tiles.contents.map(t => ({
              id: t.id,
              x: t.x,
              y: t.y,
              width: t.width,
              height: t.height,
              texture: t.texture.src,
              z: t.z
            })),
            weather: scene.weather,
            gameSystem: game.system.id
          },
          tags: extractTags(scene)
        };
      }

      await sendToCritFumbleAPI('/api/boards', 'POST', boardData);
      result.created++;
    } catch (error) {
      result.errors.push({ sceneId: scene.id, error: error.message });
    }
    result.count++;
  }

  return result;
}

/**
 * Import journal entries to RpgBook
 */
async function importJournal(rpgWorldId, options = {}) {
  const journals = options.ids
    ? options.ids.map(id => game.journal.get(id)).filter(j => j)
    : game.journal.contents;

  const result = { count: 0, created: 0, updated: 0, errors: [] };

  for (const journal of journals) {
    try {
      const bookData = {
        foundryId: journal.id,
        name: journal.name,
        pages: journal.pages.contents.map(p => ({
          id: p.id,
          name: p.name,
          type: p.type,
          text: p.text?.content || '',
          src: p.src,
          video: p.video?.src
        })),
        metadata: {
          foundryFlags: journal.flags,
          folder: journal.folder?.name
        },
        tags: extractTags(journal)
      };

      await sendToCritFumbleAPI('/api/books', 'POST', bookData);
      result.created++;
    } catch (error) {
      result.errors.push({ journalId: journal.id, error: error.message });
    }
    result.count++;
  }

  return result;
}

/**
 * Import rollable tables to RpgTable
 */
async function importTables(rpgWorldId, options = {}) {
  const tables = options.ids
    ? options.ids.map(id => game.tables.get(id)).filter(t => t)
    : game.tables.contents;

  const result = { count: 0, created: 0, updated: 0, errors: [] };

  for (const table of tables) {
    try {
      const tableData = {
        foundryId: table.id,
        name: table.name,
        description: table.description,
        diceFormula: table.formula,
        entries: table.results.contents.map(r => ({
          id: r.id,
          text: r.text,
          weight: r.weight,
          range: r.range,
          type: r.type,
          img: r.img
        })),
        systemName: game.system.id,
        metadata: {
          foundryFlags: table.flags,
          replacement: table.replacement,
          displayRoll: table.displayRoll
        },
        tags: extractTags(table)
      };

      await sendToCritFumbleAPI('/api/tables', 'POST', tableData);
      result.created++;
    } catch (error) {
      result.errors.push({ tableId: table.id, error: error.message });
    }
    result.count++;
  }

  return result;
}

/**
 * Import macros to RpgRule
 */
async function importMacros(rpgWorldId, options = {}) {
  const macros = options.ids
    ? options.ids.map(id => game.macros.get(id)).filter(m => m)
    : game.macros.contents;

  const result = { count: 0, created: 0, updated: 0, errors: [] };

  for (const macro of macros) {
    try {
      const ruleData = {
        foundryId: macro.id,
        name: macro.name,
        title: macro.name,
        description: '',
        category: 'macro',
        trigger: { type: 'manual', command: macro.command },
        effect: { script: macro.command, type: macro.type },
        systemName: game.system.id,
        metadata: {
          foundryFlags: macro.flags,
          img: macro.img
        },
        tags: extractTags(macro)
      };

      await sendToCritFumbleAPI('/api/rules', 'POST', ruleData);
      result.created++;
    } catch (error) {
      result.errors.push({ macroId: macro.id, error: error.message });
    }
    result.count++;
  }

  return result;
}

/**
 * Import playlists (stored in board metadata for now)
 */
async function importPlaylists(rpgWorldId, options = {}) {
  // Playlists are scene-specific, so we'll store them in RpgBoard.metadata
  // This is a simplified implementation
  const result = { count: 0, created: 0, errors: [] };

  // TODO: Associate playlists with scenes/boards
  console.log('[Sync] Playlist import not fully implemented - storing in board metadata');

  return result;
}

/**
 * Import chat messages to RpgEvent
 */
async function importChatMessages(rpgWorldId, options = {}) {
  const messages = options.ids
    ? options.ids.map(id => game.messages.get(id)).filter(m => m)
    : game.messages.contents;

  const result = { count: 0, created: 0, updated: 0, errors: [] };

  for (const message of messages) {
    try {
      const eventData = {
        foundryId: message.id,
        eventType: message.type === CONST.CHAT_MESSAGE_TYPES.IC ? 'chat' :
                    message.type === CONST.CHAT_MESSAGE_TYPES.EMOTE ? 'emote' :
                    message.type === CONST.CHAT_MESSAGE_TYPES.OOC ? 'ooc' :
                    message.type === CONST.CHAT_MESSAGE_TYPES.WHISPER ? 'whisper' :
                    message.type === CONST.CHAT_MESSAGE_TYPES.ROLL ? 'roll' : 'chat',
        action: message.flavor || 'message',
        description: message.content,
        actorId: message.speaker?.actor,
        result: message.rolls?.length ? {
          formula: message.rolls[0].formula,
          total: message.rolls[0].total,
          dice: message.rolls[0].dice
        } : null,
        metadata: {
          speaker: message.speaker,
          whisper: message.whisper,
          blind: message.blind
        }
      };

      await sendToCritFumbleAPI('/api/events', 'POST', eventData);
      result.created++;
    } catch (error) {
      result.errors.push({ messageId: message.id, error: error.message });
    }
    result.count++;
  }

  return result;
}

/**
 * Import combat encounters to RpgSheet (type='combat')
 */
async function importCombats(rpgWorldId, options = {}) {
  const combats = options.ids
    ? options.ids.map(id => game.combats.get(id)).filter(c => c)
    : game.combats.contents;

  const result = { count: 0, created: 0, updated: 0, errors: [] };

  for (const combat of combats) {
    try {
      const sheetData = {
        foundryId: combat.id,
        name: combat.scene?.name + ' Combat' || 'Combat Encounter',
        description: `Combat encounter in ${combat.scene?.name || 'unknown scene'}`,
        type: 'combat',
        gridType: 'square',
        metadata: {
          round: combat.round,
          turn: combat.turn,
          combatants: combat.combatants.contents.map(c => ({
            id: c.id,
            actorId: c.actorId,
            name: c.name,
            initiative: c.initiative,
            defeated: c.defeated,
            hidden: c.hidden
          })),
          sceneId: combat.scene?.id,
          started: combat.started,
          active: combat.active
        },
        tags: ['combat', combat.scene?.name || 'unknown'].filter(Boolean)
      };

      await sendToCritFumbleAPI('/api/sheets', 'POST', sheetData);
      result.created++;
    } catch (error) {
      result.errors.push({ combatId: combat.id, error: error.message });
    }
    result.count++;
  }

  return result;
}

// ============================================================================
// EXPORT FUNCTIONS (Crit-Fumble → Foundry)
// ============================================================================

/**
 * Export creatures to Foundry actors
 */
async function exportCreatures(rpgWorldId, options = {}) {
  // Fetch creatures from Crit-Fumble API
  const creatures = await fetchFromCritFumbleAPI(`/api/creatures?worldId=${rpgWorldId}`);

  const result = { count: 0, created: 0, updated: 0, errors: [] };

  for (const creature of creatures) {
    try {
      const actorData = {
        name: creature.name,
        type: creature.metadata?.foundryActorType || 'character',
        img: creature.imageUrl,
        system: creature.stats || {},
        flags: creature.metadata?.foundryFlags || {}
      };

      // Check if actor already exists
      const existingActor = game.actors.find(a => a.getFlag('crit-fumble', 'creatureId') === creature.id);

      if (existingActor) {
        await existingActor.update(actorData);
        result.updated++;
      } else {
        const actor = await Actor.create(actorData);
        await actor.setFlag('crit-fumble', 'creatureId', creature.id);
        result.created++;
      }
    } catch (error) {
      result.errors.push({ creatureId: creature.id, error: error.message });
    }
    result.count++;
  }

  return result;
}

/**
 * Export things to Foundry items
 */
async function exportThings(rpgWorldId, options = {}) {
  const things = await fetchFromCritFumbleAPI(`/api/things?worldId=${rpgWorldId}`);

  const result = { count: 0, created: 0, updated: 0, errors: [] };

  for (const thing of things) {
    try {
      const itemData = {
        name: thing.name,
        type: thing.thingType,
        img: thing.imageUrl,
        system: thing.properties || {},
        flags: thing.metadata?.foundryFlags || {}
      };

      const existingItem = game.items.find(i => i.getFlag('crit-fumble', 'thingId') === thing.id);

      if (existingItem) {
        await existingItem.update(itemData);
        result.updated++;
      } else {
        const item = await Item.create(itemData);
        await item.setFlag('crit-fumble', 'thingId', thing.id);
        result.created++;
      }
    } catch (error) {
      result.errors.push({ thingId: thing.id, error: error.message });
    }
    result.count++;
  }

  return result;
}

/**
 * Export boards to Foundry scenes
 */
async function exportBoards(rpgWorldId, options = {}) {
  const boards = await fetchFromCritFumbleAPI(`/api/boards?worldId=${rpgWorldId}`);

  const result = { count: 0, created: 0, updated: 0, errors: [] };

  for (const board of boards) {
    try {
      const sceneData = {
        name: board.name,
        background: { src: board.backgroundUrl },
        width: board.width,
        height: board.height,
        grid: {
          size: board.gridSize,
          type: board.gridType === 'square' ? 1 : 2
        },
        flags: board.metadata?.foundryFlags || {}
      };

      const existingScene = game.scenes.find(s => s.getFlag('crit-fumble', 'boardId') === board.id);

      if (existingScene) {
        await existingScene.update(sceneData);
        result.updated++;
      } else {
        const scene = await Scene.create(sceneData);
        await scene.setFlag('crit-fumble', 'boardId', board.id);
        result.created++;
      }
    } catch (error) {
      result.errors.push({ boardId: board.id, error: error.message });
    }
    result.count++;
  }

  return result;
}

/**
 * Export books to Foundry journal entries
 */
async function exportBooks(rpgWorldId, options = {}) {
  const books = await fetchFromCritFumbleAPI(`/api/books?worldId=${rpgWorldId}`);

  const result = { count: 0, created: 0, updated: 0, errors: [] };

  for (const book of books) {
    try {
      const journalData = {
        name: book.name,
        flags: book.metadata?.foundryFlags || {}
      };

      const existingJournal = game.journal.find(j => j.getFlag('crit-fumble', 'bookId') === book.id);

      let journal;
      if (existingJournal) {
        await existingJournal.update(journalData);
        journal = existingJournal;
        result.updated++;
      } else {
        journal = await JournalEntry.create(journalData);
        await journal.setFlag('crit-fumble', 'bookId', book.id);
        result.created++;
      }

      // Create or update pages
      if (book.pages && Array.isArray(book.pages)) {
        for (const page of book.pages) {
          const pageData = {
            name: page.name,
            type: page.type || 'text',
            text: { content: page.text || '' },
            src: page.src,
            video: page.video ? { src: page.video } : undefined
          };

          const existingPage = journal.pages.find(p => p.getFlag('crit-fumble', 'pageId') === page.id);

          if (existingPage) {
            await existingPage.update(pageData);
          } else {
            const newPage = await journal.createEmbeddedDocuments('JournalEntryPage', [pageData]);
            if (newPage[0]) {
              await newPage[0].setFlag('crit-fumble', 'pageId', page.id);
            }
          }
        }
      }
    } catch (error) {
      result.errors.push({ bookId: book.id, error: error.message });
    }
    result.count++;
  }

  return result;
}

/**
 * Export tables to Foundry rollable tables
 */
async function exportTables(rpgWorldId, options = {}) {
  const tables = await fetchFromCritFumbleAPI(`/api/tables?worldId=${rpgWorldId}`);

  const result = { count: 0, created: 0, updated: 0, errors: [] };

  for (const table of tables) {
    try {
      const tableData = {
        name: table.name,
        description: table.description,
        formula: table.diceFormula || '1d100',
        flags: table.metadata?.foundryFlags || {}
      };

      const existingTable = game.tables.find(t => t.getFlag('crit-fumble', 'tableId') === table.id);

      let rollTable;
      if (existingTable) {
        await existingTable.update(tableData);
        rollTable = existingTable;
        result.updated++;
      } else {
        rollTable = await RollTable.create(tableData);
        await rollTable.setFlag('crit-fumble', 'tableId', table.id);
        result.created++;
      }

      // Create or update table results
      if (table.entries && Array.isArray(table.entries)) {
        // Clear existing results
        const existingResults = rollTable.results.map(r => r.id);
        if (existingResults.length > 0) {
          await rollTable.deleteEmbeddedDocuments('TableResult', existingResults);
        }

        // Add new results
        const resultsData = table.entries.map(entry => ({
          text: entry.text,
          weight: entry.weight || 1,
          range: entry.range || [1, 1],
          type: entry.type || 0,
          img: entry.img
        }));

        await rollTable.createEmbeddedDocuments('TableResult', resultsData);
      }
    } catch (error) {
      result.errors.push({ tableId: table.id, error: error.message });
    }
    result.count++;
  }

  return result;
}

/**
 * Export rules to Foundry macros
 */
async function exportRules(rpgWorldId, options = {}) {
  const rules = await fetchFromCritFumbleAPI(`/api/rules?worldId=${rpgWorldId}`);

  const result = { count: 0, created: 0, updated: 0, errors: [] };

  for (const rule of rules) {
    try {
      const macroData = {
        name: rule.name,
        type: rule.trigger === 'script' ? 'script' : 'chat',
        command: rule.effect || '',
        img: rule.metadata?.icon || 'icons/svg/dice-target.svg',
        flags: {
          'crit-fumble': {
            ruleId: rule.id,
            trigger: rule.trigger,
            condition: rule.condition
          },
          ...(rule.metadata?.foundryFlags || {})
        }
      };

      const existingMacro = game.macros.find(m => m.getFlag('crit-fumble', 'ruleId') === rule.id);

      if (existingMacro) {
        await existingMacro.update(macroData);
        result.updated++;
      } else {
        await Macro.create(macroData);
        result.created++;
      }
    } catch (error) {
      result.errors.push({ ruleId: rule.id, error: error.message });
    }
    result.count++;
  }

  return result;
}

/**
 * Export chat events to Foundry chat messages
 */
async function exportChatEvents(rpgWorldId, options = {}) {
  const events = await fetchFromCritFumbleAPI(`/api/events?worldId=${rpgWorldId}&eventType=chat,emote,ooc,whisper`);

  const result = { count: 0, created: 0, updated: 0, errors: [] };

  for (const event of events) {
    try {
      // Map event types to Foundry chat message types
      let messageType = CONST.CHAT_MESSAGE_TYPES.OTHER;
      if (event.eventType === 'emote') {
        messageType = CONST.CHAT_MESSAGE_TYPES.EMOTE;
      } else if (event.eventType === 'ooc') {
        messageType = CONST.CHAT_MESSAGE_TYPES.OOC;
      } else if (event.eventType === 'whisper') {
        messageType = CONST.CHAT_MESSAGE_TYPES.WHISPER;
      }

      const messageData = {
        content: event.data?.message || event.description || '',
        type: messageType,
        speaker: event.data?.speaker || {},
        flags: {
          'crit-fumble': {
            eventId: event.id,
            originalEventType: event.eventType
          },
          ...(event.metadata?.foundryFlags || {})
        }
      };

      // Add roll data if present
      if (event.data?.rolls) {
        messageData.rolls = event.data.rolls;
      }

      // Chat messages can't be updated easily, so we only create
      await ChatMessage.create(messageData);
      result.created++;
    } catch (error) {
      result.errors.push({ eventId: event.id, error: error.message });
    }
    result.count++;
  }

  return result;
}

/**
 * Export combat sheets to Foundry combat encounters
 */
async function exportCombatSheets(rpgWorldId, options = {}) {
  const combatSheets = await fetchFromCritFumbleAPI(`/api/sheets?worldId=${rpgWorldId}&type=combat`);

  const result = { count: 0, created: 0, updated: 0, errors: [] };

  for (const sheet of combatSheets) {
    try {
      const combatData = {
        scene: sheet.boardId || null,
        flags: {
          'crit-fumble': {
            sheetId: sheet.id
          },
          ...(sheet.metadata?.foundryFlags || {})
        }
      };

      const existingCombat = game.combats.find(c => c.getFlag('crit-fumble', 'sheetId') === sheet.id);

      let combat;
      if (existingCombat) {
        await existingCombat.update(combatData);
        combat = existingCombat;
        result.updated++;
      } else {
        combat = await Combat.create(combatData);
        result.created++;
      }

      // Add combatants if stored in sheet data
      if (sheet.data?.combatants && Array.isArray(sheet.data.combatants)) {
        // Clear existing combatants
        const existingCombatants = combat.combatants.map(c => c.id);
        if (existingCombatants.length > 0) {
          await combat.deleteEmbeddedDocuments('Combatant', existingCombatants);
        }

        // Add combatants
        const combatantsData = [];
        for (const combatant of sheet.data.combatants) {
          // Find the actor by ID
          const actor = game.actors.get(combatant.actorId);
          if (actor) {
            combatantsData.push({
              actorId: combatant.actorId,
              tokenId: combatant.tokenId,
              initiative: combatant.initiative,
              hidden: combatant.hidden || false
            });
          }
        }

        if (combatantsData.length > 0) {
          await combat.createEmbeddedDocuments('Combatant', combatantsData);
        }
      }

      // Set combat state if stored
      if (sheet.data?.round !== undefined) {
        await combat.update({ round: sheet.data.round });
      }
      if (sheet.data?.turn !== undefined) {
        await combat.update({ turn: sheet.data.turn });
      }
    } catch (error) {
      result.errors.push({ sheetId: sheet.id, error: error.message });
    }
    result.count++;
  }

  return result;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert Foundry walls to voxels
 */
function convertWallsToVoxels(walls) {
  return walls.map(wall => ({
    voxelType: 'wall',
    x: wall.c[0],
    y: wall.c[1],
    metadata: {
      c: wall.c,
      door: wall.door,
      ds: wall.ds,
      move: wall.move,
      sense: wall.sense,
      sound: wall.sound,
      light: wall.light
    }
  }));
}

/**
 * Convert Foundry lights to voxels
 */
function convertLightsToVoxels(lights) {
  return lights.map(light => ({
    voxelType: 'light',
    x: light.x,
    y: light.y,
    metadata: {
      config: light.config,
      hidden: light.hidden,
      radius: light.config.dim
    }
  }));
}

/**
 * Convert Foundry sounds to voxels
 */
function convertSoundsToVoxels(sounds) {
  return sounds.map(sound => ({
    voxelType: 'sound',
    x: sound.x,
    y: sound.y,
    metadata: {
      path: sound.path,
      radius: sound.radius,
      volume: sound.volume,
      easing: sound.easing
    }
  }));
}

/**
 * Convert Foundry drawings to voxels
 */
function convertDrawingsToVoxels(drawings) {
  return drawings.map(drawing => ({
    voxelType: 'drawing',
    x: drawing.x,
    y: drawing.y,
    metadata: {
      shape: drawing.shape,
      fillColor: drawing.fillColor,
      fillAlpha: drawing.fillAlpha,
      strokeColor: drawing.strokeColor,
      strokeWidth: drawing.strokeWidth,
      text: drawing.text,
      textColor: drawing.textColor,
      width: drawing.width,
      height: drawing.height,
      rotation: drawing.rotation
    }
  }));
}

/**
 * Extract tags from Foundry document folders
 */
function extractTags(document) {
  const tags = [];

  if (document.folder) {
    tags.push(document.folder.name);
  }

  // Extract tags from flags if present
  if (document.flags?.tags) {
    tags.push(...document.flags.tags);
  }

  return [...new Set(tags)]; // Remove duplicates
}

/**
 * Send data to Crit-Fumble API
 */
/**
 * Send data to Crit-Fumble unified sync endpoint
 */
async function sendToCritFumbleAPI(endpoint, method, data) {
  const config = game.settings.get('foundry-core-concepts-api', 'config') || {};
  const critFumbleUrl = config.critFumbleApiUrl || process.env.CRIT_FUMBLE_API_URL || 'http://localhost:3000';
  const apiToken = config.apiToken || game.settings.get('foundry-core-concepts', 'apiToken');

  if (!apiToken) {
    console.warn('[Sync] No API token configured. Sync will not work.');
    return null;
  }

  // Determine entity type from endpoint
  const entityMap = {
    '/api/creatures': 'creatures',
    '/api/things': 'things',
    '/api/boards': 'boards',
    '/api/books': 'books',
    '/api/tables': 'tables',
    '/api/rules': 'rules',
    '/api/events': 'events',
    '/api/sheets': 'sheets'
  };

  const entity = entityMap[endpoint];
  if (!entity) {
    console.error(`[Sync] Unknown endpoint: ${endpoint}`);
    return null;
  }

  try {
    const response = await fetch(`${critFumbleUrl}/api/foundry/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify({
        entity,
        data,
        worldId: data.worldId
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`[Sync] Failed to sync ${entity}:`, error);
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`[Sync] Error syncing ${entity}:`, error);
    throw error;
  }
}

/**
 * Fetch data from Crit-Fumble API
 */
async function fetchFromCritFumbleAPI(endpoint) {
  const config = game.settings.get('foundry-core-concepts-api', 'config') || {};
  const critFumbleUrl = config.critFumbleApiUrl || process.env.CRIT_FUMBLE_API_URL || 'http://localhost:3000';
  const apiToken = config.apiToken || game.settings.get('foundry-core-concepts', 'apiToken');

  if (!apiToken) {
    console.warn('[Sync] No API token configured. Sync will not work.');
    return [];
  }

  try {
    const response = await fetch(`${critFumbleUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`[Sync] Failed to fetch from ${endpoint}:`, error);
      return [];
    }

    const json = await response.json();

    // Handle different response formats
    if (Array.isArray(json)) {
      return json;
    } else if (json.creatures) {
      return json.creatures;
    } else if (json.things) {
      return json.things;
    } else if (json.boards) {
      return json.boards;
    } else if (json.books) {
      return json.books;
    } else if (json.tables) {
      return json.tables;
    } else if (json.rules) {
      return json.rules;
    } else if (json.events) {
      return json.events;
    } else if (json.sheets) {
      return json.sheets;
    }

    return [];
  } catch (error) {
    console.error(`[Sync] Error fetching from ${endpoint}:`, error);
    return [];
  }
}
