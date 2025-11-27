/**
 * Rules Engine
 *
 * Implements a formal rules system with triggers, conditions, and effects.
 * Rules can be triggered by hooks and execute conditional logic.
 *
 * SECURITY: Uses safe templates instead of eval() to prevent code injection.
 */

import { InputValidator, PermissionGuard } from './validators.mjs';
import { ruleTemplates } from './rule-templates.mjs';

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
    // Security: Permission check
    PermissionGuard.requireGM('create rules');

    // Security: Input validation
    InputValidator.validateRuleName(name);
    InputValidator.validateTrigger(trigger);

    if (options.priority !== undefined) {
      InputValidator.validatePriority(options.priority);
    }

    // Validate effect format (must be template-based)
    if (typeof effect === 'string') {
      throw new Error(
        'String-based effects are no longer supported for security reasons. ' +
        'Please use template-based effects. Available templates: ' +
        ruleTemplates.getTemplateNames().join(', ')
      );
    }

    if (!effect.template) {
      throw new Error('Effect must specify a template name');
    }

    InputValidator.validateTemplate(effect.template, ruleTemplates.getTemplates());

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
            tags: options.tags || [],
            createdAt: new Date().toISOString(),
            version: '0.3.0' // Security fix version
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
   * Evaluate a rule (SECURITY FIXED: No more eval!)
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
      // Helper functions for safe value resolution
      getActor: (id) => game.actors.get(id),
      getItem: (id) => game.items.get(id),
      getToken: (id) => canvas.tokens.get(id),
      roll: (formula) => new Roll(formula).evaluate({ async: true })
    };

    // Evaluate condition using safe template system
    let conditionResult = false;
    try {
      // Legacy string conditions are no longer supported
      if (typeof rule.condition === 'string') {
        console.warn(
          `Rule "${rule.name}" uses legacy string condition. ` +
          `Please migrate to safe condition objects. Treating as always true.`
        );
        conditionResult = true; // Default to true for backwards compatibility
      } else {
        // Safe condition evaluation
        conditionResult = ruleTemplates.evaluateCondition(rule.condition, context);
      }
    } catch (error) {
      console.error(`Rules Engine | Error in condition for rule ${rule.name}:`, error);
      if (game.settings.get(MODULE_ID, 'debugMode')) {
        ui.notifications.error(`Rule "${rule.name}" condition failed: ${error.message}`);
      }
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

    // Execute effect using safe templates
    try {
      // Legacy string effects are no longer supported
      if (typeof rule.effect === 'string') {
        ui.notifications.error(
          `Rule "${rule.name}" uses legacy string effect which is not secure. ` +
          `Please update the rule to use safe templates.`
        );
        console.error(
          `SECURITY: Rule "${rule.name}" attempted to use string effect. ` +
          `This is blocked for security. Please migrate to template-based effects.`
        );
        return;
      }

      // Execute safe template
      await ruleTemplates.executeTemplate(
        rule.effect.template,
        rule.effect.params || {},
        context
      );

      if (game.settings.get(MODULE_ID, 'debugMode')) {
        console.log(`Rules Engine | Effect executed for rule: ${rule.name}`);
      }

      // Trigger success hook for monitoring
      Hooks.call('coreConcepts.ruleExecuted', rule, hookArgs);

    } catch (error) {
      console.error(`Rules Engine | Error in effect for rule ${rule.name}:`, error);
      if (game.settings.get(MODULE_ID, 'debugMode')) {
        ui.notifications.error(`Rule "${rule.name}" effect failed: ${error.message}`);
      }

      // Trigger error hook for monitoring
      Hooks.call('coreConcepts.ruleExecutionFailed', rule, error, hookArgs);
    }
  }

  // TODO: Add migration utility to convert old string-based rules to template-based rules
  // TODO: Integrate with ApplicationV2 for visual rule builder with template selection
  // TODO: Add rule testing/preview feature before applying to production

  /**
   * Enable a rule
   */
  async enableRule(ruleId) {
    const rule = this.rules.get(ruleId);
    if (!rule) return;

    // Security: Permission check
    PermissionGuard.requireRuleEdit(rule, 'enable this rule');

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

    // Security: Permission check
    PermissionGuard.requireRuleEdit(rule, 'disable this rule');

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

    // Security: Permission check - only GMs can delete
    PermissionGuard.requireRuleDelete(rule);

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
