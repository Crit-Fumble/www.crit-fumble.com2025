/**
 * Instance Manager
 * Manages Foundry VTT instance lifecycle
 */

import { DockerManager } from './docker-manager.js';
import type { FoundryEnvironment, ContainerConfig } from '../types.js';

export class InstanceManager {
  private dockerManager: DockerManager;

  // Port offset configuration
  private static readonly PORT_OFFSET = {
    staging: 30000,    // Ports: 30000, 30001, 30002
    production: 30100  // Ports: 30100, 30101, 30102
  };

  // Container offset configuration
  private static readonly CONTAINER_OFFSET = {
    staging: 0,    // Containers: foundry-staging-1, foundry-staging-2, foundry-staging-3
    production: 3  // Containers: foundry-prod-1, foundry-prod-2, foundry-prod-3
  };

  constructor() {
    this.dockerManager = new DockerManager();
  }

  /**
   * Calculate container configuration for a given environment and slot
   */
  getContainerConfig(environment: FoundryEnvironment, slot: number): ContainerConfig {
    if (slot < 0 || slot > 2) {
      throw new Error('Slot must be between 0 and 2');
    }

    const containerNum = InstanceManager.CONTAINER_OFFSET[environment] + slot + 1;
    const containerName = `foundry-${containerNum}`;
    const port = InstanceManager.PORT_OFFSET[environment] + slot;

    return {
      environment,
      slot,
      containerName,
      port
    };
  }

  /**
   * Start a Foundry instance
   */
  async startInstance(worldId: string, ownerId: string, environment: FoundryEnvironment, slot: number, licenseKey: string): Promise<ContainerConfig> {
    const config = this.getContainerConfig(environment, slot);

    console.log(`[${environment.toUpperCase()}] Starting Foundry instance ${config.containerName} for world ${worldId}`);

    try {
      await this.dockerManager.startContainer(config.containerName, licenseKey);
      return config;
    } catch (error) {
      console.error(`Failed to start instance ${config.containerName}:`, error);
      throw error;
    }
  }

  /**
   * Stop a Foundry instance
   */
  async stopInstance(containerName: string, environment: FoundryEnvironment): Promise<void> {
    // Validate container belongs to this environment
    this.validateContainerEnvironment(containerName, environment);

    console.log(`[${environment.toUpperCase()}] Stopping Foundry instance ${containerName}`);

    try {
      await this.dockerManager.stopContainer(containerName);
    } catch (error) {
      console.error(`Failed to stop instance ${containerName}:`, error);
      throw error;
    }
  }

  /**
   * Get status of all instances for an environment
   */
  async getInstanceStatus(environment: FoundryEnvironment) {
    const pattern = environment === 'staging' ? 'foundry-staging' : 'foundry-prod';
    const containers = await this.dockerManager.listContainers(pattern);

    // Filter to only containers that belong to this environment
    const filtered = containers.filter(container => {
      try {
        this.validateContainerEnvironment(container.name, environment);
        return true;
      } catch {
        return false;
      }
    });

    return filtered;
  }

  /**
   * Validate that a container belongs to the specified environment
   */
  private validateContainerEnvironment(containerName: string, environment: FoundryEnvironment): void {
    // Extract container number from name (e.g., "foundry-1" → 1)
    const match = containerName.match(/^foundry-(\d+)$/);
    if (!match) {
      throw new Error(`Invalid container name format: ${containerName}`);
    }

    const containerNum = parseInt(match[1], 10);
    const minContainer = InstanceManager.CONTAINER_OFFSET[environment] + 1;
    const maxContainer = InstanceManager.CONTAINER_OFFSET[environment] + 3;

    if (containerNum < minContainer || containerNum > maxContainer) {
      throw new Error(
        `Container ${containerName} does not belong to ${environment} environment ` +
        `(expected containers ${minContainer}-${maxContainer})`
      );
    }
  }

  /**
   * Find an available slot in the specified environment
   */
  async findAvailableSlot(environment: FoundryEnvironment): Promise<number | null> {
    const runningInstances = await this.getInstanceStatus(environment);

    // Check each slot (0, 1, 2)
    for (let slot = 0; slot < 3; slot++) {
      const config = this.getContainerConfig(environment, slot);
      const isRunning = runningInstances.some(
        instance => instance.name === config.containerName && instance.status === 'running'
      );

      if (!isRunning) {
        return slot;
      }
    }

    return null; // All slots occupied
  }

  /**
   * Get logs for a specific instance
   */
  async getInstanceLogs(containerName: string, environment: FoundryEnvironment, tail: number = 100): Promise<string> {
    // Validate container belongs to this environment
    this.validateContainerEnvironment(containerName, environment);

    return await this.dockerManager.getContainerLogs(containerName, tail);
  }

  /**
   * Restart an instance
   */
  async restartInstance(containerName: string, environment: FoundryEnvironment): Promise<void> {
    // Validate container belongs to this environment
    this.validateContainerEnvironment(containerName, environment);

    console.log(`[${environment.toUpperCase()}] Restarting Foundry instance ${containerName}`);

    try {
      await this.dockerManager.restartContainer(containerName);
    } catch (error) {
      console.error(`Failed to restart instance ${containerName}:`, error);
      throw error;
    }
  }
}
