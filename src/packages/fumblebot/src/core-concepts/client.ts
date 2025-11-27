/**
 * Core Concepts API Client
 *
 * Provides access to RPG core concepts data:
 * - RPG Systems (D&D 5e, Pathfinder, Cypher, etc.)
 * - Creatures (monsters, NPCs, player characters)
 * - Locations (worlds, planes, dungeons, cities)
 * - Attributes (stats, skills, resources)
 *
 * Used by FumbleBot for rules lookups, creature stats, and world building
 */

import type { PrismaClient } from '@prisma/client';

export interface RpgSystemInfo {
  id: string;
  systemId: string;
  name: string;
  title: string;
  description?: string;
  version?: string;
  author?: string;
  publisher?: string;
  license?: string;
  platforms: Record<string, any>;
  isEnabled: boolean;
  isCore: boolean;
}

export interface RpgCreatureInfo {
  id: string;
  name: string;
  creatureType?: string;
  description?: string;
  stats: Record<string, any>;
  abilities?: string[];
  cr?: string;
  size?: string;
  alignment?: string;
}

export interface RpgLocationInfo {
  id: string;
  name: string;
  title: string;
  description?: string;
  locationType: string;
  locationScale: string;
  parentLocationId?: string;
}

export interface CoreConceptsClientOptions {
  prisma: PrismaClient;
}

/**
 * Core Concepts Client
 * Provides access to RPG data from the database
 */
export class CoreConceptsClient {
  private prisma: PrismaClient;

  constructor(options: CoreConceptsClientOptions) {
    this.prisma = options.prisma;
  }

  // ============================================================================
  // RPG Systems
  // ============================================================================

  /**
   * Get all enabled RPG systems
   */
  async getRpgSystems(): Promise<RpgSystemInfo[]> {
    const systems = await this.prisma.rpgSystem.findMany({
      where: {
        isEnabled: true,
        deletedAt: null,
      },
      orderBy: [
        { priority: 'desc' },
        { name: 'asc' },
      ],
    });

    return systems.map((s: any) => ({
      id: s.id,
      systemId: s.systemId,
      name: s.name,
      title: s.title,
      description: s.description || undefined,
      version: s.version || undefined,
      author: s.author || undefined,
      publisher: s.publisher || undefined,
      license: s.license || undefined,
      platforms: s.platforms as Record<string, any>,
      isEnabled: s.isEnabled,
      isCore: s.isCore,
    }));
  }

  /**
   * Get a specific RPG system by systemId
   */
  async getRpgSystemBySystemId(systemId: string): Promise<RpgSystemInfo | null> {
    const system = await this.prisma.rpgSystem.findFirst({
      where: {
        systemId,
        deletedAt: null,
      },
    });

    if (!system) return null;

    return {
      id: system.id,
      systemId: system.systemId,
      name: system.name,
      title: system.title,
      description: system.description || undefined,
      version: system.version || undefined,
      author: system.author || undefined,
      publisher: system.publisher || undefined,
      license: system.license || undefined,
      platforms: system.platforms as Record<string, any>,
      isEnabled: system.isEnabled,
      isCore: system.isCore,
    };
  }

  /**
   * Get core/featured RPG systems
   */
  async getCoreSystems(): Promise<RpgSystemInfo[]> {
    const systems = await this.prisma.rpgSystem.findMany({
      where: {
        isCore: true,
        isEnabled: true,
        deletedAt: null,
      },
      orderBy: [
        { priority: 'desc' },
        { name: 'asc' },
      ],
    });

    return systems.map((s: any) => ({
      id: s.id,
      systemId: s.systemId,
      name: s.name,
      title: s.title,
      description: s.description || undefined,
      version: s.version || undefined,
      author: s.author || undefined,
      publisher: s.publisher || undefined,
      license: s.license || undefined,
      platforms: s.platforms as Record<string, any>,
      isEnabled: s.isEnabled,
      isCore: s.isCore,
    }));
  }

  // ============================================================================
  // Creatures
  // ============================================================================

  /**
   * Search for creatures by name
   */
  async searchCreatures(query: string, limit: number = 10): Promise<RpgCreatureInfo[]> {
    const creatures = await this.prisma.rpgCreature.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
        deletedAt: null,
      },
      take: limit,
      orderBy: {
        name: 'asc',
      },
    });

    return creatures.map((c: any) => ({
      id: c.id,
      name: c.name,
      creatureType: c.creatureType || undefined,
      description: c.description || undefined,
      stats: (c.stats as Record<string, any>) || {},
      abilities: ((c.abilities as any) || []) as string[],
      cr: ((c.stats as any)?.cr as string) || undefined,
      size: ((c.stats as any)?.size as string) || undefined,
      alignment: ((c.stats as any)?.alignment as string) || undefined,
    }));
  }

  /**
   * Get a specific creature by ID
   */
  async getCreature(id: string): Promise<RpgCreatureInfo | null> {
    const creature = await this.prisma.rpgCreature.findUnique({
      where: { id },
    });

    if (!creature || creature.deletedAt) return null;

    return {
      id: creature.id,
      name: creature.name,
      creatureType: creature.creatureType || undefined,
      description: creature.description || undefined,
      stats: (creature.stats as Record<string, any>) || {},
      abilities: ((creature.abilities as any) || []) as string[],
      cr: ((creature.stats as any)?.cr as string) || undefined,
      size: ((creature.stats as any)?.size as string) || undefined,
      alignment: ((creature.stats as any)?.alignment as string) || undefined,
    };
  }

  // ============================================================================
  // Locations
  // ============================================================================

  /**
   * Search for locations by name
   */
  async searchLocations(query: string, limit: number = 10): Promise<RpgLocationInfo[]> {
    const locations = await this.prisma.rpgLocation.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            title: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
        deletedAt: null,
      },
      take: limit,
      orderBy: {
        name: 'asc',
      },
    });

    return locations.map((l: any) => ({
      id: l.id,
      name: l.name,
      title: l.title,
      description: l.description || undefined,
      locationType: l.locationType,
      locationScale: l.locationScale,
      parentLocationId: l.parentLocationId || undefined,
    }));
  }

  /**
   * Get a specific location by ID
   */
  async getLocation(id: string): Promise<RpgLocationInfo | null> {
    const location = await this.prisma.rpgLocation.findUnique({
      where: { id },
    });

    if (!location || location.deletedAt) return null;

    return {
      id: location.id,
      name: location.name,
      title: location.title,
      description: location.description || undefined,
      locationType: location.locationType,
      locationScale: location.locationScale,
      parentLocationId: location.parentLocationId || undefined,
    };
  }

  // ============================================================================
  // Attributes
  // ============================================================================

  /**
   * Get attributes for a specific RPG system
   */
  async getSystemAttributes(systemName: string): Promise<any[]> {
    const attributes = await this.prisma.rpgAttribute.findMany({
      where: {
        systemName,
        deletedAt: null,
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });

    return attributes.map((a: any) => ({
      id: a.id,
      name: a.name,
      title: a.title,
      description: a.description || undefined,
      category: a.category,
      dataType: a.dataType,
      defaultValue: a.defaultValue || undefined,
      minValue: a.minValue?.toString() || undefined,
      maxValue: a.maxValue?.toString() || undefined,
      isCore: a.isCore,
      metadata: a.metadata,
    }));
  }
}
