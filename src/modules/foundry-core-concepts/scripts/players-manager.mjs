/**
 * Players Manager
 * Manages RpgPlayer sheets (instances, not cards)
 *
 * Players are sheets that:
 * - Control creatures (characters)
 * - Belong to teams
 * - Have assigned roles
 * - Track player-specific data
 *
 * This is distinct from Role Cards which define permissions.
 * Players are instances that reference role cards.
 */

const MODULE_ID = 'foundry-core-concepts';

export class PlayersManager {
  constructor() {
    this.initialized = false;
    this.players = new Map(); // playerId -> player data
  }

  /**
   * Initialize the players manager
   */
  async initialize() {
    console.log('Players Manager | Initializing...');

    // Load existing players from game settings or journal entries
    await this.loadPlayers();

    // Register hooks
    this.registerHooks();

    this.initialized = true;
    console.log('Players Manager | Ready');
  }

  /**
   * Load existing players
   * Players are stored as journal entries with special flags
   */
  async loadPlayers() {
    const playerJournals = game.journal.filter(j =>
      j.getFlag(MODULE_ID, 'entityType') === 'player'
    );

    for (const journal of playerJournals) {
      const playerData = {
        id: journal.id,
        name: journal.name,
        userId: journal.getFlag(MODULE_ID, 'userId'),
        controlledCreatures: journal.getFlag(MODULE_ID, 'controlledCreatures') || [],
        teams: journal.getFlag(MODULE_ID, 'teams') || [],
        settings: journal.getFlag(MODULE_ID, 'settings') || {}
      };

      this.players.set(journal.id, playerData);
    }

    console.log(`Players Manager | Loaded ${this.players.size} players`);
  }

  /**
   * Create a new player sheet
   */
  async createPlayer(playerData) {
    if (!game.user.isGM) {
      ui.notifications.error('Only GMs can create players');
      return null;
    }

    const journalData = {
      name: playerData.name || 'New Player',
      content: `
        <h2>Player: ${playerData.name}</h2>
        <p>User ID: ${playerData.userId || 'Not assigned'}</p>
        <h3>Controlled Creatures</h3>
        <p>No creatures controlled yet</p>
        <h3>Teams</h3>
        <p>No team memberships yet</p>
      `,
      flags: {
        [MODULE_ID]: {
          entityType: 'player',
          userId: playerData.userId || null,
          controlledCreatures: playerData.controlledCreatures || [],
          teams: playerData.teams || [],
          settings: playerData.settings || {
            theme: 'dark',
            notifications: true
          }
        }
      }
    };

    const journal = await JournalEntry.create(journalData);

    const player = {
      id: journal.id,
      name: journal.name,
      userId: playerData.userId || null,
      controlledCreatures: playerData.controlledCreatures || [],
      teams: playerData.teams || [],
      settings: playerData.settings || {}
    };

    this.players.set(journal.id, player);

    ui.notifications.info(`Created player: ${player.name}`);
    console.log('Players Manager | Created player:', player);

    return player;
  }

  /**
   * Get player by ID
   */
  getPlayer(playerId) {
    return this.players.get(playerId);
  }

  /**
   * Get player by user ID
   */
  getPlayerByUserId(userId) {
    for (const player of this.players.values()) {
      if (player.userId === userId) {
        return player;
      }
    }
    return null;
  }

  /**
   * Get or create player for current user
   */
  async getOrCreatePlayerForUser(userId) {
    let player = this.getPlayerByUserId(userId);

    if (!player) {
      const user = game.users.get(userId);
      player = await this.createPlayer({
        name: user.name,
        userId: userId
      });
    }

    return player;
  }

  /**
   * Assign creature to player
   */
  async assignCreatureToPlayer(playerId, creatureCardId, isPrimary = false) {
    if (!game.user.isGM) {
      ui.notifications.error('Only GMs can assign creatures to players');
      return null;
    }

    const player = this.getPlayer(playerId);
    if (!player) {
      ui.notifications.error('Player not found');
      return null;
    }

    // Add creature if not already controlled
    const alreadyControlled = player.controlledCreatures.some(c => c.creatureId === creatureCardId);
    if (alreadyControlled) {
      ui.notifications.warn('Player already controls this creature');
      return player;
    }

    // If setting as primary, unset other primary creatures
    if (isPrimary) {
      player.controlledCreatures.forEach(c => c.primary = false);
    }

    player.controlledCreatures.push({
      creatureId: creatureCardId,
      primary: isPrimary
    });

    await this.updatePlayer(playerId, {
      controlledCreatures: player.controlledCreatures
    });

    ui.notifications.info(`Assigned creature to ${player.name}`);
    return player;
  }

