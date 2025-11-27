/**
 * Core Concepts API Client
 * HTTP client for accessing RPG data from the Core Concepts API
 *
 * This replaces direct Prisma access to RPG tables with API calls
 * when using the hybrid architecture (Neon for website, DO for RPG)
 */

import { z } from 'zod';

// Environment configuration
const API_BASE_URL = process.env.CORE_CONCEPTS_API_URL || 'http://localhost:3001';
const API_SECRET = process.env.CORE_CONCEPTS_API_SECRET || '';
const USE_INTERNAL = process.env.USE_INTERNAL_API === 'true'; // For VPC internal calls

// Generic pagination response
interface PaginatedResponse<T> {
  total: number;
  limit: number;
  offset: number;
  data: T[];
}

// API Error
class RpgApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'RpgApiError';
  }
}

/**
 * Make an authenticated request to the Core Concepts API
 */
async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Add authentication
  if (USE_INTERNAL) {
    headers['X-Internal-Secret'] = API_SECRET;
  } else if (API_SECRET) {
    headers['Authorization'] = `Bearer ${API_SECRET}`;
  }

  const url = `${API_BASE_URL}${path}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new RpgApiError(
        error.error || `API request failed: ${response.statusText}`,
        response.status,
        error.code
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof RpgApiError) throw error;
    throw new RpgApiError(
      `Failed to connect to Core Concepts API: ${error instanceof Error ? error.message : 'Unknown error'}`,
      503
    );
  }
}

// ============================================================================
// Worlds
// ============================================================================

export interface RpgWorld {
  id: string;
  name: string;
  description?: string | null;
  systemName: string;
  worldScale: string;
  ownerId: string;
  foundryWorldId?: string | null;
  settings: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export const rpgWorlds = {
  async findMany(params?: {
    ownerId?: string;
    isPublic?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ worlds: RpgWorld[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params?.ownerId) searchParams.set('ownerId', params.ownerId);
    if (params?.isPublic !== undefined) searchParams.set('isPublic', String(params.isPublic));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));

    return apiRequest(`/api/v1/worlds?${searchParams}`);
  },

  async findUnique(id: string): Promise<RpgWorld | null> {
    try {
      return await apiRequest(`/api/v1/worlds/${id}`);
    } catch (error) {
      if (error instanceof RpgApiError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  },

  async create(data: Omit<RpgWorld, 'id' | 'createdAt' | 'updatedAt'>): Promise<RpgWorld> {
    return apiRequest('/api/v1/worlds', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Partial<RpgWorld>): Promise<RpgWorld> {
    return apiRequest(`/api/v1/worlds/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    await apiRequest(`/api/v1/worlds/${id}`, { method: 'DELETE' });
  },
};

// ============================================================================
// Creatures
// ============================================================================

export interface RpgCreature {
  id: string;
  name: string;
  race?: string | null;
  class?: string | null;
  profession?: string | null;
  level: number;
  imageUrl?: string | null;
  worldId?: string | null;
  campaignId?: string | null;
  playerId?: string | null;
  foundryId?: string | null;
  lawfulness: number;
  goodness: number;
  faith: number;
  courage: number;
  alignment?: string | null;
  foodNeed: number;
  waterNeed: number;
  sleepNeed: number;
  relaxationNeed: number;
  adventureNeed: number;
  simulationZone: string;
  createdAt: string;
  updatedAt: string;
}

