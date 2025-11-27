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
    staging: 30000,    // Port: 30000 (1 instance)
    production: 30100  // Ports: 30100, 30101 (2 instances)
  };

  // Container offset configuration
  private static readonly CONTAINER_OFFSET = {
    staging: 0,    // Container: foundry-1 (1 instance)
    production: 1  // Containers: foundry-2, foundry-3 (2 instances)
  };

  // Maximum concurrent instances per environment
  private static readonly MAX_INSTANCES = {
    staging: 1,
    production: 2
  };

  constructor() {
    this.dockerManager = new DockerManager();
  }

  /**
   * Calculate container configuration for a given environment and slot
   */
  getContainerConfig(environment: FoundryEnvironment, slot: number): ContainerConfig {
    const maxSlot = InstanceManager.MAX_INSTANCES[environment] - 1;
    if (slot < 0 || slot > maxSlot) {
      throw new Error(`Slot must be between 0 and ${maxSlot} for ${environment} environment`);
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
   * Check if a license key is currently in use by any running container
   */
  async isLicenseInUse(licenseKey: string, environment: FoundryEnvironment): Promise<boolean> {
    try {
      // Get all running containers for this environment
      const running = await this.getInstanceStatus(environment);

      // Check each running container for the license key
      for (const container of running) {
        if (container.status === 'running') {
          try {
            // Inspect the container to check environment variables
            const info = await this.dockerManager.getContainerInfo(container.name);
            const env = info?.Config?.Env || [];

            // Check if this container is using the license key
            const hasLicense = env.some((e: string) =>
              e.startsWith('FOUNDRY_LICENSE_KEY=') && e === `FOUNDRY_LICENSE_KEY=${licenseKey}`
            );

            if (hasLicense) {
              return true;
            }
          } catch (error) {
            // If we can't inspect a container, skip it
            console.error(`Failed to inspect container ${container.name}:`, error);
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Failed to check license usage:', error);
      throw error;
    }
  }

  /**
   * Start a Foundry instance
   */
  async startInstance(worldId: string, ownerId: string, environment: FoundryEnvironment, slot: number, licenseKey: string): Promise<ContainerConfig> {
    const config = this.getContainerConfig(environment, slot);

    console.log(`[${environment.toUpperCase()}] Starting Foundry instance ${config.containerName} for world ${worldId}`);

    try {
      await this.dockerManager.startContainer(config.containerName, licenseKey, config.port);
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
    const containers = await this.dockerManager.listContainers('foundry-');

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
    const maxContainer = InstanceManager.CONTAINER_OFFSET[environment] + InstanceManager.MAX_INSTANCES[environment];

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
