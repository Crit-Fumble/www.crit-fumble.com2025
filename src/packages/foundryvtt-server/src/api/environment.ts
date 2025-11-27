/**
 * Environment Isolation Utilities
 * Handles environment-specific configuration and validation
 */

import type { FoundryEnvironment } from '../types.js';

/**
 * Port offset configuration
 * Staging: 30000-30002
 * Production: 30100-30102
 */
export const PORT_OFFSET: Record<FoundryEnvironment, number> = {
  staging: 30000,
  production: 30100
};

/**
 * Container offset configuration
 * Staging: containers 1-3 (foundry-1, foundry-2, foundry-3)
 * Production: containers 4-6 (foundry-4, foundry-5, foundry-6)
 */
export const CONTAINER_OFFSET: Record<FoundryEnvironment, number> = {
  staging: 0,
  production: 3
};

/**
 * Maximum number of containers per environment
 */
export const MAX_CONTAINERS = 3;

/**
 * Validate that a container belongs to the specified environment
 * @throws Error if container doesn't belong to environment
 */
export function validateContainerEnvironment(
  containerName: string,
  environment: FoundryEnvironment
): void {
  // Extract container number from name (e.g., "foundry-1" → 1)
  const match = containerName.match(/^foundry-(\d+)$/);
  if (!match) {
    throw new Error(`Invalid container name format: ${containerName}. Expected format: foundry-N`);
  }

  const containerNum = parseInt(match[1], 10);
  const minContainer = CONTAINER_OFFSET[environment] + 1;
  const maxContainer = CONTAINER_OFFSET[environment] + MAX_CONTAINERS;

  if (containerNum < minContainer || containerNum > maxContainer) {
    throw new Error(
      `Container ${containerName} does not belong to ${environment} environment. ` +
      `Expected containers ${minContainer}-${maxContainer}`
    );
  }
}

/**
 * Get container name for environment and slot
 */
export function getContainerName(environment: FoundryEnvironment, slot: number): string {
  if (slot < 0 || slot >= MAX_CONTAINERS) {
    throw new Error(`Invalid slot ${slot}. Must be between 0 and ${MAX_CONTAINERS - 1}`);
  }

  const containerNum = CONTAINER_OFFSET[environment] + slot + 1;
  return `foundry-${containerNum}`;
}

/**
 * Get port for environment and slot
 */
export function getPort(environment: FoundryEnvironment, slot: number): number {
  if (slot < 0 || slot >= MAX_CONTAINERS) {
    throw new Error(`Invalid slot ${slot}. Must be between 0 and ${MAX_CONTAINERS - 1}`);
  }

  return PORT_OFFSET[environment] + slot;
}

/**
 * Get environment from container name
 */
export function getEnvironmentFromContainer(containerName: string): FoundryEnvironment {
  const match = containerName.match(/^foundry-(\d+)$/);
  if (!match) {
    throw new Error(`Invalid container name format: ${containerName}`);
  }

  const containerNum = parseInt(match[1], 10);

  // Containers 1-3 are staging, 4-6 are production
  if (containerNum >= 1 && containerNum <= 3) {
    return 'staging';
  } else if (containerNum >= 4 && containerNum <= 6) {
    return 'production';
  } else {
    throw new Error(`Container number ${containerNum} out of range`);
  }
}

/**
 * Get slot from container name
 */
export function getSlotFromContainer(containerName: string, environment: FoundryEnvironment): number {
  const match = containerName.match(/^foundry-(\d+)$/);
  if (!match) {
    throw new Error(`Invalid container name format: ${containerName}`);
  }

  const containerNum = parseInt(match[1], 10);
  const offset = CONTAINER_OFFSET[environment];

  return containerNum - offset - 1;
}
