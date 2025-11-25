/**
 * Behavior Manager
 *
 * Manages all creature behaviors in the game.
 * Handles registration, assignment, and periodic updates.
 */

const MODULE_ID = 'foundry-behaviors';

export class BehaviorManager {
  constructor() {
    this.behaviors = new Map(); // id -> Behavior instance
    this.actorBehaviors = new Map(); // actorId -> Set of behavior ids
    this.updateInterval = 1000; // Update every second
    this.lastUpdate = Date.now();
    this.updateTimer = null;
  }

  /**
   * Initialize the behavior manager
   */
  async initialize() {
    console.log('Behavior Manager | Initializing...');

    // Load built-in behaviors
    await this.loadBuiltInBehaviors();

    // Load behaviors from journal entries
    await this.loadCustomBehaviors();

    // Load actor behavior assignments from flags
    await this.loadActorBehaviors();

    // Start update loop
    this.startUpdateLoop();

    console.log(`Behavior Manager | Initialized with ${this.behaviors.size} behaviors`);
  }

  /**
   * Load built-in behaviors
   */
  async loadBuiltInBehaviors() {
    console.log('Behavior Manager | Loading built-in behaviors...');

    // Load patrol behavior
    try {
      const { PatrolBehavior } = await import('./behaviors/patrol-behavior.mjs');
      this.registerBehavior(new PatrolBehavior());
    } catch (error) {
      console.log('Behavior Manager | Patrol behavior not available (optional)');
    }

    // Load flee behavior
    try {
      const { FleeBehavior } = await import('./behaviors/flee-behavior.mjs');
      this.registerBehavior(new FleeBehavior());
    } catch (error) {
      console.log('Behavior Manager | Flee behavior not available (optional)');
    }

    // Load guard behavior
    try {
      const { GuardBehavior } = await import('./behaviors/guard-behavior.mjs');
      this.registerBehavior(new GuardBehavior());
    } catch (error) {
      console.log('Behavior Manager | Guard behavior not available (optional)');
    }
  }

  /**
   * Load custom behaviors from journal entries
   */
  async loadCustomBehaviors() {
    console.log('Behavior Manager | Loading custom behaviors from journals...');

    for (const journal of game.journal) {
      const isBehavior = journal.getFlag(MODULE_ID, 'isBehavior');
      if (isBehavior) {
        try {
          const behavior = await this.createBehaviorFromJournal(journal);
          this.registerBehavior(behavior);
        } catch (error) {
          console.error(`Behavior Manager | Failed to load behavior from ${journal.name}:`, error);
        }
      }
    }
  }

  /**
   * Create behavior from journal entry
   */
  async createBehaviorFromJournal(journal) {
    const { Behavior } = await import('./behaviors/behavior.mjs');

    const behaviorId = journal.getFlag(MODULE_ID, 'behaviorId');
    const behaviorType = journal.getFlag(MODULE_ID, 'behaviorType') || 'general';
    const priority = journal.getFlag(MODULE_ID, 'priority') || 100;

    return new Behavior(behaviorId, journal.name, {
      description: journal.getFlag(MODULE_ID, 'description') || '',
      type: behaviorType,
      priority: priority
    });
  }

  /**
   * Load actor behavior assignments
   */
  async loadActorBehaviors() {
    console.log('Behavior Manager | Loading actor behavior assignments...');

    for (const actor of game.actors) {
      const behaviorIds = actor.getFlag(MODULE_ID, 'behaviors') || [];

      for (const behaviorId of behaviorIds) {
        const behavior = this.behaviors.get(behaviorId);
        if (behavior) {
          await this.assignBehaviorToActor(behavior, actor);
        }
      }
    }
  }

  /**
   * Register a behavior
   */
  registerBehavior(behavior) {
    if (this.behaviors.has(behavior.id)) {
      console.warn(`Behavior Manager | Behavior '${behavior.id}' already registered`);
      return false;
    }

    this.behaviors.set(behavior.id, behavior);
    console.log(`Behavior Manager | Registered behavior: ${behavior.name}`);
    return true;
  }

  /**
   * Unregister a behavior
   */
  async unregisterBehavior(behaviorId) {
    const behavior = this.behaviors.get(behaviorId);
    if (!behavior) return false;

    // Remove from all actors
    for (const actor of game.actors) {
      await this.removeBehaviorFromActor(behavior, actor);
    }

    // Cleanup and remove
    await behavior.cleanup();
    this.behaviors.delete(behaviorId);

    console.log(`Behavior Manager | Unregistered behavior: ${behavior.name}`);
    return true;
  }

  /**
   * Get behavior by ID
   */
  getBehavior(behaviorId) {
    return this.behaviors.get(behaviorId);
  }

  /**
   * Get all behaviors
   */
  getAllBehaviors() {
    return Array.from(this.behaviors.values());
  }

