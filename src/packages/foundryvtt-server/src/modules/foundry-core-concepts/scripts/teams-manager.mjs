/**
 * Teams Manager
 * Manages RpgTeam sheets (instances, not cards)
 *
 * Teams are sheets that:
 * - Have members (creatures with roles)
 * - Own entities (creatures, things, locations)
 * - Track team resources (treasury, reputation)
 * - Define team structure
 *
 * Examples:
 * - Ship crew
 * - Adventuring party
 * - Guild
 * - Military unit
 * - Organization
 */

const MODULE_ID = 'foundry-core-concepts';

export class TeamsManager {
  constructor() {
    this.initialized = false;
    this.teams = new Map(); // teamId -> team data
  }

  /**
   * Initialize the teams manager
   */
  async initialize() {
    console.log('Teams Manager | Initializing...');

    // Load existing teams from journal entries
    await this.loadTeams();

    // Register hooks
    this.registerHooks();

    this.initialized = true;
    console.log('Teams Manager | Ready');
  }

  /**
   * Load existing teams
   * Teams are stored as journal entries with special flags
   */
  async loadTeams() {
    const teamJournals = game.journal.filter(j =>
      j.getFlag(MODULE_ID, 'entityType') === 'team'
    );

    for (const journal of teamJournals) {
      const teamData = {
        id: journal.id,
        name: journal.name,
        type: journal.getFlag(MODULE_ID, 'teamType') || 'party',
        members: journal.getFlag(MODULE_ID, 'members') || [],
        ownedCreatures: journal.getFlag(MODULE_ID, 'ownedCreatures') || [],
        ownedThings: journal.getFlag(MODULE_ID, 'ownedThings') || [],
        ownedLocations: journal.getFlag(MODULE_ID, 'ownedLocations') || [],
        treasury: journal.getFlag(MODULE_ID, 'treasury') || 0,
        reputation: journal.getFlag(MODULE_ID, 'reputation') || 0,
        flags: journal.getFlag(MODULE_ID, 'teamFlags') || {}
      };

      this.teams.set(journal.id, teamData);
    }

    console.log(`Teams Manager | Loaded ${this.teams.size} teams`);
  }

  /**
   * Create a new team sheet
   */
  async createTeam(teamData) {
    if (!game.user.isGM) {
      ui.notifications.error('Only GMs can create teams');
      return null;
    }

    const journalData = {
      name: teamData.name || 'New Team',
      content: `
        <h2>Team: ${teamData.name}</h2>
        <p>Type: ${teamData.type || 'party'}</p>

        <h3>Members</h3>
        <p>No members yet</p>

        <h3>Owned Entities</h3>
        <p>No owned entities yet</p>

        <h3>Resources</h3>
        <p>Treasury: 0</p>
        <p>Reputation: 0</p>
      `,
      flags: {
        [MODULE_ID]: {
          entityType: 'team',
          teamType: teamData.type || 'party',
          members: teamData.members || [],
          ownedCreatures: teamData.ownedCreatures || [],
          ownedThings: teamData.ownedThings || [],
          ownedLocations: teamData.ownedLocations || [],
          treasury: teamData.treasury || 0,
          reputation: teamData.reputation || 0,
          teamFlags: teamData.flags || {}
        }
      }
    };

    const journal = await JournalEntry.create(journalData);

    const team = {
      id: journal.id,
      name: journal.name,
      type: teamData.type || 'party',
      members: teamData.members || [],
      ownedCreatures: teamData.ownedCreatures || [],
      ownedThings: teamData.ownedThings || [],
      ownedLocations: teamData.ownedLocations || [],
      treasury: teamData.treasury || 0,
      reputation: teamData.reputation || 0,
      flags: teamData.flags || {}
    };

    this.teams.set(journal.id, team);

    ui.notifications.info(`Created team: ${team.name}`);
    console.log('Teams Manager | Created team:', team);

    return team;
  }

