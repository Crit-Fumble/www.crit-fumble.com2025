/**
 * Foundry VTT API Client
 * Wrapper for interacting with Foundry via the foundry-api-control module
 */

import axios, { AxiosInstance } from 'axios';

export interface FoundryDocument {
  id: string;
  name: string;
  type: string;
  data: any;
  img?: string;
  flags?: Record<string, any>;
  folder?: string | null;
}

export interface FoundryActor extends FoundryDocument {
  data: {
    abilities?: Record<string, any>;
    attributes?: Record<string, any>;
    details?: Record<string, any>;
    traits?: Record<string, any>;
  };
}

export interface FoundryItem extends FoundryDocument {
  data: {
    description?: string;
    quantity?: number;
    weight?: number;
    price?: number;
  };
}

export interface FoundryScene extends FoundryDocument {
  data: {
    width: number;
    height: number;
    background?: string;
    grid?: {
      size: number;
      type: number;
    };
  };
}

export interface FoundryCombat extends FoundryDocument {
  data: {
    round: number;
    turn: number;
    combatants: any[];
    active: boolean;
  };
}

export interface FoundryWorldInfo {
  id: string;
  title: string;
  system: string;
  systemVersion: string;
  foundryVersion: string;
}

/**
 * Foundry API Client
 */
export class FoundryAPIClient {
  private axios: AxiosInstance;

  constructor(baseURL: string, authToken: string) {
    this.axios = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
  }

  /**
   * Health check
   */
  async health(): Promise<{ status: string; foundry: any }> {
    const response = await this.axios.get('/health');
    return response.data;
  }

  /**
   * Get world info
   */
  async getWorld(): Promise<FoundryWorldInfo> {
    const response = await this.axios.get('/world');
    return response.data;
  }

  // =========================================================================
  // ACTORS
  // =========================================================================

  /**
   * Get all actors
   */
  async getActors(): Promise<FoundryActor[]> {
    const response = await this.axios.get('/actors');
    return response.data.actors;
  }

  /**
   * Get actor by ID
   */
  async getActor(id: string): Promise<FoundryActor> {
    const response = await this.axios.get(`/actors/${id}`);
    return response.data;
  }

  /**
   * Create a new actor
   */
  async createActor(data: Partial<FoundryActor>): Promise<FoundryActor> {
    const response = await this.axios.post('/actors', data);
    return response.data;
  }

  /**
   * Update an actor
   */
  async updateActor(id: string, updates: Partial<FoundryActor>): Promise<FoundryActor> {
    const response = await this.axios.patch(`/actors/${id}`, updates);
    return response.data;
  }

  /**
   * Delete an actor
   */
  async deleteActor(id: string): Promise<void> {
    await this.axios.delete(`/actors/${id}`);
  }

  // =========================================================================
  // ITEMS
  // =========================================================================

  /**
   * Get all items
   */
  async getItems(): Promise<FoundryItem[]> {
    const response = await this.axios.get('/items');
    return response.data.items;
  }

  /**
   * Get item by ID
   */
  async getItem(id: string): Promise<FoundryItem> {
    const response = await this.axios.get(`/items/${id}`);
    return response.data;
  }

  /**
   * Create a new item
   */
  async createItem(data: Partial<FoundryItem>): Promise<FoundryItem> {
    const response = await this.axios.post('/items', data);
    return response.data;
  }

  // =========================================================================
  // SCENES
  // =========================================================================

  /**
   * Get all scenes
   */
  async getScenes(): Promise<FoundryScene[]> {
    const response = await this.axios.get('/scenes');
    return response.data.scenes;
  }

  /**
   * Get scene by ID
   */
  async getScene(id: string): Promise<FoundryScene> {
    const response = await this.axios.get(`/scenes/${id}`);
    return response.data;
  }

  /**
   * Activate a scene
   */
  async activateScene(id: string): Promise<FoundryScene> {
    const response = await this.axios.post(`/scenes/${id}/activate`);
    return response.data.scene;
  }

  // =========================================================================
  // CHAT
  // =========================================================================

  /**
   * Send a chat message
   */
  async sendChatMessage(message: {
    content: string;
    speaker?: any;
    whisper?: string[];
    type?: number;
  }): Promise<FoundryDocument> {
    const response = await this.axios.post('/chat', message);
    return response.data;
  }

  // =========================================================================
  // COMBAT
  // =========================================================================

  /**
   * Get all combats
   */
  async getCombats(): Promise<FoundryCombat[]> {
    const response = await this.axios.get('/combats');
    return response.data.combats;
  }

  /**
   * Get combat by ID
   */
  async getCombat(id: string): Promise<FoundryCombat> {
    const response = await this.axios.get(`/combats/${id}`);
    return response.data;
  }

  /**
   * Start combat
   */
  async startCombat(id: string): Promise<FoundryCombat> {
    const response = await this.axios.post(`/combats/${id}/start`);
    return response.data;
  }

  /**
   * Advance to next turn
   */
  async nextTurn(id: string): Promise<FoundryCombat> {
    const response = await this.axios.post(`/combats/${id}/next`);
    return response.data;
  }

  // =========================================================================
  // COMPENDIA
  // =========================================================================

  /**
   * Get all compendium packs
   */
  async getCompendia(): Promise<any[]> {
    const response = await this.axios.get('/compendia');
    return response.data.packs;
  }

  /**
   * Get compendium contents
   */
  async getCompendium(id: string): Promise<{ id: string; documents: FoundryDocument[] }> {
    const response = await this.axios.get(`/compendia/${id}`);
    return response.data;
  }

  // =========================================================================
  // USERS
  // =========================================================================

  /**
   * Get all users
   */
  async getUsers(): Promise<any[]> {
    const response = await this.axios.get('/users');
    return response.data.users;
  }

  // =========================================================================
  // ADVANCED
  // =========================================================================

  /**
   * Execute a macro/script
   */
  async executeMacro(script: string): Promise<any> {
    const response = await this.axios.post('/macros/execute', { script });
    return response.data.result;
  }

  /**
   * Query documents
   */
  async query(collection: string, filter?: Record<string, any>): Promise<FoundryDocument[]> {
    const response = await this.axios.post('/query', { collection, filter });
    return response.data.documents;
  }
}

/**
 * Create a Foundry API client
 */
export function createFoundryClient(baseURL: string, authToken: string): FoundryAPIClient {
  return new FoundryAPIClient(baseURL, authToken);
}
