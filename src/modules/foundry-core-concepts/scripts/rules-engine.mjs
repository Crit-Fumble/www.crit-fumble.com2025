/**
 * Rules Engine
 *
 * Implements a formal rules system with triggers, conditions, and effects.
 * Rules can be triggered by hooks and execute conditional logic.
 */

const MODULE_ID = 'foundry-core-concepts';

export class RulesEngine {
  constructor() {
    this.rules = new Map();
    this.ruleHooks = new Map();
    this.initialized = false;
  }

  /**
   * Initialize the rules engine
   */
  async initialize() {
    if (!game.settings.get(MODULE_ID, 'enableRules')) {
      console.log('Rules Engine | Disabled in settings');
      return;
    }

    console.log('Rules Engine | Initializing...');

    // Load rules from journal entries
    await this.loadRules();

    // Register rule hooks
    await this.registerRuleHooks();

    this.initialized = true;
    console.log('Rules Engine | Ready');
  }

  /**
   * Load rules from journal entries
   */
  async loadRules() {
    // Look for journal entries marked as rules
    const ruleEntries = game.journal.filter(j => j.getFlag(MODULE_ID, 'isRule'));

    for (const entry of ruleEntries) {
      const ruleData = {
        id: entry.id,
        name: entry.name,
        journal: entry,
        trigger: entry.getFlag(MODULE_ID, 'ruleTrigger') || '',
        condition: entry.getFlag(MODULE_ID, 'ruleCondition') || 'true',
        effect: entry.getFlag(MODULE_ID, 'ruleEffect') || '',
        priority: entry.getFlag(MODULE_ID, 'rulePriority') || 100,
        enabled: entry.getFlag(MODULE_ID, 'ruleEnabled') !== false,
        metadata: entry.getFlag(MODULE_ID, 'ruleMetadata') || {}
      };

      this.rules.set(entry.id, ruleData);
      console.log(`Rules Engine | Loaded rule: ${ruleData.name}`);
    }

    console.log(`Rules Engine | Loaded ${this.rules.size} rules`);
  }

  /**
   * Create a new rule
   */
  async createRule(name, trigger, condition, effect, options = {}) {
    const journalData = {
      name: name,
      flags: {
        [MODULE_ID]: {
          isRule: true,
          ruleTrigger: trigger,
          ruleCondition: condition,
          ruleEffect: effect,
          rulePriority: options.priority || 100,
          ruleEnabled: options.enabled !== false,
          ruleMetadata: {
            description: options.description || '',
            category: options.category || 'general',
            author: options.author || game.user.name,
            tags: options.tags || []
          }
        }
      }
    };

    const journal = await JournalEntry.create(journalData);

    const ruleData = {
      id: journal.id,
      name: name,
      journal: journal,
      trigger: trigger,
      condition: condition,
      effect: effect,
      priority: options.priority || 100,
      enabled: options.enabled !== false,
      metadata: journalData.flags[MODULE_ID].ruleMetadata
    };

    this.rules.set(journal.id, ruleData);

    // Re-register hooks to include new rule
    await this.registerRuleHooks();

    ui.notifications.info(`Created rule: ${name}`);
    console.log(`Rules Engine | Created rule: ${name}`);
    return ruleData;
  }

  /**
   * Register hooks for all rules
   */
  async registerRuleHooks() {
    // Clear existing hooks
    for (const [hookId, hookFn] of this.ruleHooks) {
      Hooks.off(hookId, hookFn);
    }
    this.ruleHooks.clear();

    // Group rules by trigger
    const rulesByTrigger = new Map();
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;
      if (!rule.trigger) continue;

      if (!rulesByTrigger.has(rule.trigger)) {
        rulesByTrigger.set(rule.trigger, []);
      }
      rulesByTrigger.get(rule.trigger).push(rule);
    }

