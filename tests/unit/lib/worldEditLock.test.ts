import { describe, it, expect, beforeEach } from 'vitest';
import {
  isWorldEditable,
  getEditLockMessage,
  assertWorldEditable,
  isWorldLive,
} from '@/lib/worldEditLock';
import { prismaMock } from '../setup';

describe('worldEditLock', () => {
  const worldId = 'test-world-123';

  beforeEach(() => {
    // Reset mocks before each test
    prismaMock.foundryWorldSnapshot.findUnique.mockReset();
  });

  describe('isWorldEditable', () => {
    it('should return editable=true for world that has never been loaded', async () => {
      prismaMock.foundryWorldSnapshot.findUnique.mockResolvedValue(null);

      const result = await isWorldEditable(worldId);

      expect(result).toEqual({
        editable: true,
        status: 'never_loaded',
      });
    });

    it('should return editable=true for world with status "stored"', async () => {
      prismaMock.foundryWorldSnapshot.findUnique.mockResolvedValue({
        id: 'snapshot-1',
        rpgWorldId: worldId,
        status: 'stored',
        instance: null,
        instanceId: null,
        snapshotUrl: null,
        lastSnapshotAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await isWorldEditable(worldId);

      expect(result).toEqual({
        editable: true,
        status: 'stored',
      });
    });

    it('should return editable=false when world status is "loading"', async () => {
      const mockInstance = {
        id: 'instance-1',
        accessUrl: 'https://foundry.example.com',
        status: 'running',
      };

      prismaMock.foundryWorldSnapshot.findUnique.mockResolvedValue({
        id: 'snapshot-1',
        rpgWorldId: worldId,
        status: 'loading',
        instance: mockInstance,
        instanceId: mockInstance.id,
        snapshotUrl: null,
        lastSnapshotAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await isWorldEditable(worldId);

      expect(result).toEqual({
        editable: false,
        status: 'loading',
        reason: 'World is currently booting in a Foundry instance',
        instanceUrl: mockInstance.accessUrl,
        instanceId: mockInstance.id,
      });
    });

    it('should return editable=false when world status is "active"', async () => {
      prismaMock.foundryWorldSnapshot.findUnique.mockResolvedValue({
        id: 'snapshot-1',
        rpgWorldId: worldId,
        status: 'active',
        instance: {
          id: 'instance-1',
          accessUrl: 'https://foundry.example.com',
          status: 'running',
        },
        instanceId: 'instance-1',
        snapshotUrl: null,
        lastSnapshotAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await isWorldEditable(worldId);

      expect(result.editable).toBe(false);
      expect(result.status).toBe('active');
      expect(result.reason).toBe('World is currently live in an active session');
    });

    it('should return editable=false when world status is "saving"', async () => {
      prismaMock.foundryWorldSnapshot.findUnique.mockResolvedValue({
        id: 'snapshot-1',
        rpgWorldId: worldId,
        status: 'saving',
        instance: null,
        instanceId: null,
        snapshotUrl: null,
        lastSnapshotAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await isWorldEditable(worldId);

      expect(result.editable).toBe(false);
      expect(result.status).toBe('saving');
      expect(result.reason).toBe('World is syncing data from Foundry');
    });

    it('should return editable=false when world status is "migrating"', async () => {
      prismaMock.foundryWorldSnapshot.findUnique.mockResolvedValue({
        id: 'snapshot-1',
        rpgWorldId: worldId,
        status: 'migrating',
        instance: null,
        instanceId: null,
        snapshotUrl: null,
        lastSnapshotAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await isWorldEditable(worldId);

      expect(result.editable).toBe(false);
      expect(result.status).toBe('migrating');
      expect(result.reason).toBe('World is being migrated between instances');
    });
  });

  describe('getEditLockMessage', () => {
    it('should return positive message for editable world', () => {
      const status = { editable: true, status: 'stored' as const };
      const message = getEditLockMessage(status);

      expect(message).toBe('This world is offline and available for editing.');
    });

    it('should return loading message for loading world', () => {
      const status = {
        editable: false,
        status: 'loading' as const,
        reason: 'World is currently booting in a Foundry instance',
      };
      const message = getEditLockMessage(status);

      expect(message).toBe('🔄 This world is currently booting. Please wait for it to finish loading.');
    });

    it('should return active message for live world', () => {
      const status = {
        editable: false,
        status: 'active' as const,
        reason: 'World is currently live in an active session',
      };
      const message = getEditLockMessage(status);

      expect(message).toBe('🟢 This world is live in an active session. Editing is disabled to prevent data conflicts.');
    });

    it('should return saving message for syncing world', () => {
      const status = {
        editable: false,
        status: 'saving' as const,
        reason: 'World is syncing data from Foundry',
      };
      const message = getEditLockMessage(status);

      expect(message).toBe('💾 This world is syncing data from Foundry. Please wait for sync to complete.');
    });

    it('should return migrating message for migrating world', () => {
      const status = {
        editable: false,
        status: 'migrating' as const,
        reason: 'World is being migrated',
      };
      const message = getEditLockMessage(status);

      expect(message).toBe('🔀 This world is being migrated. Please wait for migration to complete.');
    });
  });

  describe('assertWorldEditable', () => {
    it('should not throw error for editable world', async () => {
      prismaMock.foundryWorldSnapshot.findUnique.mockResolvedValue(null);

      await expect(assertWorldEditable(worldId)).resolves.toBeUndefined();
    });

    it('should throw error with status 423 for locked world', async () => {
      prismaMock.foundryWorldSnapshot.findUnique.mockResolvedValue({
        id: 'snapshot-1',
        rpgWorldId: worldId,
        status: 'active',
        instance: null,
        instanceId: null,
        snapshotUrl: null,
        lastSnapshotAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(assertWorldEditable(worldId)).rejects.toThrow('World is currently live in an active session');

      try {
        await assertWorldEditable(worldId);
      } catch (error: any) {
        expect(error.status).toBe(423);
        expect(error.lockStatus).toBeDefined();
        expect(error.lockStatus.editable).toBe(false);
      }
    });
  });

  describe('isWorldLive', () => {
    it('should return false for world with no snapshot', async () => {
      prismaMock.foundryWorldSnapshot.findUnique.mockResolvedValue(null);

      const result = await isWorldLive(worldId);

      expect(result).toBe(false);
    });

    it('should return true for world with status "active"', async () => {
      prismaMock.foundryWorldSnapshot.findUnique.mockResolvedValue({
        status: 'active',
      });

      const result = await isWorldLive(worldId);

      expect(result).toBe(true);
    });

    it('should return true for world with status "saving"', async () => {
      prismaMock.foundryWorldSnapshot.findUnique.mockResolvedValue({
        status: 'saving',
      });

      const result = await isWorldLive(worldId);

      expect(result).toBe(true);
    });

    it('should return false for world with status "stored"', async () => {
      prismaMock.foundryWorldSnapshot.findUnique.mockResolvedValue({
        status: 'stored',
      });

      const result = await isWorldLive(worldId);

      expect(result).toBe(false);
    });

    it('should return false for world with status "loading"', async () => {
      prismaMock.foundryWorldSnapshot.findUnique.mockResolvedValue({
        status: 'loading',
      });

      const result = await isWorldLive(worldId);

      expect(result).toBe(false);
    });

    it('should return false for world with status "migrating"', async () => {
      prismaMock.foundryWorldSnapshot.findUnique.mockResolvedValue({
        status: 'migrating',
      });

      const result = await isWorldLive(worldId);

      expect(result).toBe(false);
    });
  });
});
