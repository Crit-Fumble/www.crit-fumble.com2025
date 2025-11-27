/**
 * Docker Manager
 * Handles Docker container operations using dockerode
 */

import Docker from 'dockerode';
import type { ContainerStatus } from '../types.js';

export class DockerManager {
  private docker: Docker;

  constructor() {
    this.docker = new Docker({ socketPath: '/var/run/docker.sock' });
  }

  /**
   * Start a Docker container by name with an optional license key
   * If a license key is provided, the container will be recreated with the new environment variable
   */
  async startContainer(containerName: string, licenseKey?: string): Promise<void> {
    try {
      const container = this.docker.getContainer(containerName);

      // Check if container exists
      let info;
      try {
        info = await container.inspect();
      } catch (error: any) {
        if (error.statusCode === 404) {
          throw new Error(`Container ${containerName} does not exist. Containers must be pre-created.`);
        }
        throw error;
      }

      // If a license key is provided, recreate the container with the new environment variable
      if (licenseKey) {
        const wasRunning = info.State.Running;

        // Stop the container if it's running
        if (wasRunning) {
          await container.stop();
        }

        // Get current container configuration
        const config = info.Config;
        const hostConfig = info.HostConfig;

        // Update environment variables with license key
        const env = config.Env || [];
        const updatedEnv = [
          ...env.filter((e: string) => !e.startsWith('FOUNDRY_LICENSE_KEY=')),
          `FOUNDRY_LICENSE_KEY=${licenseKey}`
        ];

        // Remove the old container
        await container.remove();

        // Create new container with updated environment
        const newContainer = await this.docker.createContainer({
          name: containerName,
          Image: config.Image,
          Env: updatedEnv,
          HostConfig: hostConfig,
          ExposedPorts: config.ExposedPorts,
          Volumes: config.Volumes,
          WorkingDir: config.WorkingDir,
          Cmd: config.Cmd
        });

        // Start the new container
        await newContainer.start();
        console.log(`Successfully started container ${containerName} with new license key`);
      } else {
        // No license key provided, just start if not already running
        if (info.State.Running) {
          console.log(`Container ${containerName} is already running`);
          return;
        }

        await container.start();
        console.log(`Successfully started container: ${containerName}`);
      }
    } catch (error) {
      console.error(`Failed to start container ${containerName}:`, error);
      throw new Error(`Failed to start container ${containerName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stop a Docker container by name
   */
  async stopContainer(containerName: string): Promise<void> {
    try {
      const container = this.docker.getContainer(containerName);

      // Check if container is already stopped
      const info = await container.inspect();
      if (!info.State.Running) {
        console.log(`Container ${containerName} is already stopped`);
        return;
      }

      await container.stop({ t: 10 }); // 10 second graceful shutdown
      console.log(`Successfully stopped container: ${containerName}`);
    } catch (error) {
      console.error(`Failed to stop container ${containerName}:`, error);
      throw new Error(`Failed to stop container ${containerName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get status of a specific container
   */
  async getContainerStatus(containerName: string): Promise<ContainerStatus | null> {
    try {
      const container = this.docker.getContainer(containerName);
      const info = await container.inspect();

      return {
        name: info.Name.replace(/^\//, ''), // Remove leading slash
        status: info.State.Status,
        environment: containerName.includes('staging') ? 'staging' : 'production',
        port: this.extractPort(info.NetworkSettings.Ports),
        uptime: info.State.Running ? this.calculateUptime(info.State.StartedAt) : undefined
      };
    } catch (error) {
      // Container not found or other error
      return null;
    }
  }

  /**
   * Get all running containers matching a pattern
   */
  async listContainers(pattern?: string): Promise<ContainerStatus[]> {
    try {
      const containers = await this.docker.listContainers({ all: true });
      const statuses: ContainerStatus[] = [];

      for (const containerInfo of containers) {
        const name = containerInfo.Names[0]?.replace(/^\//, '') || '';

        // Filter by pattern if provided
        if (pattern && !name.includes(pattern)) {
          continue;
        }

        statuses.push({
          name,
          status: containerInfo.State,
          environment: name.includes('staging') ? 'staging' : 'production',
          port: this.extractPortFromInfo(containerInfo.Ports),
          uptime: containerInfo.State === 'running' ? this.formatUptime(containerInfo.Status) : undefined
        });
      }

      return statuses;
    } catch (error) {
      console.error('Failed to list containers:', error);
      throw new Error(`Failed to list containers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract port number from Docker port bindings
   */
  private extractPort(ports: Docker.PortMap | undefined): number {
    if (!ports) return 0;

    // Look for exposed ports like "30000/tcp"
    for (const [key, bindings] of Object.entries(ports)) {
      if (bindings && bindings.length > 0) {
        const hostPort = bindings[0].HostPort;
        if (hostPort) {
          return parseInt(hostPort, 10);
        }
      }
    }

    return 0;
  }

  /**
   * Extract port from container info (listContainers format)
   */
  private extractPortFromInfo(ports: Docker.Port[]): number {
    if (!ports || ports.length === 0) return 0;

    for (const port of ports) {
      if (port.PublicPort) {
        return port.PublicPort;
      }
    }

    return 0;
  }

  /**
   * Calculate uptime from start time
   */
  private calculateUptime(startedAt: string): string {
    const start = new Date(startedAt);
    const now = new Date();
    const diff = now.getTime() - start.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Format uptime string from Docker status
   */
  private formatUptime(status: string): string {
    // Docker returns status like "Up 2 hours" or "Up 3 days"
    const match = status.match(/Up (.+)/);
    return match ? match[1] : status;
  }

  /**
   * Restart a container
   */
  async restartContainer(containerName: string): Promise<void> {
    try {
      const container = this.docker.getContainer(containerName);
      await container.restart({ t: 10 });
      console.log(`Successfully restarted container: ${containerName}`);
    } catch (error) {
      console.error(`Failed to restart container ${containerName}:`, error);
      throw new Error(`Failed to restart container ${containerName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get container logs
   */
  async getContainerLogs(containerName: string, tail: number = 100): Promise<string> {
    try {
      const container = this.docker.getContainer(containerName);
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail,
        timestamps: true
      });

      return logs.toString('utf-8');
    } catch (error) {
      console.error(`Failed to get logs for container ${containerName}:`, error);
      throw new Error(`Failed to get logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
