/**
 * Modes Manager
 *
 * Manages game modes (Character Creation, Combat, Exploration, Social, Travel, Downtime).
 * Each mode can have its own UI, rules, and available actions.
 */

const MODULE_ID = 'foundry-core-concepts';

export class ModesManager {
  constructor() {
    this.modes = new Map();
    this.currentMode = null;
    this.initialized = false;
  }

  /**
   * Initialize the modes manager
   */
  async initialize() {
    if (!game.settings.get(MODULE_ID, 'enableModes')) {
      console.log('Modes Manager | Disabled in settings');
      return;
    }

    console.log('Modes Manager | Initializing...');

    // Register default modes
    this.registerDefaultModes();

    // Load custom modes
    await this.loadCustomModes();

    // Register UI controls
    this.registerUI();

    // Set initial mode
    const savedMode = game.settings.get(MODULE_ID, 'currentMode') || 'exploration';
    await this.switchMode(savedMode);

    this.initialized = true;
    console.log('Modes Manager | Ready');
  }

  /**
   * Register default game modes
   */
  registerDefaultModes() {
    // Character Creation Mode
    this.registerMode('character-creation', {
      name: 'Character Creation',
      description: 'Create and configure player characters',
      icon: 'fas fa-user-plus',
      ui: {
        showActorDirectory: true,
        showItemDirectory: true,
        showScenes: false,
        showCombat: false
      },
      actions: ['create-actor', 'edit-actor', 'assign-items'],
      onActivate: async () => {
        console.log('Modes Manager | Activated: Character Creation');
        if (game.user.isGM) {
          ui.notifications.info('Character Creation mode active');
        }
      },
      onDeactivate: async () => {
        console.log('Modes Manager | Deactivated: Character Creation');
      }
    });

    // Combat Mode (extends existing combat tracker)
    this.registerMode('combat', {
      name: 'Combat',
      description: 'Tactical combat encounters',
      icon: 'fas fa-fist-raised',
      ui: {
        showActorDirectory: true,
        showItemDirectory: true,
        showScenes: true,
        showCombat: true
      },
      actions: ['start-combat', 'roll-initiative', 'attack', 'use-item'],
      onActivate: async () => {
        console.log('Modes Manager | Activated: Combat');
        ui.combat?.render(true);
      },
      onDeactivate: async () => {
        console.log('Modes Manager | Deactivated: Combat');
      }
    });

    // Exploration Mode
    this.registerMode('exploration', {
      name: 'Exploration',
      description: 'Explore the world and discover locations',
      icon: 'fas fa-compass',
      ui: {
        showActorDirectory: true,
        showItemDirectory: true,
        showScenes: true,
        showCombat: false
      },
      actions: ['move', 'search', 'interact', 'rest'],
      onActivate: async () => {
        console.log('Modes Manager | Activated: Exploration');
      },
      onDeactivate: async () => {
        console.log('Modes Manager | Deactivated: Exploration');
      }
    });

    // Social Interaction Mode
    this.registerMode('social', {
      name: 'Social Interaction',
      description: 'Interact with NPCs and engage in roleplay',
      icon: 'fas fa-comments',
      ui: {
        showActorDirectory: true,
        showItemDirectory: false,
        showScenes: true,
        showCombat: false
      },
      actions: ['talk', 'persuade', 'intimidate', 'deceive'],
      onActivate: async () => {
        console.log('Modes Manager | Activated: Social Interaction');
      },
      onDeactivate: async () => {
        console.log('Modes Manager | Deactivated: Social Interaction');
      }
    });

    // Travel Mode
    this.registerMode('travel', {
      name: 'Travel',
      description: 'Journey between locations',
      icon: 'fas fa-route',
      ui: {
        showActorDirectory: false,
        showItemDirectory: false,
        showScenes: true,
        showCombat: false
      },
      actions: ['set-destination', 'set-pace', 'manage-supplies'],
      onActivate: async () => {
        console.log('Modes Manager | Activated: Travel');
      },
      onDeactivate: async () => {
        console.log('Modes Manager | Deactivated: Travel');
      }
    });

    // Downtime Mode
    this.registerMode('downtime', {
      name: 'Downtime',
      description: 'Perform downtime activities',
      icon: 'fas fa-home',
      ui: {
        showActorDirectory: true,
        showItemDirectory: true,
        showScenes: false,
        showCombat: false
      },
      actions: ['craft', 'train', 'research', 'rest'],
      onActivate: async () => {
        console.log('Modes Manager | Activated: Downtime');
      },
      onDeactivate: async () => {
        console.log('Modes Manager | Deactivated: Downtime');
      }
    });

    console.log(`Modes Manager | Registered ${this.modes.size} default modes`);
  }

