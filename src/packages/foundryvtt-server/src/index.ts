/**
 * Public API exports for @crit-fumble/foundryvtt-server
 *
 * This package can be used in two ways:
 * 1. As a standalone server: `node dist/server.js`
 * 2. As a library: `import { InstanceManager } from '@crit-fumble/foundryvtt-server'`
 */

// Export types
export type * from './types.js';

// Export managers
export { DockerManager } from './managers/docker-manager.js';
export { InstanceManager } from './managers/instance-manager.js';

// Export API utilities
export { authenticate, auditLog } from './api/auth.js';
export {
  PORT_OFFSET,
  CONTAINER_OFFSET,
  MAX_CONTAINERS,
  validateContainerEnvironment,
  getContainerName,
  getPort,
  getEnvironmentFromContainer,
  getSlotFromContainer
} from './api/environment.js';
export { createRouter } from './api/routes.js';