  /**
   * Get team by ID
   */
  getTeam(teamId) {
    return this.teams.get(teamId);
  }

  /**
   * Add member to team
   */
  async addMember(teamId, creatureId, roleId = null) {
    if (!game.user.isGM) {
      ui.notifications.error('Only GMs can add team members');
      return null;
    }

    const team = this.getTeam(teamId);
    if (!team) {
      ui.notifications.error('Team not found');
      return null;
    }

    // Check if already a member
    const alreadyMember = team.members.some(m => m.creatureId === creatureId);
    if (alreadyMember) {
      ui.notifications.warn('Creature is already a team member');
      return team;
    }

    team.members.push({
      creatureId: creatureId,
      roleId: roleId
    });

    await this.updateTeam(teamId, {
      members: team.members
    });

    ui.notifications.info(`Added member to ${team.name}`);
    return team;
  }

  /**
   * Remove member from team
   */
  async removeMember(teamId, creatureId) {
    if (!game.user.isGM) {
      ui.notifications.error('Only GMs can remove team members');
      return null;
    }

    const team = this.getTeam(teamId);
    if (!team) {
      ui.notifications.error('Team not found');
      return null;
    }

    team.members = team.members.filter(m => m.creatureId !== creatureId);

    await this.updateTeam(teamId, {
      members: team.members
    });

    ui.notifications.info(`Removed member from ${team.name}`);
    return team;
  }

  /**
   * Add owned creature to team
   */
  async addOwnedCreature(teamId, creatureId) {
    return await this.addOwnedEntity(teamId, 'ownedCreatures', creatureId);
  }

  /**
   * Add owned thing to team
   */
  async addOwnedThing(teamId, thingId) {
    return await this.addOwnedEntity(teamId, 'ownedThings', thingId);
  }

  /**
   * Add owned location to team
   */
  async addOwnedLocation(teamId, locationId) {
    return await this.addOwnedEntity(teamId, 'ownedLocations', locationId);
  }

  /**
   * Generic add owned entity
   */
  async addOwnedEntity(teamId, entityType, entityId) {
    if (!game.user.isGM) {
      ui.notifications.error('Only GMs can add owned entities');
      return null;
    }

    const team = this.getTeam(teamId);
    if (!team) {
      ui.notifications.error('Team not found');
      return null;
    }

    if (!team[entityType].includes(entityId)) {
      team[entityType].push(entityId);

      const updates = {};
      updates[entityType] = team[entityType];
      await this.updateTeam(teamId, updates);

      ui.notifications.info(`Added owned entity to ${team.name}`);
    }

    return team;
  }

  /**
   * Remove owned entity from team
   */
  async removeOwnedEntity(teamId, entityType, entityId) {
    if (!game.user.isGM) {
      ui.notifications.error('Only GMs can remove owned entities');
      return null;
    }

    const team = this.getTeam(teamId);
    if (!team) {
      ui.notifications.error('Team not found');
      return null;
    }

    team[entityType] = team[entityType].filter(id => id !== entityId);

    const updates = {};
    updates[entityType] = team[entityType];
    await this.updateTeam(teamId, updates);

    ui.notifications.info(`Removed owned entity from ${team.name}`);
    return team;
  }

  /**
   * Update team treasury
   */
  async updateTreasury(teamId, amount) {
    if (!game.user.isGM) {
      ui.notifications.error('Only GMs can update treasury');
      return null;
    }

    const team = this.getTeam(teamId);
    if (!team) {
      ui.notifications.error('Team not found');
      return null;
    }

    team.treasury = Math.max(0, team.treasury + amount);

    await this.updateTeam(teamId, {
      treasury: team.treasury
    });

    ui.notifications.info(`Updated ${team.name} treasury: ${amount >= 0 ? '+' : ''}${amount}`);
    return team;
  }