  /**
   * Register a game mode
   */
  registerMode(id, config) {
    this.modes.set(id, {
      id: id,
      name: config.name,
      description: config.description || '',
      icon: config.icon || 'fas fa-gamepad',
      ui: config.ui || {},
      actions: config.actions || [],
      onActivate: config.onActivate || (() => {}),
      onDeactivate: config.onDeactivate || (() => {})
    });

    console.log(`Modes Manager | Registered mode: ${config.name}`);
  }

  /**
   * Load custom modes from settings/compendiums
   */
  async loadCustomModes() {
    // Look for journal entries marked as custom modes
    const customModeEntries = game.journal.filter(j => j.getFlag(MODULE_ID, 'isMode'));

    for (const entry of customModeEntries) {
      const modeId = entry.getFlag(MODULE_ID, 'modeId');
      const modeConfig = entry.getFlag(MODULE_ID, 'modeConfig');

      if (modeId && modeConfig) {
        this.registerMode(modeId, modeConfig);
      }
    }

    console.log(`Modes Manager | Loaded custom modes`);
  }

  /**
   * Switch to a different game mode
   */
  async switchMode(modeId) {
    const newMode = this.modes.get(modeId);
    if (!newMode) {
      console.warn(`Modes Manager | Mode not found: ${modeId}`);
      return;
    }

    // Deactivate current mode
    if (this.currentMode) {
      await this.currentMode.onDeactivate();
    }

    // Activate new mode
    this.currentMode = newMode;
    await newMode.onActivate();

    // Save current mode
    game.settings.set(MODULE_ID, 'currentMode', modeId);

    // Update UI
    this.updateModeUI();

    // Notify users
    if (game.user.isGM) {
      ui.notifications.info(`Switched to ${newMode.name} mode`);
    }

    // Trigger hook for other modules
    Hooks.callAll('coreConcepts.modeChanged', newMode);

    console.log(`Modes Manager | Switched to mode: ${newMode.name}`);
  }

  /**
   * Update UI based on current mode
   */
  updateModeUI() {
    if (!this.currentMode) return;

    const uiConfig = this.currentMode.ui;

    // 1. Control sidebar visibility
    this.updateSidebarVisibility(uiConfig);

    // 2. Show mode-specific actions
    this.renderModeActions();

    // 3. Apply mode-specific CSS
    this.applyModeStyles();

    // 4. Update mode indicator
    const modeIndicator = document.getElementById('mode-indicator');
    if (modeIndicator) {
      modeIndicator.innerHTML = `
        <i class="${this.currentMode.icon}"></i>
        ${this.currentMode.name}
      `;
    }

    console.log(`Modes Manager | Updated UI for mode: ${this.currentMode.name}`);
  }

  /**
   * Control sidebar app visibility based on mode
   */
  updateSidebarVisibility(uiConfig) {
    // Actor Directory
    if (!uiConfig.showActorDirectory && ui.actors?.rendered) {
      ui.actors.close();
    } else if (uiConfig.showActorDirectory && !ui.actors?.rendered && game.user.isGM) {
      ui.actors.render(true);
    }

    // Item Directory
    if (!uiConfig.showItemDirectory && ui.items?.rendered) {
      ui.items.close();
    } else if (uiConfig.showItemDirectory && !ui.items?.rendered && game.user.isGM) {
      ui.items.render(true);
    }

    // Scenes
    if (!uiConfig.showScenes && ui.scenes?.rendered) {
      ui.scenes.close();
    } else if (uiConfig.showScenes && !ui.scenes?.rendered && game.user.isGM) {
      ui.scenes.render(true);
    }

    // Combat Tracker
    if (!uiConfig.showCombat && ui.combat?.rendered) {
      ui.combat.close();
    } else if (uiConfig.showCombat && !ui.combat?.rendered) {
      ui.combat.render(true);
    }
  }

