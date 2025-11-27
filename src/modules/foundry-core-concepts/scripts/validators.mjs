/**
 * Input Validation and Permission Guards
 *
 * Provides secure input validation and permission enforcement
 * for the Core Concepts module to prevent security vulnerabilities.
 */

const MODULE_ID = 'foundry-core-concepts';

/**
 * Input validation utilities
 */
export class InputValidator {
  /**
   * Validate rule name
   * @param {string} name - Rule name to validate
   * @returns {boolean} True if valid
   * @throws {Error} If validation fails
   */
  static validateRuleName(name) {
    if (!name || typeof name !== 'string') {
      throw new Error('Rule name must be a non-empty string');
    }
    if (name.length > 100) {
      throw new Error('Rule name too long (max 100 characters)');
    }
    // Prevent XSS in UI
    if (/<script|javascript:|on\w+=/i.test(name)) {
      throw new Error('Rule name contains invalid characters');
    }
    return true;
  }

  /**
   * Validate trigger hook name
   * @param {string} trigger - Hook name to validate
   * @returns {boolean} True if valid
   * @throws {Error} If validation fails
   */
  static validateTrigger(trigger) {
    const ALLOWED_HOOKS = [
      'updateActor', 'createActor', 'deleteActor',
      'updateToken', 'createToken', 'deleteToken',
      'updateItem', 'createItem', 'deleteItem',
      'updateScene', 'createScene', 'deleteScene',
      'updateCombat', 'createCombat', 'deleteCombat',
      'updateJournalEntry', 'createJournalEntry', 'deleteJournalEntry',
      'preCreateChatMessage', 'createChatMessage',
      'updateWorldTime',
      'combatRound', 'combatTurn',
      'canvasReady', 'ready'
    ];

    if (!trigger || typeof trigger !== 'string') {
      throw new Error('Trigger must be a non-empty string');
    }

    if (!ALLOWED_HOOKS.includes(trigger)) {
      throw new Error(
        `Invalid trigger hook: ${trigger}. Allowed hooks: ${ALLOWED_HOOKS.join(', ')}`
      );
    }

    return true;
  }

  /**
   * Validate rule template name
   * @param {string} templateName - Template name to validate
   * @param {Object} templates - Available templates map
   * @returns {boolean} True if valid
   * @throws {Error} If validation fails
   */
  static validateTemplate(templateName, templates) {
    if (!templateName || typeof templateName !== 'string') {
      throw new Error('Template name must be a non-empty string');
    }

    if (!templates.has(templateName)) {
      const available = Array.from(templates.keys()).join(', ');
      throw new Error(
        `Unknown template: ${templateName}. Available templates: ${available}`
      );
    }

    return true;
  }

  /**
   * Validate template parameters
   * @param {Object} params - Parameters to validate
   * @param {Array<string>} requiredParams - Required parameter names
   * @returns {boolean} True if valid
   * @throws {Error} If validation fails
   */
  static validateTemplateParams(params, requiredParams) {
    if (!params || typeof params !== 'object') {
      throw new Error('Template parameters must be an object');
    }

    for (const param of requiredParams) {
      if (!(param in params)) {
        throw new Error(`Missing required parameter: ${param}`);
      }
    }

    return true;
  }