    // Register hooks for each trigger
    for (const [trigger, rules] of rulesByTrigger) {
      // Sort by priority
      rules.sort((a, b) => a.priority - b.priority);

      // Create hook function
      const hookFn = async (...args) => {
        for (const rule of rules) {
          try {
            await this.evaluateRule(rule, args);
          } catch (error) {
            console.error(`Rules Engine | Error evaluating rule ${rule.name}:`, error);
            if (game.settings.get(MODULE_ID, 'debugMode')) {
              ui.notifications.error(`Rule "${rule.name}" failed: ${error.message}`);
            }
          }
        }
      };

      // Register the hook
      Hooks.on(trigger, hookFn);
      this.ruleHooks.set(trigger, hookFn);

      console.log(`Rules Engine | Registered ${rules.length} rules for trigger: ${trigger}`);
    }
  }

  /**
   * Evaluate a rule
   */
  async evaluateRule(rule, hookArgs) {
    if (game.settings.get(MODULE_ID, 'debugMode')) {
      console.log(`Rules Engine | Evaluating rule: ${rule.name}`);
    }

    // Build context for condition and effect
    const context = {
      game: game,
      args: hookArgs,
      rule: rule,
      // Helper functions
      getActor: (id) => game.actors.get(id),
      getItem: (id) => game.items.get(id),
      getToken: (id) => canvas.tokens.get(id),
      roll: (formula) => new Roll(formula).evaluate({ async: true })
    };

    // Evaluate condition
    let conditionResult = false;
    try {
      const conditionFn = new Function(...Object.keys(context), `return (${rule.condition});`);
      conditionResult = conditionFn(...Object.values(context));
    } catch (error) {
      console.error(`Rules Engine | Error in condition for rule ${rule.name}:`, error);
      return;
    }

    // If condition is false, skip effect
    if (!conditionResult) {
      if (game.settings.get(MODULE_ID, 'debugMode')) {
        console.log(`Rules Engine | Condition false for rule: ${rule.name}`);
      }
      return;
    }

    if (game.settings.get(MODULE_ID, 'debugMode')) {
      console.log(`Rules Engine | Condition true, executing effect for rule: ${rule.name}`);
    }

    // Execute effect
    try {
      const effectFn = new Function(...Object.keys(context), rule.effect);
      await effectFn(...Object.values(context));

      if (game.settings.get(MODULE_ID, 'debugMode')) {
        console.log(`Rules Engine | Effect executed for rule: ${rule.name}`);
      }
    } catch (error) {
      console.error(`Rules Engine | Error in effect for rule ${rule.name}:`, error);
      if (game.settings.get(MODULE_ID, 'debugMode')) {
        ui.notifications.error(`Rule "${rule.name}" effect failed: ${error.message}`);
      }
    }
  }

  /**
   * Enable a rule
   */
  async enableRule(ruleId) {
    const rule = this.rules.get(ruleId);
    if (!rule) return;

    rule.enabled = true;
    await rule.journal.setFlag(MODULE_ID, 'ruleEnabled', true);

    // Re-register hooks
    await this.registerRuleHooks();

    ui.notifications.info(`Enabled rule: ${rule.name}`);
  }

  /**
   * Disable a rule
   */
  async disableRule(ruleId) {
    const rule = this.rules.get(ruleId);
    if (!rule) return;

    rule.enabled = false;
    await rule.journal.setFlag(MODULE_ID, 'ruleEnabled', false);

    // Re-register hooks
    await this.registerRuleHooks();

    ui.notifications.info(`Disabled rule: ${rule.name}`);
  }

  /**
   * Delete a rule
   */
  async deleteRule(ruleId) {
    const rule = this.rules.get(ruleId);
    if (!rule) return;

    await rule.journal.delete();
    this.rules.delete(ruleId);

    // Re-register hooks
    await this.registerRuleHooks();

    ui.notifications.info(`Deleted rule: ${rule.name}`);
  }

  /**
   * Get rule by ID
   */
  getRule(ruleId) {
    return this.rules.get(ruleId);
  }

  /**
   * Get all rules
   */
  getAllRules() {
    return Array.from(this.rules.values());
  }

  /**
   * Get rules by category
   */
  getRulesByCategory(category) {
    return Array.from(this.rules.values()).filter(r => r.metadata.category === category);
  }

  /**
   * Get enabled rules
   */
  getEnabledRules() {
    return Array.from(this.rules.values()).filter(r => r.enabled);
  }

  /**
   * Get rules by type
   * @param {string} type - Rule type (e.g., 'condition', 'action', 'damage-type')
   * @returns {Array} Array of rules
   */
  getByType(type) {
    return Array.from(this.rules.values()).filter(r => r.metadata.type === type);
  }

  /**
   * Get rules by tag
   * @param {string} tag - Tag to filter by
   * @returns {Array} Array of rules
   */
  getByTag(tag) {
    return Array.from(this.rules.values()).filter(r =>
      r.metadata.tags && r.metadata.tags.includes(tag)
    );
  }

  /**
   * Cleanup
   */
  async cleanup() {
    // Remove all hooks
    for (const [hookId, hookFn] of this.ruleHooks) {
      Hooks.off(hookId, hookFn);
    }
    this.ruleHooks.clear();
    this.rules.clear();
    this.initialized = false;
  }
}