  /**
   * Update team reputation
   */
  async updateReputation(teamId, amount) {
    if (!game.user.isGM) {
      ui.notifications.error('Only GMs can update reputation');
      return null;
    }

    const team = this.getTeam(teamId);
    if (!team) {
      ui.notifications.error('Team not found');
      return null;
    }

    team.reputation = Math.max(0, Math.min(100, team.reputation + amount));

    await this.updateTeam(teamId, {
      reputation: team.reputation
    });

    ui.notifications.info(`Updated ${team.name} reputation: ${amount >= 0 ? '+' : ''}${amount}`);
    return team;
  }

  /**
   * Update team data
   */
  async updateTeam(teamId, updates) {
    const team = this.getTeam(teamId);
    if (!team) {
      ui.notifications.error('Team not found');
      return null;
    }

    const journal = game.journal.get(teamId);
    if (!journal) {
      ui.notifications.error('Team journal not found');
      return null;
    }

    // Update team object
    Object.assign(team, updates);

    // Update journal flags
    await journal.setFlag(MODULE_ID, 'teamType', team.type);
    await journal.setFlag(MODULE_ID, 'members', team.members);
    await journal.setFlag(MODULE_ID, 'ownedCreatures', team.ownedCreatures);
    await journal.setFlag(MODULE_ID, 'ownedThings', team.ownedThings);
    await journal.setFlag(MODULE_ID, 'ownedLocations', team.ownedLocations);
    await journal.setFlag(MODULE_ID, 'treasury', team.treasury);
    await journal.setFlag(MODULE_ID, 'reputation', team.reputation);
    await journal.setFlag(MODULE_ID, 'teamFlags', team.flags);

    // Update journal content
    const content = `
      <h2>Team: ${team.name}</h2>
      <p>Type: ${team.type}</p>

      <h3>Members (${team.members.length})</h3>
      ${team.members.length > 0 ? `
        <ul>
          ${team.members.map(m => `
            <li>Creature ${m.creatureId}${m.roleId ? ` (Role ${m.roleId})` : ''}</li>
          `).join('')}
        </ul>
      ` : '<p>No members</p>'}

      <h3>Owned Entities</h3>
      <p>Creatures: ${team.ownedCreatures.length}</p>
      <p>Things: ${team.ownedThings.length}</p>
      <p>Locations: ${team.ownedLocations.length}</p>

      <h3>Resources</h3>
      <p>Treasury: ${team.treasury}</p>
      <p>Reputation: ${team.reputation}/100</p>
    `;

    await journal.update({ content });

    this.teams.set(teamId, team);

    console.log('Teams Manager | Updated team:', team);
    return team;
  }

  /**
   * Delete team
   */
  async deleteTeam(teamId) {
    if (!game.user.isGM) {
      ui.notifications.error('Only GMs can delete teams');
      return false;
    }

    const team = this.getTeam(teamId);
    if (!team) {
      ui.notifications.error('Team not found');
      return false;
    }

    const journal = game.journal.get(teamId);
    if (journal) {
      await journal.delete();
    }

    this.teams.delete(teamId);

    ui.notifications.info(`Deleted team: ${team.name}`);
    console.log('Teams Manager | Deleted team:', teamId);

    return true;
  }

  /**
   * Get all teams
   */
  getAllTeams() {
    return Array.from(this.teams.values());
  }

  /**
   * Get teams by type
   */
  getTeamsByType(type) {
    return this.getAllTeams().filter(t => t.type === type);
  }

  /**
   * Register hooks
   */
  registerHooks() {
    // Hook for journal entry deletion
    Hooks.on('deleteJournalEntry', (journal, options, userId) => {
      const entityType = journal.getFlag(MODULE_ID, 'entityType');
      if (entityType === 'team') {
        this.teams.delete(journal.id);
        console.log('Teams Manager | Team deleted:', journal.id);
      }
    });
  }

  /**
   * Cleanup
   */
  async cleanup() {
    this.teams.clear();
    this.initialized = false;
  }
}
