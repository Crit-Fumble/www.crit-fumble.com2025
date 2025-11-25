/**
 * Behavior System
 *
 * AI-driven creature behavior system for Foundry VTT.
 * Extends BaseSystem to integrate with Core Concepts.
 */

import { BehaviorManager } from './behaviors/behavior-manager.mjs';

export class BehaviorSystem {
  constructor() {
    this.id = 'cfg-behaviors';
    this.name = 'Creature Behaviors';
    this.description = 'AI-driven creature behavior system with autonomous NPC actions';
    this.version = '1.0.0';
    this.author = 'Crit-Fumble';
    this.enabled = true;

    // Behavior Manager instance
    this.manager = new BehaviorManager();
  }

  /**
   * Start the behavior system
   */
  async start() {
    console.log('Behavior System | Starting...');

    // Initialize the behavior manager
    await this.manager.initialize();

    console.log('Behavior System | Started');
  }

  /**
   * Stop the behavior system
   */
  async stop() {
    console.log('Behavior System | Stopping...');

    // Stop the behavior manager
    this.manager.stopUpdateLoop();

    console.log('Behavior System | Stopped');
  }

  /**
   * Update behavior system
   */
  async update(deltaTime) {
    // The behavior manager has its own update loop
    // This method is called by Systems Manager but we delegate to the manager's loop
  }

  /**
   * Get system state
   */
  getState() {
    return {
      behaviorCount: this.manager.behaviors.size,
      actorCount: this.manager.actorBehaviors.size
    };
  }

  /**
   * Set system state
   */
  setState(state) {
    // State is managed by BehaviorManager
  }

  /**
   * Save state
   */
  async saveState() {
    // State is saved via actor flags by BehaviorManager
  }

  /**
   * Load state
   */
  async loadState() {
    // State is loaded from actor flags by BehaviorManager
  }

  /**
   * Get system configuration
   */
  getConfig() {
    return {
      updateInterval: this.manager.updateInterval
    };
  }

  /**
   * Set system configuration
   */
  setConfig(config) {
    if (config.updateInterval !== undefined) {
      this.manager.updateInterval = config.updateInterval;
      this.manager.stopUpdateLoop();
      this.manager.startUpdateLoop();
    }
  }

  /**
   * Register settings
   */
  registerSettings() {
    // Settings are registered by the cfg-5e module
  }

  /**
   * Get system metadata
   */
  getMetadata() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      version: this.version,
      author: this.author,
      enabled: this.enabled,
      state: this.getState()
    };
  }

  /**
   * Validate system
   */
  validate() {
    return this.manager !== null;
  }

  /**
   * Get dependencies
   */
  getDependencies() {
    return ['foundry-core-concepts', 'foundry-core-srd-5e'];
  }

  /**
   * Export system data
   */
  exportData() {
    return this.manager.exportAllBehaviors();
  }

  /**
   * Import system data
   */
  async importData(data) {
    for (const [behaviorId, behaviorData] of Object.entries(data)) {
      await this.manager.importBehaviorData(behaviorId, behaviorData);
    }
  }

  /**
   * Cleanup system
   */
  async cleanup() {
    console.log('Behavior System | Cleaning up...');

    await this.manager.cleanup();

    console.log('Behavior System | Cleanup complete');
  }
}
