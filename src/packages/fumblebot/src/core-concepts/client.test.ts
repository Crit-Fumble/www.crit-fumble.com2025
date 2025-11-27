/**
 * Core Concepts Client Tests
 * Tests for CoreConceptsClient with mocked Prisma
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CoreConceptsClient } from './client.js';
import type { PrismaClient } from '@prisma/client';

// Mock Prisma client
const createMockPrisma = () => ({
  rpgSystem: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
  },
  rpgCreature: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  rpgLocation: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  rpgAttribute: {
    findMany: vi.fn(),
  },
});

describe('CoreConceptsClient', () => {
  let client: CoreConceptsClient;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    client = new CoreConceptsClient({ prisma: mockPrisma as unknown as PrismaClient });
  });

  describe('getRpgSystems', () => {
    it('should return all enabled RPG systems', async () => {
      const mockSystems = [
        {
          id: '1',
          systemId: 'dnd5e',
          name: 'D&D 5e',
          title: 'Dungeons & Dragons 5th Edition',
          description: 'Classic fantasy RPG',
          version: '5.2.0',
          author: 'Wizards of the Coast',
          publisher: 'Wizards of the Coast',
          license: 'OGL',
          platforms: { foundry: { version: '11.0.0' } },
          isEnabled: true,
          isCore: true,
          priority: 10,
          addedBy: null,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      mockPrisma.rpgSystem.findMany.mockResolvedValue(mockSystems);

      const result = await client.getRpgSystems();

      expect(mockPrisma.rpgSystem.findMany).toHaveBeenCalledWith({
        where: {
          isEnabled: true,
          deletedAt: null,
        },
        orderBy: [{ priority: 'desc' }, { name: 'asc' }],
      });

      expect(result).toHaveLength(1);
      expect(result[0].systemId).toBe('dnd5e');
      expect(result[0].name).toBe('D&D 5e');
    });

    it('should return empty array when no systems found', async () => {
      mockPrisma.rpgSystem.findMany.mockResolvedValue([]);

      const result = await client.getRpgSystems();

      expect(result).toEqual([]);
    });
  });

  describe('getRpgSystemBySystemId', () => {
    it('should return system by systemId', async () => {
      const mockSystem = {
        id: '1',
        systemId: 'pf2e',
        name: 'Pathfinder 2e',
        title: 'Pathfinder Second Edition',
        description: null,
        version: '2.4.0',
        author: null,
        publisher: 'Paizo',
        license: 'OGL',
        platforms: {},
        isEnabled: true,
        isCore: true,
        priority: 5,
        addedBy: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrisma.rpgSystem.findFirst.mockResolvedValue(mockSystem);

      const result = await client.getRpgSystemBySystemId('pf2e');

      expect(mockPrisma.rpgSystem.findFirst).toHaveBeenCalledWith({
        where: {
          systemId: 'pf2e',
          deletedAt: null,
        },
      });

      expect(result).not.toBeNull();
      expect(result?.systemId).toBe('pf2e');
    });

    it('should return null when system not found', async () => {
      mockPrisma.rpgSystem.findFirst.mockResolvedValue(null);

      const result = await client.getRpgSystemBySystemId('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getCoreSystems', () => {
    it('should return only core systems', async () => {
      const mockSystems = [
        {
          id: '1',
          systemId: 'dnd5e',
          name: 'D&D 5e',
          title: 'Dungeons & Dragons 5th Edition',
          description: null,
          version: '5.2.0',
          author: null,
          publisher: null,
          license: null,
          platforms: {},
          isEnabled: true,
          isCore: true,
          priority: 10,
          addedBy: null,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      mockPrisma.rpgSystem.findMany.mockResolvedValue(mockSystems);

      const result = await client.getCoreSystems();

      expect(mockPrisma.rpgSystem.findMany).toHaveBeenCalledWith({
        where: {
          isCore: true,
          isEnabled: true,
          deletedAt: null,
        },
        orderBy: [{ priority: 'desc' }, { name: 'asc' }],
      });

      expect(result).toHaveLength(1);
      expect(result[0].isCore).toBe(true);
    });
  });

  describe('searchCreatures', () => {
    it('should search creatures by name', async () => {
      const mockCreatures = [
        {
          id: 'creature-1',
          name: 'Adult Red Dragon',
          creatureType: 'Dragon',
          description: 'A fearsome red dragon',
          stats: { cr: '17', size: 'Huge', alignment: 'Chaotic Evil' },
          abilities: ['Fire Breath', 'Frightful Presence'],
          sheetId: null,
          worldId: null,
          playerId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      mockPrisma.rpgCreature.findMany.mockResolvedValue(mockCreatures);

      const result = await client.searchCreatures('dragon', 10);

      expect(mockPrisma.rpgCreature.findMany).toHaveBeenCalledWith({
        where: {
          name: {
            contains: 'dragon',
            mode: 'insensitive',
          },
          deletedAt: null,
        },
        take: 10,
        orderBy: {
          name: 'asc',
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Adult Red Dragon');
      expect(result[0].cr).toBe('17');
    });

    it('should respect limit parameter', async () => {
      mockPrisma.rpgCreature.findMany.mockResolvedValue([]);

      await client.searchCreatures('goblin', 5);

      expect(mockPrisma.rpgCreature.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        })
      );
    });
  });

  describe('getCreature', () => {
    it('should return creature by ID', async () => {
      const mockCreature = {
        id: 'creature-123',
        name: 'Goblin',
        creatureType: 'Humanoid',
        description: 'Small goblinoid',
        stats: { cr: '1/4', size: 'Small' },
        abilities: ['Nimble Escape'],
        sheetId: null,
        worldId: null,
        playerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrisma.rpgCreature.findUnique.mockResolvedValue(mockCreature);

      const result = await client.getCreature('creature-123');

      expect(mockPrisma.rpgCreature.findUnique).toHaveBeenCalledWith({
        where: { id: 'creature-123' },
      });

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Goblin');
    });

    it('should return null for deleted creature', async () => {
      const deletedCreature = {
        id: 'creature-123',
        name: 'Deleted',
        creatureType: null,
        description: null,
        stats: {},
        abilities: [],
        sheetId: null,
        worldId: null,
        playerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(), // Deleted
      };

      mockPrisma.rpgCreature.findUnique.mockResolvedValue(deletedCreature);

      const result = await client.getCreature('creature-123');

      expect(result).toBeNull();
    });
  });

  describe('searchLocations', () => {
    it('should search locations by name or title', async () => {
      const mockLocations = [
        {
          id: 'loc-1',
          name: 'waterdeep',
          title: 'City of Splendors - Waterdeep',
          description: 'A bustling metropolis',
          locationType: 'city',
          locationScale: 'Settlement',
          parentLocationId: null,
          worldId: null,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      mockPrisma.rpgLocation.findMany.mockResolvedValue(mockLocations);

      const result = await client.searchLocations('waterdeep', 10);

      expect(mockPrisma.rpgLocation.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            {
              name: {
                contains: 'waterdeep',
                mode: 'insensitive',
              },
            },
            {
              title: {
                contains: 'waterdeep',
                mode: 'insensitive',
              },
            },
          ],
          deletedAt: null,
        },
        take: 10,
        orderBy: {
          name: 'asc',
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('waterdeep');
    });
  });

  describe('getLocation', () => {
    it('should return location by ID', async () => {
      const mockLocation = {
        id: 'loc-456',
        name: 'shadowfell',
        title: 'The Shadowfell',
        description: 'Plane of shadow',
        locationType: 'plane',
        locationScale: 'Realm',
        parentLocationId: null,
        worldId: null,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrisma.rpgLocation.findUnique.mockResolvedValue(mockLocation);

      const result = await client.getLocation('loc-456');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('shadowfell');
    });
  });

  describe('getSystemAttributes', () => {
    it('should return attributes for a system', async () => {
      const mockAttributes = [
        {
          id: 'attr-1',
          name: 'strength',
          title: 'Strength',
          description: 'Physical power',
          category: 'stat',
          dataType: 'number',
          defaultValue: '10',
          minValue: { toNumber: () => 1 },
          maxValue: { toNumber: () => 20 },
          systemName: 'D&D 5e',
          isCore: true,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      mockPrisma.rpgAttribute.findMany.mockResolvedValue(mockAttributes);

      const result = await client.getSystemAttributes('D&D 5e');

      expect(mockPrisma.rpgAttribute.findMany).toHaveBeenCalledWith({
        where: {
          systemName: 'D&D 5e',
          deletedAt: null,
        },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('strength');
    });
  });
});
