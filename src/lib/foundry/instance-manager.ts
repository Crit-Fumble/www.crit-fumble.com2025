/**
 * Foundry VTT Instance Manager
 * Manages Foundry VTT process lifecycle and API communication
 */

import { spawn, ChildProcess } from 'child_process';
import axios, { AxiosInstance } from 'axios';
import path from 'path';

export interface FoundryInstanceConfig {
  worldId: string;
  port?: number;
  apiPort?: number;
  apiToken?: string;
  dataPath?: string;
  adminPassword?: string;
  licenseKey?: string;
  hostname?: string;
  routePrefix?: string;
}

export interface FoundryInstanceInfo {
  worldId: string;
  port: number;
  apiPort: number;
  pid: number;
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  startedAt: Date;
  url: string;
  apiUrl: string;
}

/**
 * Single Foundry VTT Instance
 */
export class FoundryInstance {
  private config: Required<FoundryInstanceConfig>;
  private process: ChildProcess | null = null;
  private api: AxiosInstance | null = null;
  private status: FoundryInstanceInfo['status'] = 'stopped';
  private startedAt: Date | null = null;

  constructor(config: FoundryInstanceConfig) {
    // Set defaults
    this.config = {
      worldId: config.worldId,
      port: config.port || 30000,
      apiPort: config.apiPort || 3001,
      apiToken: config.apiToken || process.env.FOUNDRY_API_TOKEN || 'changeme',
      dataPath: config.dataPath || process.env.FOUNDRY_DATA_PATH || '/foundry/data',
      adminPassword: config.adminPassword || process.env.FOUNDRY_ADMIN_PASSWORD || '',
      licenseKey: config.licenseKey || process.env.FOUNDRY_LICENSE_KEY || '',
      hostname: config.hostname || 'localhost',
      routePrefix: config.routePrefix || ''
    };
  }

