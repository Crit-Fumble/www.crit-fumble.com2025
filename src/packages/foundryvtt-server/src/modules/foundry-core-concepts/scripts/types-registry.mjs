/**
 * Types Registry
 *
 * Manages unified type definitions (classes, creature types, item types, etc.)
 * that can be applied to actors and items as templates.
 */

import { InputValidator, PermissionGuard } from './validators.mjs';

const MODULE_ID = 'foundry-core-concepts';

// TODO: Migrate to Foundry V12+ DataModel schema for better type safety
// TODO: Integrate with Active Effects system for type-based modifiers
export class TypesRegistry {
  constructor() {
    this.types = new Map();
    this.initialized = false;
  }

  /**
   * Initialize the types registry
   */
  async initialize() {
    if (!game.settings.get(MODULE_ID, 'enableTypes')) {
      console.log('Types Registry | Disabled in settings');
      return;
    }

    console.log('Types Registry | Initializing...');

    // Load types from compendiums
    await this.loadTypes();

    // Register hooks
    this.registerHooks();

    this.initialized = true;
    console.log('Types Registry | Ready');
  }

  /**
   * Load type definitions from compendiums
   */
  async loadTypes() {
    // Look for types in journal entries with specific flag
    const typeEntries = game.journal.filter(j => j.getFlag(MODULE_ID, 'isType'));

    for (const entry of typeEntries) {
      const typeData = {
        id: entry.id,
        name: entry.name,
        category: entry.getFlag(MODULE_ID, 'typeCategory') || 'general',
        template: entry.getFlag(MODULE_ID, 'typeTemplate') || {},
        description: entry.getFlag(MODULE_ID, 'typeDescription') || '',
        properties: entry.getFlag(MODULE_ID, 'typeProperties') || {}
      };

      this.types.set(entry.id, typeData);
      console.log(`Types Registry | Loaded type: ${typeData.name}`);
    }

    console.log(`Types Registry | Loaded ${this.types.size} type definitions`);
  }

  /**
   * Register a new type definition
   */
  async registerType(name, category, template, options = {}) {
    // Security: Permission check
    PermissionGuard.requireGM('create type definitions');

    // Security: Input validation
    InputValidator.validateEntityName(name, 'Type');
    InputValidator.validateJSONObject(template);
    InputValidator.validateJSONObject(options.properties);

    // Create a journal entry to store the type
    const journalData = {
      name: name,
      flags: {
        [MODULE_ID]: {
          isType: true,
          typeCategory: category,
          typeTemplate: template,
          typeDescription: options.description || '',
          typeProperties: options.properties || {}
        }
      }
    };

    const journal = await JournalEntry.create(journalData);

    // Add to registry
    const typeData = {
      id: journal.id,
      name: name,
      category: category,
      template: template,
      description: options.description || '',
      properties: options.properties || {}
    };

    this.types.set(journal.id, typeData);

    console.log(`Types Registry | Registered type: ${name}`);
    return typeData;
  }

  /**
   * Apply a type to an actor
   */
  async applyTypeToActor(actor, typeId) {
    const type = this.types.get(typeId);
    if (!type) {
      ui.notifications.warn(`Type ${typeId} not found`);
      return;
    }

    // Merge type template with actor data
    const updates = {
      system: foundry.utils.mergeObject(actor.system, type.template),
      flags: {
        [MODULE_ID]: {
          appliedTypes: [...(actor.getFlag(MODULE_ID, 'appliedTypes') || []), typeId]
        }
      }
    };

    await actor.update(updates);

    ui.notifications.info(`Applied type "${type.name}" to ${actor.name}`);
    console.log(`Types Registry | Applied type ${type.name} to actor ${actor.name}`);
  }