export const rpgCreatures = {
  async findMany(params?: {
    worldId?: string;
    campaignId?: string;
    foundryId?: string;
    isPlayerCharacter?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ creatures: RpgCreature[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params?.worldId) searchParams.set('worldId', params.worldId);
    if (params?.campaignId) searchParams.set('campaignId', params.campaignId);
    if (params?.foundryId) searchParams.set('foundryId', params.foundryId);
    if (params?.isPlayerCharacter !== undefined) {
      searchParams.set('isPlayerCharacter', String(params.isPlayerCharacter));
    }
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));

    return apiRequest(`/api/v1/creatures?${searchParams}`);
  },

  async findUnique(id: string): Promise<RpgCreature | null> {
    try {
      return await apiRequest(`/api/v1/creatures/${id}`);
    } catch (error) {
      if (error instanceof RpgApiError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  },

  async findByFoundryId(foundryId: string): Promise<RpgCreature | null> {
    const result = await this.findMany({ foundryId, limit: 1 });
    return result.creatures[0] || null;
  },

  async create(data: Omit<RpgCreature, 'id' | 'createdAt' | 'updatedAt'>): Promise<RpgCreature> {
    return apiRequest('/api/v1/creatures', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async upsert(data: Omit<RpgCreature, 'id' | 'createdAt' | 'updatedAt'> & { foundryId: string }): Promise<RpgCreature> {
    return apiRequest('/api/v1/creatures/upsert', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Partial<RpgCreature>): Promise<RpgCreature> {
    return apiRequest(`/api/v1/creatures/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    await apiRequest(`/api/v1/creatures/${id}`, { method: 'DELETE' });
  },
};

// ============================================================================
// Sessions
// ============================================================================

export interface RpgSession {
  id: string;
  sessionNumber?: number | null;
  sessionTitle?: string | null;
  sessionDate: string;
  systemName: string;
  campaignId?: string | null;
  campaignName?: string | null;
  worldId?: string | null;
  sessionNotes?: string | null;
  summary?: string | null;
  durationMinutes?: number | null;
  createdAt: string;
  updatedAt: string;
}

export const rpgSessions = {
  async findMany(params?: {
    worldId?: string;
    campaignId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ sessions: RpgSession[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params?.worldId) searchParams.set('worldId', params.worldId);
    if (params?.campaignId) searchParams.set('campaignId', params.campaignId);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));

    return apiRequest(`/api/v1/sessions?${searchParams}`);
  },

  async findUnique(id: string): Promise<RpgSession | null> {
    try {
      return await apiRequest(`/api/v1/sessions/${id}`);
    } catch (error) {
      if (error instanceof RpgApiError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  },

  async create(data: Omit<RpgSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<RpgSession> {
    return apiRequest('/api/v1/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Partial<RpgSession>): Promise<RpgSession> {
    return apiRequest(`/api/v1/sessions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    await apiRequest(`/api/v1/sessions/${id}`, { method: 'DELETE' });
  },
};

// ============================================================================
// Campaigns
// ============================================================================

export interface RpgCampaign {
  id: string;
  name: string;
  description?: string | null;
  systemName: string;
  ownerId: string;
  status: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export const rpgCampaigns = {
  async findMany(params?: {
    ownerId?: string;
    status?: string;
    isPublic?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ campaigns: RpgCampaign[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params?.ownerId) searchParams.set('ownerId', params.ownerId);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.isPublic !== undefined) searchParams.set('isPublic', String(params.isPublic));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));

    return apiRequest(`/api/v1/campaigns?${searchParams}`);
  },

  async findUnique(id: string): Promise<RpgCampaign | null> {
    try {
      return await apiRequest(`/api/v1/campaigns/${id}`);
    } catch (error) {
      if (error instanceof RpgApiError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  },

  async create(data: Omit<RpgCampaign, 'id' | 'createdAt' | 'updatedAt'>): Promise<RpgCampaign> {
    return apiRequest('/api/v1/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Partial<RpgCampaign>): Promise<RpgCampaign> {
    return apiRequest(`/api/v1/campaigns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    await apiRequest(`/api/v1/campaigns/${id}`, { method: 'DELETE' });
  },
};

// ============================================================================
// Players
// ============================================================================

export interface RpgPlayer {
  id: string;
  userId: string;
  displayName?: string | null;
  defaultRole: string;
  gameSettings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export const rpgPlayers = {
  async findMany(params?: {
    userId?: string;
    campaignId?: string;
    role?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ players: RpgPlayer[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params?.userId) searchParams.set('userId', params.userId);
    if (params?.campaignId) searchParams.set('campaignId', params.campaignId);
    if (params?.role) searchParams.set('role', params.role);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));

    return apiRequest(`/api/v1/players?${searchParams}`);
  },

  async findUnique(id: string): Promise<RpgPlayer | null> {
    try {
      return await apiRequest(`/api/v1/players/${id}`);
    } catch (error) {
      if (error instanceof RpgApiError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  },

  async findByUserId(userId: string): Promise<RpgPlayer | null> {
    const result = await this.findMany({ userId, limit: 1 });
    return result.players[0] || null;
  },

  async create(data: Omit<RpgPlayer, 'id' | 'createdAt' | 'updatedAt'>): Promise<RpgPlayer> {
    return apiRequest('/api/v1/players', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async upsert(data: {
    userId: string;
    campaignId: string;
    role?: string;
    characterId?: string;
    isActive?: boolean;
  }): Promise<RpgPlayer> {
    return apiRequest('/api/v1/players/upsert', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Partial<RpgPlayer>): Promise<RpgPlayer> {
    return apiRequest(`/api/v1/players/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    await apiRequest(`/api/v1/players/${id}`, { method: 'DELETE' });
  },
};

// ============================================================================
// History
// ============================================================================

export interface RpgHistoryEvent {
  id: string;
  eventType: string;
  eventTitle: string;
  eventDescription?: string | null;
  significance: number;
  inGameTime?: Record<string, unknown> | null;
  sessionId?: string | null;
  worldId?: string | null;
  locationId?: string | null;
  participantIds: string[];
  gmIds: string[];
  characterIds: string[];
  createdAt: string;
}

export const rpgHistory = {
  async findMany(params?: {
    sessionId?: string;
    worldId?: string;
    eventType?: string;
    significance?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ events: RpgHistoryEvent[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params?.sessionId) searchParams.set('sessionId', params.sessionId);
    if (params?.worldId) searchParams.set('worldId', params.worldId);
    if (params?.eventType) searchParams.set('eventType', params.eventType);
    if (params?.significance) searchParams.set('significance', String(params.significance));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));

    return apiRequest(`/api/v1/history?${searchParams}`);
  },

  async create(data: Omit<RpgHistoryEvent, 'id' | 'createdAt'>): Promise<RpgHistoryEvent> {
    return apiRequest('/api/v1/history', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async createBatch(events: Omit<RpgHistoryEvent, 'id' | 'createdAt'>[]): Promise<{ count: number }> {
    return apiRequest('/api/v1/history/batch', {
      method: 'POST',
      body: JSON.stringify(events),
    });
  },
};

// ============================================================================
// Unified Export
// ============================================================================

export const rpgApi = {
  worlds: rpgWorlds,
  creatures: rpgCreatures,
  sessions: rpgSessions,
  campaigns: rpgCampaigns,
  players: rpgPlayers,
  history: rpgHistory,

  // Health check
  async health(): Promise<{ status: string; database: string }> {
    return apiRequest('/health');
  },
};

export default rpgApi;
export { RpgApiError };
