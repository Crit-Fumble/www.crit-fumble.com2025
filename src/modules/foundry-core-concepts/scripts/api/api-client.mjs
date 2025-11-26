/**
 * API Client for External Core Concepts API
 * Provides helper methods for communicating with custom API implementations
 */

export class APIClient {
  constructor(baseURL, authToken = null) {
    this.baseURL = baseURL;
    this.authToken = authToken;
  }

  /**
   * Set authentication token
   */
  setAuthToken(token) {
    this.authToken = token;
  }

  /**
   * Make authenticated request to external API
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    // Add auth token if available
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`[API Client] Request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // ============================================================================
  // Core Concepts API Methods
  // ============================================================================

  // Attributes
  async getAttributes(entityType, entityId) {
    return this.request(`/attributes?entityType=${entityType}&entityId=${entityId}`);
  }

  async updateAttributes(entityType, entityId, attributes) {
    return this.request('/attributes', {
      method: 'POST',
      body: JSON.stringify({ entityType, entityId, attributes })
    });
  }

  // Types
  async getTypes(category = null, limit = 50) {
    const params = new URLSearchParams({ limit });
    if (category) params.set('category', category);
    return this.request(`/types?${params}`);
  }

  async createType(typeData) {
    return this.request('/types', {
      method: 'POST',
      body: JSON.stringify(typeData)
    });
  }

  // Dice
  async getDiceRolls(sessionId = null, playerId = null, limit = 100) {
    const params = new URLSearchParams({ limit });
    if (sessionId) params.set('sessionId', sessionId);
    if (playerId) params.set('playerId', playerId);
    return this.request(`/dice?${params}`);
  }

  async rollDice(notation, playerId = null, sessionId = null, purpose = null) {
    return this.request('/dice', {
      method: 'POST',
      body: JSON.stringify({ notation, playerId, sessionId, purpose })
    });
  }

  // Tables
  async getTables(category = null, worldId = null, limit = 50) {
    const params = new URLSearchParams({ limit });
    if (category) params.set('category', category);
    if (worldId) params.set('worldId', worldId);
    return this.request(`/tables?${params}`);
  }

  async createTable(tableData) {
    return this.request('/tables', {
      method: 'POST',
      body: JSON.stringify(tableData)
    });
  }

  // Books
  async getBooks(category = null, systemName = null, limit = 50) {
    const params = new URLSearchParams({ limit });
    if (category) params.set('category', category);
    if (systemName) params.set('systemName', systemName);
    return this.request(`/books?${params}`);
  }

  async createBook(bookData) {
    return this.request('/books', {
      method: 'POST',
      body: JSON.stringify(bookData)
    });
  }

  // Cards
  async getCards(cardType = null, deckId = null, limit = 100) {
    const params = new URLSearchParams({ limit });
    if (cardType) params.set('cardType', cardType);
    if (deckId) params.set('deckId', deckId);
    return this.request(`/cards?${params}`);
  }

  async createCard(cardData) {
    return this.request('/cards', {
      method: 'POST',
      body: JSON.stringify(cardData)
    });
  }

  // Hands
  async getHand(playerId, sessionId = null) {
    const params = new URLSearchParams({ playerId });
    if (sessionId) params.set('sessionId', sessionId);
    return this.request(`/hands?${params}`);
  }

  async addCardToHand(playerId, cardId, sessionId = null) {
    return this.request('/hands', {
      method: 'POST',
      body: JSON.stringify({ playerId, cardId, sessionId })
    });
  }

  // Decks
  async getDecks(deckType = null, sessionId = null, limit = 50) {
    const params = new URLSearchParams({ limit });
    if (deckType) params.set('deckType', deckType);
    if (sessionId) params.set('sessionId', sessionId);
    return this.request(`/decks?${params}`);
  }

  async createDeck(deckData) {
    return this.request('/decks', {
      method: 'POST',
      body: JSON.stringify(deckData)
    });
  }

  // Voxels
  async getVoxels(boardId = null, locationId = null) {
    const params = new URLSearchParams();
    if (boardId) params.set('boardId', boardId);
    if (locationId) params.set('locationId', locationId);
    return this.request(`/voxels?${params}`);
  }

  async updateVoxels(boardId, voxelData) {
    return this.request('/voxels', {
      method: 'POST',
      body: JSON.stringify({ boardId, voxelData })
    });
  }

  // Rules
  async getRules(category = null, systemName = null, limit = 100) {
    const params = new URLSearchParams({ limit });
    if (category) params.set('category', category);
    if (systemName) params.set('systemName', systemName);
    return this.request(`/rules?${params}`);
  }

  async createRule(ruleData) {
    return this.request('/rules', {
      method: 'POST',
      body: JSON.stringify(ruleData)
    });
  }

  // Events
  async getEvents(sessionId = null, eventType = null, limit = 100) {
    const params = new URLSearchParams({ limit });
    if (sessionId) params.set('sessionId', sessionId);
    if (eventType) params.set('eventType', eventType);
    return this.request(`/events?${params}`);
  }

  async logEvent(eventData) {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(eventData)
    });
  }

  // Goals
  async getGoals(sessionId = null, campaignId = null, status = null, limit = 50) {
    const params = new URLSearchParams({ limit });
    if (sessionId) params.set('sessionId', sessionId);
    if (campaignId) params.set('campaignId', campaignId);
    if (status) params.set('status', status);
    return this.request(`/goals?${params}`);
  }

  async createGoal(goalData) {
    return this.request('/goals', {
      method: 'POST',
      body: JSON.stringify(goalData)
    });
  }

  // Modes
  async getModes(systemName = null) {
    const params = new URLSearchParams();
    if (systemName) params.set('systemName', systemName);
    return this.request(`/modes?${params}`);
  }

  async setMode(sessionId, modeId) {
    return this.request('/modes', {
      method: 'POST',
      body: JSON.stringify({ sessionId, modeId })
    });
  }

  // Systems
  async getSystems(category = null, isActive = null) {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (isActive !== null) params.set('isActive', String(isActive));
    return this.request(`/systems?${params}`);
  }

  async updateSystem(systemId, isActive = null, configuration = null) {
    return this.request('/systems', {
      method: 'POST',
      body: JSON.stringify({ systemId, isActive, configuration })
    });
  }

  // Creatures
  async getCreatures(creatureType = null, worldId = null, sessionId = null, limit = 50) {
    const params = new URLSearchParams({ limit });
    if (creatureType) params.set('creatureType', creatureType);
    if (worldId) params.set('worldId', worldId);
    if (sessionId) params.set('sessionId', sessionId);
    return this.request(`/creatures?${params}`);
  }

  async createCreature(creatureData) {
    return this.request('/creatures', {
      method: 'POST',
      body: JSON.stringify(creatureData)
    });
  }

  // Locations
  async getLocations(locationType = null, worldId = null, parentLocationId = null, limit = 50) {
    const params = new URLSearchParams({ limit });
    if (locationType) params.set('locationType', locationType);
    if (worldId) params.set('worldId', worldId);
    if (parentLocationId) params.set('parentLocationId', parentLocationId);
    return this.request(`/locations?${params}`);
  }

  async createLocation(locationData) {
    return this.request('/locations', {
      method: 'POST',
      body: JSON.stringify(locationData)
    });
  }

  // Objects
  async getObjects(objectType = null, locationId = null, boardId = null, limit = 100) {
    const params = new URLSearchParams({ limit });
    if (objectType) params.set('objectType', objectType);
    if (locationId) params.set('locationId', locationId);
    if (boardId) params.set('boardId', boardId);
    return this.request(`/objects?${params}`);
  }

  async createObject(objectData) {
    return this.request('/objects', {
      method: 'POST',
      body: JSON.stringify(objectData)
    });
  }

  // Boards
  async getBoards(worldId = null, ownerId = null, limit = 50) {
    const params = new URLSearchParams({ limit });
    if (worldId) params.set('worldId', worldId);
    if (ownerId) params.set('ownerId', ownerId);
    return this.request(`/boards?${params}`);
  }

  async createBoard(boardData) {
    return this.request('/boards', {
      method: 'POST',
      body: JSON.stringify(boardData)
    });
  }

  // Tiles
  async getTiles(boardId = null, sheetId = null, limit = 100) {
    const params = new URLSearchParams({ limit });
    if (boardId) params.set('boardId', boardId);
    if (sheetId) params.set('sheetId', sheetId);
    return this.request(`/tiles?${params}`);
  }

  async createTile(tileData) {
    return this.request('/tiles', {
      method: 'POST',
      body: JSON.stringify(tileData)
    });
  }

  // Sessions
  async getSessions(limit = 50) {
    return this.request(`/sessions?limit=${limit}`);
  }

  async createSession(sessionData) {
    return this.request('/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData)
    });
  }

  // History
  async getHistory(sessionId = null, eventType = null, limit = 100) {
    const params = new URLSearchParams({ limit });
    if (sessionId) params.set('sessionId', sessionId);
    if (eventType) params.set('eventType', eventType);
    return this.request(`/history?${params}`);
  }

  async createHistoryEvent(eventData) {
    return this.request('/history', {
      method: 'POST',
      body: JSON.stringify(eventData)
    });
  }
}

export default APIClient;