  /**
   * Apply a type to an item
   */
  async applyTypeToItem(item, typeId) {
    const type = this.types.get(typeId);
    if (!type) {
      ui.notifications.warn(`Type ${typeId} not found`);
      return;
    }

    // Merge type template with item data
    const updates = {
      system: foundry.utils.mergeObject(item.system, type.template),
      flags: {
        [MODULE_ID]: {
          appliedTypes: [...(item.getFlag(MODULE_ID, 'appliedTypes') || []), typeId]
        }
      }
    };

    await item.update(updates);

    ui.notifications.info(`Applied type "${type.name}" to ${item.name}`);
    console.log(`Types Registry | Applied type ${type.name} to item ${item.name}`);
  }

  /**
   * Get all types by category
   */
  getTypesByCategory(category) {
    return Array.from(this.types.values()).filter(t => t.category === category);
  }

  /**
   * Get all categories
   */
  getCategories() {
    const categories = new Set();
    for (const type of this.types.values()) {
      categories.add(type.category);
    }
    return Array.from(categories);
  }

  /**
   * Get type by ID
   */
  getType(typeId) {
    return this.types.get(typeId);
  }

  /**
   * Get types applied to a document
   */
  getAppliedTypes(document) {
    const typeIds = document.getFlag(MODULE_ID, 'appliedTypes') || [];
    return typeIds.map(id => this.types.get(id)).filter(t => t);
  }

  /**
   * Register hooks for type system
   */
  registerHooks() {
    // Add context menu option to actors
    Hooks.on('getActorSheetHeaderButtons', (sheet, buttons) => {
      if (!game.user.isGM) return;

      buttons.unshift({
        label: 'Apply Type',
        class: 'apply-type',
        icon: 'fas fa-tag',
        onclick: () => this.showTypeDialog(sheet.actor)
      });
    });

    // Add context menu option to items
    Hooks.on('getItemSheetHeaderButtons', (sheet, buttons) => {
      if (!game.user.isGM) return;

      buttons.unshift({
        label: 'Apply Type',
        class: 'apply-type',
        icon: 'fas fa-tag',
        onclick: () => this.showTypeDialog(sheet.item)
      });
    });
  }

  /**
   * Show dialog to select and apply a type
   */
  async showTypeDialog(document) {
    const categories = this.getCategories();

    // Build HTML for type selection
    let html = '<form><div class="form-group">';
    html += '<label>Select Type Category:</label>';
    html += '<select name="category" id="type-category">';
    html += '<option value="">-- Select Category --</option>';
    for (const category of categories) {
      html += `<option value="${category}">${category}</option>`;
    }
    html += '</select>';
    html += '</div>';
    html += '<div class="form-group">';
    html += '<label>Select Type:</label>';
    html += '<select name="type" id="type-select" disabled>';
    html += '<option value="">-- Select Category First --</option>';
    html += '</select>';
    html += '</div></form>';

    new Dialog({
      title: `Apply Type to ${document.name}`,
      content: html,
      buttons: {
        apply: {
          label: 'Apply',
          callback: async (html) => {
            const typeId = html.find('#type-select').val();
            if (!typeId) {
              ui.notifications.warn('Please select a type');
              return;
            }

            if (document.documentName === 'Actor') {
              await this.applyTypeToActor(document, typeId);
            } else if (document.documentName === 'Item') {
              await this.applyTypeToItem(document, typeId);
            }
          }
        },
        cancel: {
          label: 'Cancel'
        }
      },
      render: (html) => {
        // Handle category selection
        html.find('#type-category').on('change', (event) => {
          const category = event.target.value;
          const typeSelect = html.find('#type-select');

          if (!category) {
            typeSelect.prop('disabled', true);
            typeSelect.html('<option value="">-- Select Category First --</option>');
            return;
          }

          const types = this.getTypesByCategory(category);
          typeSelect.prop('disabled', false);
          typeSelect.html('<option value="">-- Select Type --</option>');

          for (const type of types) {
            typeSelect.append(`<option value="${type.id}">${type.name}</option>`);
          }
        });
      }
    }).render(true);
  }

  /**
   * Cleanup
   */
  async cleanup() {
    this.types.clear();
    this.initialized = false;
  }
}