  /**
   * Start the Foundry instance
   */
  async start(): Promise<FoundryInstanceInfo> {
    if (this.process) {
      throw new Error('Instance already running');
    }

    this.status = 'starting';
    this.startedAt = new Date();

    console.log(`[Foundry] Starting instance for world: ${this.config.worldId}`);

    // Path to Foundry executable
    const foundryPath = process.env.FOUNDRY_PATH || path.join(process.cwd(), 'src/platforms/foundryvtt');
    const foundryMain = path.join(foundryPath, 'main.mjs');

    // Foundry command line options
    const args = [
      foundryMain,
      `--world=${this.config.worldId}`,
      `--port=${this.config.port}`,
      `--dataPath=${this.config.dataPath}`,
      `--hostname=${this.config.hostname}`,
    ];

    if (this.config.routePrefix) {
      args.push(`--routePrefix=${this.config.routePrefix}`);
    }

    if (this.config.adminPassword) {
      args.push(`--adminPassword=${this.config.adminPassword}`);
    }

    // Environment variables
    // TODO: accept these from either our license pool, or a user-provided license key; these are not defined in the .env
    const env = {
      ...process.env,
      FOUNDRY_LICENSE_KEY: this.config.licenseKey,
      FOUNDRY_API_PORT: this.config.apiPort.toString(),
      FOUNDRY_API_TOKEN: this.config.apiToken,
      DATABASE_URL: process.env.DATABASE_URL || '',
      WORLD_ID: this.config.worldId
    };

    // Spawn Foundry process
    this.process = spawn('node', args, {
      env,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    // Handle stdout
    this.process.stdout?.on('data', (data) => {
      console.log(`[Foundry:${this.config.worldId}]`, data.toString().trim());
    });

    // Handle stderr
    this.process.stderr?.on('data', (data) => {
      console.error(`[Foundry:${this.config.worldId}]`, data.toString().trim());
    });

    // Handle process exit
    this.process.on('exit', (code, signal) => {
      console.log(`[Foundry] Process exited. Code: ${code}, Signal: ${signal}`);
      this.status = 'stopped';
      this.process = null;
    });

    // Handle process errors
    this.process.on('error', (error) => {
      console.error(`[Foundry] Process error:`, error);
      this.status = 'error';
    });

    // Wait for Foundry to be ready
    await this.waitForReady();

    this.status = 'running';
    console.log(`[Foundry] Instance ready: ${this.getInfo().url}`);

    return this.getInfo();
  }

  /**
   * Stop the Foundry instance
   */
  async stop(): Promise<void> {
    if (!this.process) {
      return;
    }

    this.status = 'stopping';
    console.log(`[Foundry] Stopping instance for world: ${this.config.worldId}`);

    return new Promise((resolve) => {
      this.process!.on('exit', () => {
        this.process = null;
        this.status = 'stopped';
        resolve();
      });

      // Send SIGTERM
      this.process!.kill('SIGTERM');

      // Force kill after 10 seconds
      setTimeout(() => {
        if (this.process) {
          console.warn('[Foundry] Force killing instance');
          this.process.kill('SIGKILL');
        }
      }, 10000);
    });
  }

  /**
   * Restart the instance
   */
  async restart(): Promise<FoundryInstanceInfo> {
    await this.stop();
    return await this.start();
  }

  /**
   * Wait for Foundry to be ready
   */
  private async waitForReady(timeout: number = 60000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        // Try to connect to API
        const response = await axios.get(`http://localhost:${this.config.apiPort}/health`, {
          timeout: 1000
        });

        if (response.data.status === 'ok') {
          // Initialize API client
          this.api = axios.create({
            baseURL: `http://localhost:${this.config.apiPort}`,
            headers: {
              'Authorization': `Bearer ${this.config.apiToken}`
            },
            timeout: 10000
          });

          return;
        }
      } catch (error) {
        // Not ready yet, wait and retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    throw new Error('Foundry instance failed to start within timeout');
  }

  /**
   * Get instance information
   */
  getInfo(): FoundryInstanceInfo {
    return {
      worldId: this.config.worldId,
      port: this.config.port,
      apiPort: this.config.apiPort,
      pid: this.process?.pid || 0,
      status: this.status,
      startedAt: this.startedAt || new Date(),
      url: `http://${this.config.hostname}:${this.config.port}`,
      apiUrl: `http://localhost:${this.config.apiPort}`
    };
  }

  /**
   * Get API client
   */
  getAPI(): AxiosInstance {
    if (!this.api) {
      throw new Error('Instance not started or API not ready');
    }
    return this.api;
  }

  /**
   * Check if instance is running
   */
  isRunning(): boolean {
    return this.status === 'running' && this.process !== null;
  }
}

/**
 * Foundry Instance Manager
 * Manages multiple Foundry instances
 */
export class FoundryInstanceManager {
  private instances: Map<string, FoundryInstance> = new Map();

  /**
   * Start a Foundry instance for a world
   */
  async startInstance(config: FoundryInstanceConfig): Promise<FoundryInstanceInfo> {
    const existingInstance = this.instances.get(config.worldId);

    if (existingInstance?.isRunning()) {
      console.log(`[Manager] Instance already running for world: ${config.worldId}`);
      return existingInstance.getInfo();
    }

    console.log(`[Manager] Starting new instance for world: ${config.worldId}`);

    const instance = new FoundryInstance(config);
    this.instances.set(config.worldId, instance);

    const info = await instance.start();

    return info;
  }

  /**
   * Stop a Foundry instance
   */
  async stopInstance(worldId: string): Promise<void> {
    const instance = this.instances.get(worldId);

    if (!instance) {
      throw new Error(`No instance found for world: ${worldId}`);
    }

    await instance.stop();
    this.instances.delete(worldId);
  }

  /**
   * Restart an instance
   */
  async restartInstance(worldId: string): Promise<FoundryInstanceInfo> {
    const instance = this.instances.get(worldId);

    if (!instance) {
      throw new Error(`No instance found for world: ${worldId}`);
    }

    return await instance.restart();
  }

  /**
   * Get instance
   */
  getInstance(worldId: string): FoundryInstance | null {
    return this.instances.get(worldId) || null;
  }

  /**
   * Get all instances
   */
  getAllInstances(): FoundryInstanceInfo[] {
    return Array.from(this.instances.values()).map(i => i.getInfo());
  }

  /**
   * Stop all instances
   */
  async stopAll(): Promise<void> {
    console.log('[Manager] Stopping all instances...');

    const promises = Array.from(this.instances.values()).map(i => i.stop());
    await Promise.all(promises);

    this.instances.clear();
  }

  /**
   * Get running instances count
   */
  getRunningCount(): number {
    return Array.from(this.instances.values()).filter(i => i.isRunning()).length;
  }
}

// Singleton instance manager
export const foundryManager = new FoundryInstanceManager();

// Cleanup on process exit
process.on('SIGINT', async () => {
  console.log('[Manager] Received SIGINT, shutting down...');
  await foundryManager.stopAll();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('[Manager] Received SIGTERM, shutting down...');
  await foundryManager.stopAll();
  process.exit(0);
});