  /**
   * Get behaviors by type
   */
  getBehaviorsByType(type) {
    return this.getAllBehaviors().filter(b => b.type === type);
  }

  /**
   * Assign behavior to actor
   */
  async assignBehaviorToActor(behavior, actor) {
    if (!this.actorBehaviors.has(actor.id)) {
      this.actorBehaviors.set(actor.id, new Set());
    }

    const actorBehaviors = this.actorBehaviors.get(actor.id);
    if (actorBehaviors.has(behavior.id)) {
      console.warn(`Behavior Manager | Behavior '${behavior.id}' already assigned to ${actor.name}`);
      return false;
    }

    actorBehaviors.add(behavior.id);
    await behavior.onAssign(actor);

    // Save to actor flags
    const behaviorIds = Array.from(actorBehaviors);
    await actor.setFlag(MODULE_ID, 'behaviors', behaviorIds);

    console.log(`Behavior Manager | Assigned '${behavior.name}' to ${actor.name}`);
    return true;
  }

  /**
   * Remove behavior from actor
   */
  async removeBehaviorFromActor(behavior, actor) {
    const actorBehaviors = this.actorBehaviors.get(actor.id);
    if (!actorBehaviors || !actorBehaviors.has(behavior.id)) {
      return false;
    }

    actorBehaviors.delete(behavior.id);
    await behavior.onRemove(actor);

    // Save to actor flags
    const behaviorIds = Array.from(actorBehaviors);
    await actor.setFlag(MODULE_ID, 'behaviors', behaviorIds);

    console.log(`Behavior Manager | Removed '${behavior.name}' from ${actor.name}`);
    return true;
  }

  /**
   * Get actor's behaviors
   */
  getActorBehaviors(actor) {
    const behaviorIds = this.actorBehaviors.get(actor.id) || new Set();
    return Array.from(behaviorIds)
      .map(id => this.behaviors.get(id))
      .filter(b => b !== undefined);
  }

  /**
   * Start update loop
   */
  startUpdateLoop() {
    if (this.updateTimer) return;

    this.updateTimer = setInterval(() => {
      this.updateAllBehaviors();
    }, this.updateInterval);

    console.log('Behavior Manager | Update loop started');
  }

  /**
   * Stop update loop
   */
  stopUpdateLoop() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
      console.log('Behavior Manager | Update loop stopped');
    }
  }

  /**
   * Update all behaviors for all actors
   */
  async updateAllBehaviors() {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdate) / 1000; // Convert to seconds
    this.lastUpdate = now;

    for (const actor of game.actors) {
      const behaviors = this.getActorBehaviors(actor);

      // Sort by priority (highest first)
      behaviors.sort((a, b) => b.getPriority(actor) - a.getPriority(actor));

      for (const behavior of behaviors) {
        if (behavior.canExecute(actor)) {
          try {
            await behavior.update(actor, deltaTime);
          } catch (error) {
            console.error(`Behavior Manager | Error updating ${behavior.name} for ${actor.name}:`, error);
          }
        }
      }
    }
  }

  /**
   * Execute specific behavior for actor
   */
  async executeBehavior(behaviorId, actor) {
    const behavior = this.behaviors.get(behaviorId);
    if (!behavior) {
      console.warn(`Behavior Manager | Behavior '${behaviorId}' not found`);
      return false;
    }

    if (!behavior.canExecute(actor)) {
      console.warn(`Behavior Manager | Behavior '${behaviorId}' cannot execute for ${actor.name}`);
      return false;
    }

    try {
      await behavior.execute(actor);
      return true;
    } catch (error) {
      console.error(`Behavior Manager | Error executing ${behavior.name} for ${actor.name}:`, error);
      return false;
    }
  }

  /**
   * Export all behaviors
   */
  exportAllBehaviors() {
    const exported = {};
    for (const [id, behavior] of this.behaviors) {
      exported[id] = behavior.export();
    }
    return exported;
  }

  /**
   * Import behavior data
   */
  async importBehaviorData(behaviorId, data) {
    const behavior = this.behaviors.get(behaviorId);
    if (!behavior) {
      console.warn(`Behavior Manager | Behavior '${behaviorId}' not found`);
      return false;
    }

    // Update behavior properties
    Object.assign(behavior, data);
    return true;
  }

  /**
   * Cleanup
   */
  async cleanup() {
    console.log('Behavior Manager | Cleaning up...');

    this.stopUpdateLoop();

    for (const behavior of this.behaviors.values()) {
      await behavior.cleanup();
    }

    this.behaviors.clear();
    this.actorBehaviors.clear();
  }
}

// Global registration function for external modules
export function registerBehavior(behavior) {
  if (game.foundryBehaviors?.manager) {
    return game.foundryBehaviors.manager.registerBehavior(behavior);
  }
  console.warn('Behavior Manager not initialized');
  return false;
}
