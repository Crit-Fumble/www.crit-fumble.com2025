/**
 * Safe Rule Templates
 *
 * Provides predefined, safe templates for rule effects instead of arbitrary code execution.
 * This prevents security vulnerabilities while maintaining rule functionality.
 */

import { InputValidator } from './validators.mjs';

const MODULE_ID = 'foundry-core-concepts';

/**
 * Safe rule template system
 */
export class RuleTemplates {
  constructor() {
    this.templates = new Map();
    this.conditionOperators = new Map();
    this.initializeTemplates();
    this.initializeConditionOperators();
  }

  /**
   * Initialize safe effect templates
   */
  initializeTemplates() {
    // Notification template
    this.templates.set('notify', {
      name: 'Show Notification',
      description: 'Display a notification message to users',
      params: ['message', 'level'],
      paramDescriptions: {
        message: 'The notification message to display',
        level: 'Notification level: info, warn, error (default: info)'
      },
      execute: async (params, context) => {
        const level = params.level || 'info';
        const validLevels = ['info', 'warn', 'error'];

        if (!validLevels.includes(level)) {
          throw new Error(`Invalid notification level: ${level}`);
        }

        ui.notifications[level](params.message);
      }
    });

    // Modify actor attribute template
    this.templates.set('modifyAttribute', {
      name: 'Modify Actor Attribute',
      description: 'Modify an actor attribute value',
      params: ['actorId', 'attributePath', 'operation', 'value'],
      paramDescriptions: {
        actorId: 'ID of the actor to modify (use "args[0].id" for trigger actor)',
        attributePath: 'Dot-notation path to the attribute (e.g., "system.attributes.hp.value")',
        operation: 'Operation: add, subtract, multiply, divide, set',
        value: 'Value to use in the operation'
      },
      execute: async (params, context) => {
        const actor = game.actors.get(params.actorId);
        if (!actor) {
          throw new Error(`Actor not found: ${params.actorId}`);
        }

        const current = foundry.utils.getProperty(actor, params.attributePath);
        if (current === undefined) {
          throw new Error(`Attribute not found: ${params.attributePath}`);
        }

        const newValue = this._applyOperation(current, params.operation, params.value);
        await actor.update({ [params.attributePath]: newValue });

        if (game.settings.get(MODULE_ID, 'debugMode')) {
          console.log(`Modified ${params.attributePath} from ${current} to ${newValue}`);
        }
      }
    });

    // Create chat message template
    this.templates.set('createChatMessage', {
      name: 'Create Chat Message',
      description: 'Post a message to the chat',
      params: ['content'],
      optionalParams: ['speaker', 'whisper'],
      paramDescriptions: {
        content: 'The message content (HTML supported)',
        speaker: 'Speaker object (optional, defaults to "Core Concepts")',
        whisper: 'Array of user IDs to whisper to (optional)'
      },
      execute: async (params, context) => {
        const messageData = {
          content: params.content,
          speaker: params.speaker || { alias: 'Core Concepts' }
        };

        if (params.whisper) {
          messageData.whisper = Array.isArray(params.whisper) ? params.whisper : [params.whisper];
        }

        await ChatMessage.create(messageData);
      }
    });

    // Roll dice template
    this.templates.set('rollDice', {
      name: 'Roll Dice',
      description: 'Roll dice and optionally show the result',
      params: ['formula'],
      optionalParams: ['showInChat', 'flavor'],
      paramDescriptions: {
        formula: 'Dice formula (e.g., "2d6+3")',
        showInChat: 'Whether to show the roll in chat (default: true)',
        flavor: 'Flavor text for the roll (optional)'
      },
      execute: async (params, context) => {
        const roll = new Roll(params.formula);
        await roll.evaluate({ async: true });

        if (params.showInChat !== false) {
          await roll.toMessage({
            flavor: params.flavor || 'Core Concepts Roll'
          });
        }

        return roll.total;
      }
    });

    // TODO: Add Active Effect template when migrating to Foundry's native Active Effects system
    // TODO: Integrate with ApplicationV2 for visual rule template builder
    this.templates.set('applyEffect', {
      name: 'Apply Effect (Placeholder)',
      description: 'Apply an effect to an actor - FUTURE: will use Active Effects',
      params: ['actorId', 'effectName', 'changes'],
      paramDescriptions: {
        actorId: 'ID of the actor to apply effect to',
        effectName: 'Name of the effect',
        changes: 'Array of change objects (future Active Effects format)'
      },
      execute: async (params, context) => {
        // TODO: Replace with proper Active Effects when implementing Option 3
        ui.notifications.warn('Active Effects not yet implemented. Use modifyAttribute instead.');
        console.log('Effect placeholder:', params);
      }
    });

    // Call Core Concepts hook template
    this.templates.set('triggerHook', {
      name: 'Trigger Custom Hook',
      description: 'Trigger a custom Core Concepts hook',
      params: ['hookName'],
      optionalParams: ['data'],
      paramDescriptions: {
        hookName: 'Name of the hook to trigger (must start with "coreConcepts.")',
        data: 'Data to pass to the hook (optional)'
      },
      execute: async (params, context) => {
        if (!params.hookName.startsWith('coreConcepts.')) {
          throw new Error('Custom hooks must start with "coreConcepts."');
        }

        Hooks.call(params.hookName, params.data || {}, context);
      }
    });

    // Conditional notification template
    this.templates.set('conditionalNotify', {
      name: 'Conditional Notification',
      description: 'Show notification only to specific users',
      params: ['message', 'userIds'],
      optionalParams: ['level'],
      paramDescriptions: {
        message: 'The notification message',
        userIds: 'Array of user IDs who should see the notification',
        level: 'Notification level (default: info)'
      },
      execute: async (params, context) => {
        const currentUserId = game.user.id;
        const targetIds = Array.isArray(params.userIds) ? params.userIds : [params.userIds];

        if (targetIds.includes(currentUserId)) {
          const level = params.level || 'info';
          ui.notifications[level](params.message);
        }
      }
    });

    // Play sound template
    this.templates.set('playSound', {
      name: 'Play Sound',
      description: 'Play an audio file',
      params: ['soundPath'],
      optionalParams: ['volume'],
      paramDescriptions: {
        soundPath: 'Path to the audio file',
        volume: 'Volume level 0-1 (default: 0.8)'
      },
      execute: async (params, context) => {
        const volume = params.volume !== undefined ? params.volume : 0.8;

        if (volume < 0 || volume > 1) {
          throw new Error('Volume must be between 0 and 1');
        }

        AudioHelper.play({
          src: params.soundPath,
          volume: volume,
          autoplay: true,
          loop: false
        }, true);
      }
    });

    // TODO: Add canvas-based templates when implementing canvas integration
    // TODO: Add socket-based templates for multiplayer sync
  }