  /**
   * Sanitize HTML to prevent XSS
   * @param {string} html - HTML string to sanitize
   * @returns {string} Sanitized HTML (text only)
   */
  static sanitizeHTML(html) {
    if (!html || typeof html !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  /**
   * Validate entity name (types, books, etc.)
   * @param {string} name - Name to validate
   * @param {string} entityType - Type of entity (for error messages)
   * @returns {boolean} True if valid
   * @throws {Error} If validation fails
   */
  static validateEntityName(name, entityType = 'Entity') {
    if (!name || typeof name !== 'string') {
      throw new Error(`${entityType} name must be a non-empty string`);
    }
    if (name.length > 200) {
      throw new Error(`${entityType} name too long (max 200 characters)`);
    }
    if (/<script|javascript:|on\w+=/i.test(name)) {
      throw new Error(`${entityType} name contains invalid characters`);
    }
    return true;
  }

  /**
   * Validate JSON object for flags
   * @param {*} obj - Object to validate
   * @returns {boolean} True if valid
   * @throws {Error} If validation fails
   */
  static validateJSONObject(obj) {
    if (obj === null || obj === undefined) {
      return true; // null/undefined are valid
    }

    if (typeof obj !== 'object') {
      throw new Error('Value must be an object or null');
    }

    // Try to stringify to ensure it's valid JSON
    try {
      JSON.stringify(obj);
    } catch (error) {
      throw new Error('Object contains non-serializable values');
    }

    return true;
  }

  /**
   * Validate priority value
   * @param {number} priority - Priority to validate
   * @returns {boolean} True if valid
   * @throws {Error} If validation fails
   */
  static validatePriority(priority) {
    if (typeof priority !== 'number') {
      throw new Error('Priority must be a number');
    }
    if (priority < 0 || priority > 1000) {
      throw new Error('Priority must be between 0 and 1000');
    }
    if (!Number.isInteger(priority)) {
      throw new Error('Priority must be an integer');
    }
    return true;
  }
}

/**
 * Permission enforcement utilities
 */
export class PermissionGuard {
  /**
   * Require GM permission
   * @param {string} operation - Operation name for error message
   * @throws {Error} If user is not GM
   */
  static requireGM(operation) {
    if (!game.user.isGM) {
      ui.notifications.error(`Only GMs can ${operation}`);
      throw new Error(`Permission denied: ${operation} requires GM`);
    }
  }

  /**
   * Check if user can edit a rule
   * @param {Object} rule - Rule to check
   * @param {Object} user - User to check (defaults to current user)
   * @returns {boolean} True if user can edit
   */
  static canEditRule(rule, user = game.user) {
    return user.isGM || rule.metadata?.author === user.name;
  }

  /**
   * Check if user can delete a rule
   * @param {Object} rule - Rule to check
   * @param {Object} user - User to check (defaults to current user)
   * @returns {boolean} True if user can delete
   */
  static canDeleteRule(rule, user = game.user) {
    // Only GMs can delete rules
    return user.isGM;
  }

  /**
   * Check if user can create rules
   * @param {Object} user - User to check (defaults to current user)
   * @returns {boolean} True if user can create
   */
  static canCreateRule(user = game.user) {
    // Only GMs can create rules
    return user.isGM;
  }

  /**
   * Require rule edit permission
   * @param {Object} rule - Rule to check
   * @param {string} operation - Operation name for error message
   * @throws {Error} If user cannot edit rule
   */
  static requireRuleEdit(rule, operation = 'edit this rule') {
    if (!this.canEditRule(rule)) {
      ui.notifications.error(`You do not have permission to ${operation}`);
      throw new Error(`Permission denied: ${operation}`);
    }
  }

  /**
   * Require rule delete permission
   * @param {Object} rule - Rule to check
   * @throws {Error} If user cannot delete rule
   */
  static requireRuleDelete(rule) {
    if (!this.canDeleteRule(rule)) {
      ui.notifications.error('Only GMs can delete rules');
      throw new Error('Permission denied: delete rule requires GM');
    }
  }

  /**
   * Check if user has permission on a document
   * @param {Document} document - Document to check
   * @param {string} permission - Permission level ('view', 'edit', 'delete')
   * @param {Object} user - User to check (defaults to current user)
   * @returns {boolean} True if user has permission
   */
  static hasDocumentPermission(document, permission = 'view', user = game.user) {
    if (user.isGM) return true;

    const level = {
      'view': CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
      'edit': CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
      'delete': CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
    }[permission] || CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER;

    return document.testUserPermission(user, level);
  }
}

// TODO: Add validation for Foundry V12+ DataModel schemas when migrating to custom documents
// TODO: Integrate with Foundry's permission system for more granular access control
// TODO: Add audit logging for security-sensitive operations
