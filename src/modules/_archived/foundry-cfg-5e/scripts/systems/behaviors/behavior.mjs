/**
 * Base Behavior Class
 *
 * Abstract base class for creature behaviors.
 * Behaviors define how NPCs/monsters act autonomously.
 */

const MODULE_ID = 'foundry-behaviors';

export class Behavior {
  constructor(id, name, options = {}) {
    this.id = id;
    this.name = name;
    this.description = options.description || '';
    this.type = options.type || 'general'; // general, combat, social, utility
    this.priority = options.priority || 100; // Higher = more important
    this.enabled = options.enabled !== false;

    // Behavior configuration
    this.options = options;

    // Per-actor state storage
    this.actorStates = new Map();
  }

  /**
   * Called when behavior is assigned to an actor
   */
  async onAssign(actor) {
    console.log(`Behavior [${this.name}] | Assigned to ${actor.name}`);

    // Initialize state for this actor
    this.actorStates.set(actor.id, this.getInitialState(actor));
  }

  /**
   * Called when behavior is removed from an actor
   */
  async onRemove(actor) {
    console.log(`Behavior [${this.name}] | Removed from ${actor.name}`);

    // Clean up state
    this.actorStates.delete(actor.id);
  }

  /**
   * Get initial state for an actor
   * Override in child classes
   */
  getInitialState(actor) {
    return {
      active: false,
      startTime: Date.now()
    };
  }

  /**
   * Check if behavior can execute
   * Override in child classes
   */
  canExecute(actor) {
    return this.enabled;
  }

  /**
   * Get behavior priority for this actor
   * Higher priority behaviors execute first
   * Override in child classes to make dynamic
   */
  getPriority(actor) {
    return this.priority;
  }

  /**
   * Update behavior for an actor
   * Called periodically by BehaviorManager
   * Override in child classes
   */
  async update(actor, deltaTime) {
    // Base implementation does nothing
    // Child classes should implement their logic here
  }

  /**
   * Execute behavior action
   * Override in child classes
   */
  async execute(actor) {
    console.log(`Behavior [${this.name}] | Executing for ${actor.name}`);
  }

  /**
   * Get actor's behavior state
   */
  getState(actor) {
    return this.actorStates.get(actor.id) || {};
  }

  /**
   * Set actor's behavior state
   */
  setState(actor, state) {
    const currentState = this.getState(actor);
    this.actorStates.set(actor.id, { ...currentState, ...state });
  }

  /**
   * Reset actor's behavior state
   */
  resetState(actor) {
    this.actorStates.set(actor.id, this.getInitialState(actor));
  }

  /**
   * Get behavior metadata
   */
  getMetadata() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      priority: this.priority,
      enabled: this.enabled
    };
  }

  /**
   * Validate behavior can run
   */
  validate() {
    return true;
  }

  /**
   * Export behavior configuration
   */
  export() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      priority: this.priority,
      options: this.options
    };
  }

  /**
   * Cleanup behavior resources
   */
  async cleanup() {
    this.actorStates.clear();
  }
}
