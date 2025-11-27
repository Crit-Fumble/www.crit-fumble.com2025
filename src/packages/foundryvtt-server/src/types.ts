/**
 * Shared TypeScript types for Foundry VTT server management
 * These types are used by both the management API (on droplet) and Vercel API routes
 */

export type FoundryEnvironment = 'staging' | 'production';

export interface ContainerConfig {
  environment: FoundryEnvironment;
  slot: number; // 0-2 (three containers per environment)
  containerName: string; // e.g., "foundry-staging-1"
  port: number; // e.g., 30000
}

export interface StartContainerRequest {
  worldId: string;
  ownerId: string;
  slot: number;
  environment: FoundryEnvironment;
  licenseKey: string; // Foundry VTT license key (provided by user)
}

export interface StartContainerResponse {
  success: boolean;
  containerName: string;
  environment: FoundryEnvironment;
  port: number;
  error?: string;
}

export interface StopContainerRequest {
  containerName: string;
  environment: FoundryEnvironment;
}

export interface StopContainerResponse {
  success: boolean;
  environment: FoundryEnvironment;
  error?: string;
}

export interface ContainerStatus {
  name: string;
  status: string; // "running", "stopped", "exited", etc.
  environment: FoundryEnvironment;
  port: number;
  uptime?: string;
}

export interface StatusRequest {
  environment: FoundryEnvironment;
}

export interface StatusResponse {
  running: ContainerStatus[];
  environment: FoundryEnvironment;
  error?: string;
}

export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
}

export interface ErrorResponse {
  error: string;
  details?: unknown;
}
