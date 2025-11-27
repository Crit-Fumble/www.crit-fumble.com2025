/**
 * Core Concepts Integration Tests
 * Tests against real staging database
 *
 * Run with: npm run test:integration
 * Requires: DATABASE_URL env var pointing to staging DB
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { CoreConceptsClient } from '../core-concepts/client.js';

describe('Core Concepts Integration Tests', () => {
  let prisma: PrismaClient;
  let client: CoreConceptsClient;

  beforeAll(async () => {
    // Connect to staging database
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    client = new CoreConceptsClient({ prisma });

    // Verify connection
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('RPG Systems', () => {
    it('should fetch real RPG systems from staging', async () => {
      const systems = await client.getRpgSystems();

      expect(systems).toBeDefined();
      expect(Array.isArray(systems)).toBe(true);

      // If systems exist, verify structure
      if (systems.length > 0) {
        const system = systems[0];
        expect(system).toHaveProperty('id');
        expect(system).toHaveProperty('systemId');
        expect(system).toHaveProperty('name');
        expect(system).toHaveProperty('isEnabled', true);
        expect(system).toHaveProperty('platforms');
        expect(typeof system.platforms).toBe('object');
      }
    });

    it('should fetch only core systems', async () => {
      const coreSystems = await client.getCoreSystems();

      expect(coreSystems).toBeDefined();
      expect(Array.isArray(coreSystems)).toBe(true);

      // All returned systems should be core
      coreSystems.forEach((system) => {
        expect(system.isCore).toBe(true);
        expect(system.isEnabled).toBe(true);
      });
    });

    it('should fetch system by systemId if exists', async () => {
      // Try common system IDs
      const systemIds = ['dnd5e', 'pf2e', 'cyphersystem'];

      let foundSystem = null;
      for (const systemId of systemIds) {
        const system = await client.getRpgSystemBySystemId(systemId);
        if (system) {
          foundSystem = system;
          break;
        }
      }

      // If any system exists, verify structure
      if (foundSystem) {
        expect(foundSystem).toHaveProperty('systemId');
        expect(foundSystem).toHaveProperty('name');
        expect(foundSystem).toHaveProperty('title');
      }
    });

    it('should return null for non-existent system', async () => {
      const system = await client.getRpgSystemBySystemId('nonexistent-system-12345');

      expect(system).toBeNull();
    });
  });

  describe('Creatures', () => {
    it('should search creatures (if any exist)', async () => {
      const creatures = await client.searchCreatures('dragon', 5);

      expect(creatures).toBeDefined();
      expect(Array.isArray(creatures)).toBe(true);
      expect(creatures.length).toBeLessThanOrEqual(5);

      // If creatures exist, verify structure
      if (creatures.length > 0) {
        const creature = creatures[0];
        expect(creature).toHaveProperty('id');
        expect(creature).toHaveProperty('name');
        expect(typeof creature.name).toBe('string');
        expect(creature.name.toLowerCase()).toContain('dragon');
      }
    });

    it('should respect search limit', async () => {
      const limit = 3;
      const creatures = await client.searchCreatures('goblin', limit);

      expect(creatures.length).toBeLessThanOrEqual(limit);
    });

    it('should return empty array for non-existent creature', async () => {
      const creatures = await client.searchCreatures('nonexistent-creature-xyz-12345', 10);

      expect(creatures).toEqual([]);
    });

    it('should get creature by ID if exists', async () => {
      // First search for a creature
      const creatures = await client.searchCreatures('dragon', 1);

      if (creatures.length > 0) {
        const creatureId = creatures[0].id;
        const creature = await client.getCreature(creatureId);

        expect(creature).not.toBeNull();
        expect(creature?.id).toBe(creatureId);
        expect(creature).toHaveProperty('name');
        expect(creature).toHaveProperty('stats');
      }
    });

    it('should return null for non-existent creature ID', async () => {
      const creature = await client.getCreature('00000000-0000-0000-0000-000000000000');

      expect(creature).toBeNull();
    });
  });

  describe('Locations', () => {
    it('should search locations (if any exist)', async () => {
      const locations = await client.searchLocations('city', 5);

      expect(locations).toBeDefined();
      expect(Array.isArray(locations)).toBe(true);
      expect(locations.length).toBeLessThanOrEqual(5);

      // If locations exist, verify structure
      if (locations.length > 0) {
        const location = locations[0];
        expect(location).toHaveProperty('id');
        expect(location).toHaveProperty('name');
        expect(location).toHaveProperty('locationType');
        expect(location).toHaveProperty('locationScale');
      }
    });

    it('should search by both name and title', async () => {
      const locations = await client.searchLocations('water', 10);

      expect(Array.isArray(locations)).toBe(true);

      // Verify that search works on either name or title
      locations.forEach((location) => {
        const matchesName = location.name.toLowerCase().includes('water');
        const matchesTitle = location.title.toLowerCase().includes('water');
        expect(matchesName || matchesTitle).toBe(true);
      });
    });

    it('should return empty array for non-existent location', async () => {
      const locations = await client.searchLocations('nonexistent-location-xyz-12345', 10);

      expect(locations).toEqual([]);
    });

    it('should get location by ID if exists', async () => {
      const locations = await client.searchLocations('city', 1);

      if (locations.length > 0) {
        const locationId = locations[0].id;
        const location = await client.getLocation(locationId);

        expect(location).not.toBeNull();
        expect(location?.id).toBe(locationId);
        expect(location).toHaveProperty('name');
        expect(location).toHaveProperty('locationType');
      }
    });
  });

  describe('System Attributes', () => {
    it('should fetch attributes for a system (if exist)', async () => {
      // Try common system names
      const systemNames = ['D&D 5e', 'Pathfinder 2e', 'Cypher System'];

      let foundAttributes = null;
      for (const systemName of systemNames) {
        const attributes = await client.getSystemAttributes(systemName);
        if (attributes.length > 0) {
          foundAttributes = attributes;
          break;
        }
      }

      // If attributes exist, verify structure
      if (foundAttributes && foundAttributes.length > 0) {
        const attribute = foundAttributes[0];
        expect(attribute).toHaveProperty('id');
        expect(attribute).toHaveProperty('name');
        expect(attribute).toHaveProperty('title');
        expect(attribute).toHaveProperty('category');
        expect(attribute).toHaveProperty('dataType');
      }
    });

    it('should return empty array for non-existent system', async () => {
      const attributes = await client.getSystemAttributes('NonExistent System 12345');

      expect(attributes).toEqual([]);
    });
  });

  describe('Data Integrity', () => {
    it('should not return soft-deleted systems', async () => {
      const systems = await client.getRpgSystems();

      // Verify all systems have deletedAt = null
      systems.forEach((system) => {
        expect(system).not.toHaveProperty('deletedAt');
      });
    });

    it('should not return soft-deleted creatures', async () => {
      const creatures = await client.searchCreatures('test', 10);

      // If we got creatures, verify none are deleted
      if (creatures.length > 0) {
        for (const creature of creatures) {
          const fullCreature = await client.getCreature(creature.id);
          expect(fullCreature).not.toBeNull(); // Should not be deleted
        }
      }
    });

    it('should maintain referential integrity for locations', async () => {
      const locations = await client.searchLocations('test', 10);

      // If locations have parent IDs, they should be valid UUIDs
      locations.forEach((location) => {
        if (location.parentLocationId) {
          expect(location.parentLocationId).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          );
        }
      });
    });
  });

  describe('Performance', () => {
    it('should fetch systems in reasonable time', async () => {
      const start = Date.now();
      await client.getRpgSystems();
      const duration = Date.now() - start;

      // Should complete within 1 second
      expect(duration).toBeLessThan(1000);
    });

    it('should search creatures in reasonable time', async () => {
      const start = Date.now();
      await client.searchCreatures('test', 10);
      const duration = Date.now() - start;

      // Should complete within 1 second
      expect(duration).toBeLessThan(1000);
    });

    it('should handle concurrent queries', async () => {
      const promises = [
        client.getRpgSystems(),
        client.searchCreatures('dragon', 5),
        client.searchLocations('city', 5),
        client.getCoreSystems(),
      ];

      const start = Date.now();
      const results = await Promise.all(promises);
      const duration = Date.now() - start;

      // All should succeed
      expect(results).toHaveLength(4);
      results.forEach((result) => {
        expect(Array.isArray(result)).toBe(true);
      });

      // Concurrent queries should be reasonably fast
      expect(duration).toBeLessThan(2000);
    });
  });
});