  /**
   * Initialize condition operators for safe condition evaluation
   */
  initializeConditionOperators() {
    this.conditionOperators.set('equals', (a, b) => a === b);
    this.conditionOperators.set('notEquals', (a, b) => a !== b);
    this.conditionOperators.set('greaterThan', (a, b) => a > b);
    this.conditionOperators.set('lessThan', (a, b) => a < b);
    this.conditionOperators.set('greaterOrEqual', (a, b) => a >= b);
    this.conditionOperators.set('lessOrEqual', (a, b) => a <= b);
    this.conditionOperators.set('contains', (a, b) => String(a).includes(String(b)));
    this.conditionOperators.set('startsWith', (a, b) => String(a).startsWith(String(b)));
    this.conditionOperators.set('endsWith', (a, b) => String(a).endsWith(String(b)));
    this.conditionOperators.set('matches', (a, b) => new RegExp(b).test(String(a)));
  }

  /**
   * Apply a mathematical operation
   * @param {number} current - Current value
   * @param {string} operation - Operation to perform
   * @param {number} value - Value to use
   * @returns {number} Result
   */
  _applyOperation(current, operation, value) {
    const numCurrent = Number(current);
    const numValue = Number(value);

    if (isNaN(numCurrent) || isNaN(numValue)) {
      throw new Error('Operation requires numeric values');
    }

    switch (operation) {
      case 'add':
        return numCurrent + numValue;
      case 'subtract':
        return numCurrent - numValue;
      case 'multiply':
        return numCurrent * numValue;
      case 'divide':
        if (numValue === 0) throw new Error('Division by zero');
        return numCurrent / numValue;
      case 'set':
        return numValue;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  /**
   * Execute a template with given parameters
   * @param {string} templateName - Name of the template
   * @param {Object} params - Parameters for the template
   * @param {Object} context - Execution context
   * @returns {Promise<*>} Template execution result
   */
  async executeTemplate(templateName, params, context) {
    // Validate template name
    InputValidator.validateTemplate(templateName, this.templates);

    const template = this.templates.get(templateName);

    // Validate required parameters
    InputValidator.validateTemplateParams(params, template.params);

    // Execute template
    try {
      return await template.execute.call(this, params, context);
    } catch (error) {
      console.error(`Rule template execution failed (${templateName}):`, error);
      throw new Error(`Template "${templateName}" failed: ${error.message}`);
    }
  }

  /**
   * Evaluate a safe condition
   * @param {Object} condition - Condition object with operator and operands
   * @param {Object} context - Evaluation context
   * @returns {boolean} Condition result
   */
  evaluateCondition(condition, context) {
    // Simple boolean value
    if (typeof condition === 'boolean') {
      return condition;
    }

    // Condition object format:
    // { operator: 'equals', left: 'args[0].name', right: 'Dragon' }
    if (!condition.operator) {
      throw new Error('Condition must have an operator');
    }

    const operator = this.conditionOperators.get(condition.operator);
    if (!operator) {
      throw new Error(`Unknown condition operator: ${condition.operator}`);
    }

    // Resolve operands
    const left = this._resolveValue(condition.left, context);
    const right = this._resolveValue(condition.right, context);

    return operator(left, right);
  }

  /**
   * Resolve a value from context or use literal
   * @param {*} value - Value to resolve
   * @param {Object} context - Resolution context
   * @returns {*} Resolved value
   */
  _resolveValue(value, context) {
    // Literal value
    if (typeof value !== 'string') {
      return value;
    }

    // Context path (e.g., "args[0].name")
    if (value.startsWith('args[') || value.startsWith('game.') || value.startsWith('actor.')) {
      return foundry.utils.getProperty(context, value);
    }

    // Literal string
    return value;
  }

  /**
   * Get all available templates
   * @returns {Map} Templates map
   */
  getTemplates() {
    return this.templates;
  }

  /**
   * Get template by name
   * @param {string} name - Template name
   * @returns {Object|null} Template or null if not found
   */
  getTemplate(name) {
    return this.templates.get(name) || null;
  }

  /**
   * Get template names
   * @returns {Array<string>} Template names
   */
  getTemplateNames() {
    return Array.from(this.templates.keys());
  }
}

// Export singleton instance
export const ruleTemplates = new RuleTemplates();