  /**
   * Render mode-specific action panel
   */
  renderModeActions() {
    const actions = this.currentMode.actions || [];
    if (actions.length === 0) {
      // Remove panel if no actions
      const panel = document.getElementById('mode-action-panel');
      if (panel) panel.remove();
      return;
    }

    // Create or update action panel
    let panel = document.getElementById('mode-action-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'mode-action-panel';
      document.body.appendChild(panel);
    }

    // Build action buttons
    panel.innerHTML = `
      <div class="mode-actions">
        <h3>${this.currentMode.name} Actions</h3>
        <div class="action-buttons">
          ${actions.map(action => `
            <button class="mode-action" data-action="${action}">
              <i class="fas fa-${this.getActionIcon(action)}"></i>
              ${this.formatActionName(action)}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    // Add event listeners
    panel.querySelectorAll('.mode-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        this.executeAction(action);
      });
    });
  }

  /**
   * Get icon for action
   */
  getActionIcon(action) {
    const icons = {
      'create-actor': 'user-plus',
      'edit-actor': 'user-edit',
      'assign-items': 'hand-holding',
      'start-combat': 'swords',
      'roll-initiative': 'dice-d20',
      'attack': 'sword',
      'use-item': 'flask',
      'move': 'arrows-alt',
      'search': 'search',
      'interact': 'hand-pointer',
      'rest': 'bed',
      'talk': 'comments',
      'persuade': 'handshake',
      'intimidate': 'angry',
      'deceive': 'mask',
      'set-destination': 'map-marker-alt',
      'set-pace': 'running',
      'manage-supplies': 'box',
      'craft': 'hammer',
      'train': 'dumbbell',
      'research': 'book',
      'default': 'cog'
    };
    return icons[action] || icons['default'];
  }

  /**
   * Execute a mode action
   */
  async executeAction(action) {
    // Trigger hook for other systems to handle
    Hooks.callAll('coreConcepts.modeAction', action, this.currentMode);

    // Default action handlers
    switch (action) {
      case 'create-actor':
        if (game.user.isGM) {
          Actor.create({ name: 'New Character', type: 'character' });
        }
        break;

      case 'start-combat':
        if (game.user.isGM && !game.combat) {
          await Combat.create({ scene: canvas.scene?.id });
          ui.notifications.info('Combat started!');
        }
        break;

      case 'roll-initiative':
        if (game.combat) {
          const tokens = canvas.tokens.controlled;
          if (tokens.length > 0) {
            await game.combat.rollInitiative(tokens.map(t => t.id));
          }
        }
        break;

      case 'rest':
        // Trigger rest dialog for selected tokens
        const selected = canvas.tokens.controlled;
        if (selected.length > 0) {
          ui.notifications.info('Rest initiated for selected tokens');
          // Future: Open rest dialog
        }
        break;

      default:
        console.log(`Mode action: ${action}`);
        ui.notifications.info(`Action: ${this.formatActionName(action)}`);
    }
  }

  /**
   * Format action name for display
   */
  formatActionName(action) {
    return action
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Apply mode-specific CSS classes
   */
  applyModeStyles() {
    // Remove old mode classes
    document.body.classList.forEach(cls => {
      if (cls.startsWith('mode-')) {
        document.body.classList.remove(cls);
      }
    });

    // Add new mode class
    document.body.classList.add(`mode-${this.currentMode.id}`);
  }

  /**
   * Register UI controls
   */
  registerUI() {
    // Register setting for current mode
    game.settings.register(MODULE_ID, 'currentMode', {
      scope: 'world',
      config: false,
      type: String,
      default: 'exploration'
    });

    // Add mode controls to UI
    Hooks.on('renderPlayerList', (app, html) => {
      if (!game.user.isGM) return;

      // Add mode selector
      const modeSelector = $(`
        <div id="mode-selector" style="margin: 5px; padding: 5px; background: rgba(0,0,0,0.5); border-radius: 3px;">
          <label style="font-weight: bold; margin-right: 5px;">Game Mode:</label>
          <select id="mode-select" style="width: 150px;">
            ${Array.from(this.modes.values()).map(mode => `
              <option value="${mode.id}" ${this.currentMode?.id === mode.id ? 'selected' : ''}>
                ${mode.name}
              </option>
            `).join('')}
          </select>
        </div>
      `);

      html.prepend(modeSelector);

      // Handle mode change
      modeSelector.find('#mode-select').on('change', async (event) => {
        const modeId = event.target.value;
        await this.switchMode(modeId);
      });
    });

    // Add mode indicator to scene controls
    Hooks.on('renderSceneControls', (app, html) => {
      const indicator = $(`
        <li id="mode-indicator" class="scene-control" title="${this.currentMode?.description || ''}">
          <i class="${this.currentMode?.icon || 'fas fa-gamepad'}"></i>
          ${this.currentMode?.name || 'Unknown'}
        </li>
      `);

      html.find('.main-controls').prepend(indicator);
    });
  }

  /**
   * Get current mode
   */
  getCurrentMode() {
    return this.currentMode;
  }

  /**
   * Get mode by ID
   */
  getMode(modeId) {
    return this.modes.get(modeId);
  }

  /**
   * Get all modes
   */
  getAllModes() {
    return Array.from(this.modes.values());
  }

  /**
   * Cleanup
   */
  async cleanup() {
    // Remove mode action panel
    const panel = document.getElementById('mode-action-panel');
    if (panel) {
      panel.remove();
    }

    // Remove mode CSS classes
    document.body.classList.forEach(cls => {
      if (cls.startsWith('mode-')) {
        document.body.classList.remove(cls);
      }
    });

    // Deactivate current mode
    if (this.currentMode) {
      await this.currentMode.onDeactivate();
    }

    this.modes.clear();
    this.currentMode = null;
    this.initialized = false;
  }
}
