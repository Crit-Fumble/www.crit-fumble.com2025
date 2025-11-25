import { prisma } from '@/lib/db';

/**
 * Result of checking if a world is editable
 */
export interface WorldEditLockStatus {
  editable: boolean;
  status: 'stored' | 'loading' | 'active' | 'saving' | 'migrating' | 'never_loaded';
  reason?: string;
  instanceUrl?: string;
  instanceId?: string;
}

/**
 * Check if world is editable via web UI
 *
 * CRITICAL RULE: Web UI edits are ONLY allowed when world is completely offline.
 *
 * Returns:
 * - editable: true ONLY if world status is 'stored' (offline) or has never been loaded
 * - editable: false if world is 'loading', 'active', 'saving', or 'migrating'
 *
 * @param worldId - RPGWorld ID to check
 * @returns Lock status with reason if locked
 */
export async function isWorldEditable(worldId: string): Promise<WorldEditLockStatus> {
  const snapshot = await prisma.foundryWorldSnapshot.findUnique({
    where: { rpgWorldId: worldId },
    include: {
      instance: {
        select: {
          id: true,
          accessUrl: true,
          status: true
        }
      }
    }
  });

  if (!snapshot) {
    // No snapshot exists = world has never been loaded in Foundry
    // Safe to edit via web UI
    return {
      editable: true,
      status: 'never_loaded'
    };
  }

  // Check if world is in a non-editable state
  const isLocked = snapshot.status !== 'stored';

  if (isLocked) {
    const reasons: Record<string, string> = {
      loading: 'World is currently booting in a Foundry instance',
      active: 'World is currently live in an active session',
      saving: 'World is syncing data from Foundry',
      migrating: 'World is being migrated between instances'
    };

    return {
      editable: false,
      status: snapshot.status as any,
      reason: reasons[snapshot.status] || 'World is not available for editing',
      instanceUrl: snapshot.instance?.accessUrl || undefined,
      instanceId: snapshot.instance?.id || undefined
    };
  }

  // World is stored = completely offline = safe to edit
  return {
    editable: true,
    status: 'stored'
  };
}

/**
 * Get a user-friendly message for the lock status
 */
export function getEditLockMessage(status: WorldEditLockStatus): string {
  if (status.editable) {
    return 'This world is offline and available for editing.';
  }

  const messages: Record<string, string> = {
    loading: '🔄 This world is currently booting. Please wait for it to finish loading.',
    active: '🟢 This world is live in an active session. Editing is disabled to prevent data conflicts.',
    saving: '💾 This world is syncing data from Foundry. Please wait for sync to complete.',
    migrating: '🔀 This world is being migrated. Please wait for migration to complete.'
  };

  return messages[status.status] || '🔒 This world is not available for editing.';
}

/**
 * Throws an error if world is not editable
 * Use this in API endpoints that require edit access
 */
export async function assertWorldEditable(worldId: string): Promise<void> {
  const lockStatus = await isWorldEditable(worldId);

  if (!lockStatus.editable) {
    const error: any = new Error(lockStatus.reason || 'World is not editable');
    error.status = 423; // HTTP 423 Locked
    error.lockStatus = lockStatus;
    throw error;
  }
}

/**
 * Check if a world is currently live (active or saving)
 */
export async function isWorldLive(worldId: string): Promise<boolean> {
  const snapshot = await prisma.foundryWorldSnapshot.findUnique({
    where: { rpgWorldId: worldId },
    select: { status: true }
  });

  if (!snapshot) return false;

  return snapshot.status === 'active' || snapshot.status === 'saving';
}