  /**
   * Remove creature from player
   */
  async removeCreatureFromPlayer(playerId, creatureCardId) {
    if (!game.user.isGM) {
      ui.notifications.error('Only GMs can remove creatures from players');
      return null;
    }

    const player = this.getPlayer(playerId);
    if (!player) {
      ui.notifications.error('Player not found');
      return null;
    }

    player.controlledCreatures = player.controlledCreatures.filter(
      c => c.creatureId !== creatureCardId
    );

    await this.updatePlayer(playerId, {
      controlledCreatures: player.controlledCreatures
    });

    ui.notifications.info(`Removed creature from ${player.name}`);
    return player;
  }

  /**
   * Add player to team
   */
  async addPlayerToTeam(playerId, teamId, role = null) {
    if (!game.user.isGM) {
      ui.notifications.error('Only GMs can add players to teams');
      return null;
    }

    const player = this.getPlayer(playerId);
    if (!player) {
      ui.notifications.error('Player not found');
      return null;
    }

    // Check if already in team
    const alreadyInTeam = player.teams.some(t => t.teamId === teamId);
    if (alreadyInTeam) {
      ui.notifications.warn('Player already in this team');
      return player;
    }

    player.teams.push({
      teamId: teamId,
      role: role
    });

    await this.updatePlayer(playerId, {
      teams: player.teams
    });

    ui.notifications.info(`Added ${player.name} to team`);
    return player;
  }

  /**
   * Remove player from team
   */
  async removePlayerFromTeam(playerId, teamId) {
    if (!game.user.isGM) {
      ui.notifications.error('Only GMs can remove players from teams');
      return null;
    }

    const player = this.getPlayer(playerId);
    if (!player) {
      ui.notifications.error('Player not found');
      return null;
    }

    player.teams = player.teams.filter(t => t.teamId !== teamId);

    await this.updatePlayer(playerId, {
      teams: player.teams
    });

    ui.notifications.info(`Removed ${player.name} from team`);
    return player;
  }

  /**
   * Update player data
   */
  async updatePlayer(playerId, updates) {
    const player = this.getPlayer(playerId);
    if (!player) {
      ui.notifications.error('Player not found');
      return null;
    }

    const journal = game.journal.get(playerId);
    if (!journal) {
      ui.notifications.error('Player journal not found');
      return null;
    }

    // Update player object
    Object.assign(player, updates);

    // Update journal flags
    await journal.setFlag(MODULE_ID, 'controlledCreatures', player.controlledCreatures);
    await journal.setFlag(MODULE_ID, 'teams', player.teams);
    await journal.setFlag(MODULE_ID, 'settings', player.settings);

    // Update journal content
    const content = `
      <h2>Player: ${player.name}</h2>
      <p>User ID: ${player.userId || 'Not assigned'}</p>

      <h3>Controlled Creatures</h3>
      ${player.controlledCreatures.length > 0 ? `
        <ul>
          ${player.controlledCreatures.map(c => `
            <li>${c.creatureId}${c.primary ? ' (Primary)' : ''}</li>
          `).join('')}
        </ul>
      ` : '<p>No creatures controlled</p>'}

      <h3>Teams</h3>
      ${player.teams.length > 0 ? `
        <ul>
          ${player.teams.map(t => `
            <li>Team ${t.teamId}${t.role ? ` (${t.role})` : ''}</li>
          `).join('')}
        </ul>
      ` : '<p>No team memberships</p>'}
    `;

    await journal.update({ content });

    this.players.set(playerId, player);

    console.log('Players Manager | Updated player:', player);
    return player;
  }

  /**
   * Delete player
   */
  async deletePlayer(playerId) {
    if (!game.user.isGM) {
      ui.notifications.error('Only GMs can delete players');
      return false;
    }

    const player = this.getPlayer(playerId);
    if (!player) {
      ui.notifications.error('Player not found');
      return false;
    }

    const journal = game.journal.get(playerId);
    if (journal) {
      await journal.delete();
    }

    this.players.delete(playerId);

    ui.notifications.info(`Deleted player: ${player.name}`);
    console.log('Players Manager | Deleted player:', playerId);

    return true;
  }

  /**
   * Get all players
   */
  getAllPlayers() {
    return Array.from(this.players.values());
  }

  /**
   * Register hooks
   */
  registerHooks() {
    // Hook for when a user joins
    Hooks.on('userConnected', async (user, connected) => {
      if (connected && game.user.isGM) {
        await this.getOrCreatePlayerForUser(user.id);
      }
    });

    // Hook for journal entry deletion
    Hooks.on('deleteJournalEntry', (journal, options, userId) => {
      const entityType = journal.getFlag(MODULE_ID, 'entityType');
      if (entityType === 'player') {
        this.players.delete(journal.id);
        console.log('Players Manager | Player deleted:', journal.id);
      }
    });
  }

  /**
   * Cleanup
   */
  async cleanup() {
    this.players.clear();
    this.initialized = false;
  }
}
