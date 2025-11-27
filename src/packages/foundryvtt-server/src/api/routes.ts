/**
 * Express Route Definitions
 * Defines all HTTP endpoints for the management API
 */

import express, { type Router, type Request, type Response } from 'express';
import { InstanceManager } from '../managers/instance-manager.js';
import { validateContainerEnvironment } from './environment.js';
import type {
  StartContainerRequest,
  StartContainerResponse,
  StopContainerRequest,
  StopContainerResponse,
  StatusResponse,
  HealthResponse,
  ErrorResponse
} from '../types.js';

const instanceManager = new InstanceManager();

/**
 * Create and configure Express router with all API routes
 */
export function createRouter(): Router {
  const router = express.Router();

  /**
   * POST /api/instances/start
   * Start a Foundry VTT container
   */
  router.post('/api/instances/start', async (req: Request, res: Response) => {
    const environment = req.environment;
    if (!environment) {
      return res.status(500).json({ error: 'Environment not set' } as ErrorResponse);
    }

    try {
      const { worldId, ownerId, slot, licenseKey } = req.body as StartContainerRequest;

      // Validate required fields
      if (!worldId || !ownerId || slot === undefined || !licenseKey) {
        return res.status(400).json({
          error: 'Missing required fields: worldId, ownerId, slot, licenseKey'
        } as ErrorResponse);
      }

      // Validate slot range
      if (slot < 0 || slot > 2) {
        return res.status(400).json({
          error: 'Slot must be between 0 and 2'
        } as ErrorResponse);
      }

      console.log(`[${environment.toUpperCase()}] Starting container for world ${worldId}, slot ${slot}`);

      const config = await instanceManager.startInstance(worldId, ownerId, environment, slot, licenseKey);

      const response: StartContainerResponse = {
        success: true,
        containerName: config.containerName,
        environment: config.environment,
        port: config.port
      };

      res.json(response);
    } catch (error) {
      console.error(`[${environment.toUpperCase()}] Failed to start container:`, error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error
      } as ErrorResponse);
    }
  });

  /**
   * POST /api/instances/stop
   * Stop a Foundry VTT container
   */
  router.post('/api/instances/stop', async (req: Request, res: Response) => {
    const environment = req.environment;
    if (!environment) {
      return res.status(500).json({ error: 'Environment not set' } as ErrorResponse);
    }

    try {
      const { containerName } = req.body as StopContainerRequest;

      if (!containerName) {
        return res.status(400).json({
          error: 'Missing required field: containerName'
        } as ErrorResponse);
      }

      // Validate container belongs to this environment
      try {
        validateContainerEnvironment(containerName, environment);
      } catch (error) {
        return res.status(403).json({
          error: error instanceof Error ? error.message : 'Container access denied'
        } as ErrorResponse);
      }

      console.log(`[${environment.toUpperCase()}] Stopping container ${containerName}`);

      await instanceManager.stopInstance(containerName, environment);

      const response: StopContainerResponse = {
        success: true,
        environment
      };

      res.json(response);
    } catch (error) {
      console.error(`[${environment.toUpperCase()}] Failed to stop container:`, error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error
      } as ErrorResponse);
    }
  });

  /**
   * POST /api/instances/status
   * Get status of all containers for the authenticated environment
   */
  router.post('/api/instances/status', async (req: Request, res: Response) => {
    const environment = req.environment;
    if (!environment) {
      return res.status(500).json({ error: 'Environment not set' } as ErrorResponse);
    }

    try {
      console.log(`[${environment.toUpperCase()}] Getting container status`);

      const running = await instanceManager.getInstanceStatus(environment);

      const response: StatusResponse = {
        running,
        environment
      };

      res.json(response);
    } catch (error) {
      console.error(`[${environment.toUpperCase()}] Failed to get status:`, error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error
      } as ErrorResponse);
    }
  });

  /**
   * POST /api/instances/restart
   * Restart a Foundry VTT container
   */
  router.post('/api/instances/restart', async (req: Request, res: Response) => {
    const environment = req.environment;
    if (!environment) {
      return res.status(500).json({ error: 'Environment not set' } as ErrorResponse);
    }

    try {
      const { containerName } = req.body;

      if (!containerName) {
        return res.status(400).json({
          error: 'Missing required field: containerName'
        } as ErrorResponse);
      }

      // Validate container belongs to this environment
      try {
        validateContainerEnvironment(containerName, environment);
      } catch (error) {
        return res.status(403).json({
          error: error instanceof Error ? error.message : 'Container access denied'
        } as ErrorResponse);
      }

      console.log(`[${environment.toUpperCase()}] Restarting container ${containerName}`);

      await instanceManager.restartInstance(containerName, environment);

      res.json({ success: true, environment });
    } catch (error) {
      console.error(`[${environment.toUpperCase()}] Failed to restart container:`, error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error
      } as ErrorResponse);
    }
  });

  /**
   * GET /api/instances/logs/:containerName
   * Get logs for a specific container
   */
  router.get('/api/instances/logs/:containerName', async (req: Request, res: Response) => {
    const environment = req.environment;
    if (!environment) {
      return res.status(500).json({ error: 'Environment not set' } as ErrorResponse);
    }

    try {
      const { containerName } = req.params;
      const tail = parseInt(req.query.tail as string) || 100;

      // Validate container belongs to this environment
      try {
        validateContainerEnvironment(containerName, environment);
      } catch (error) {
        return res.status(403).json({
          error: error instanceof Error ? error.message : 'Container access denied'
        } as ErrorResponse);
      }

      const logs = await instanceManager.getInstanceLogs(containerName, environment, tail);

      res.json({ logs, environment });
    } catch (error) {
      console.error(`[${environment?.toUpperCase()}] Failed to get logs:`, error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error
      } as ErrorResponse);
    }
  });

  /**
   * GET /health
   * Health check endpoint (no authentication required)
   */
  router.get('/health', (req: Request, res: Response) => {
    const response: HealthResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0'
    };

    res.json(response);
  });

  return router;
}
