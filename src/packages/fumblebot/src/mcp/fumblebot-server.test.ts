/**
 * FumbleBot MCP Server Tests
 * Tests for MCP server tools with mocked dependencies
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FumbleBotMCPServer } from './fumblebot-server.js';
import type { PrismaClient } from '@prisma/client';

// Mock dependencies
vi.mock('../foundry/client.js');
vi.mock('../foundry/screenshot.js');
vi.mock('../ai/service.js');
vi.mock('../core-concepts/client.js');

// Import mocked modules
import { FoundryClient } from '../foundry/client.js';
import { getScreenshotService } from '../foundry/screenshot.js';
import { AIService } from '../ai/service.js';
import { CoreConceptsClient } from '../core-concepts/client.js';

describe('FumbleBotMCPServer', () => {
  let server: FumbleBotMCPServer;
  let mockPrisma: Partial<PrismaClient>;
  let mockAIService: any;
  let mockCoreConceptsClient: any;
  let mockFoundryClient: any;
  let mockScreenshotService: any;

  beforeEach(() => {
    // Mock Prisma
    mockPrisma = {};

    // Mock AI Service
    mockAIService = {
      isProviderAvailable: vi.fn(),
      chat: vi.fn(),
      dmResponse: vi.fn(),
      lookupRule: vi.fn(),
      generate: vi.fn(),
      generateDungeon: vi.fn(),
      generateEncounter: vi.fn(),
      generateNPC: vi.fn(),
      generateLore: vi.fn(),
    };
    vi.mocked(AIService.getInstance).mockReturnValue(mockAIService);

    // Mock Core Concepts Client
    mockCoreConceptsClient = {
      getRpgSystems: vi.fn(),
      getCoreSystems: vi.fn(),
      getRpgSystemBySystemId: vi.fn(),
      searchCreatures: vi.fn(),
      getCreature: vi.fn(),
      searchLocations: vi.fn(),
      getLocation: vi.fn(),
      getSystemAttributes: vi.fn(),
    };
    vi.mocked(CoreConceptsClient).mockImplementation(() => mockCoreConceptsClient);

    // Mock Foundry Client
    mockFoundryClient = {
      healthCheck: vi.fn(),
    };
    vi.mocked(FoundryClient).mockImplementation(() => mockFoundryClient);

    // Mock Screenshot Service
    mockScreenshotService = {
      captureScreenshot: vi.fn(),
      captureCanvas: vi.fn(),
    };
    vi.mocked(getScreenshotService).mockReturnValue(mockScreenshotService);

    // Create server instance
    server = new FumbleBotMCPServer(mockPrisma as PrismaClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Anthropic Tools', () => {
    describe('anthropic_chat', () => {
      it('should call AIService.chat with correct parameters', async () => {
        mockAIService.isProviderAvailable.mockReturnValue(true);
        mockAIService.chat.mockResolvedValue({
          content: 'Hello from Claude!',
          provider: 'anthropic',
          model: 'claude-sonnet-4',
          usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        });

        const result = await (server as any).anthropicChat({
          prompt: 'Hello',
          model: 'sonnet',
          systemPrompt: 'You are helpful',
          temperature: 0.7,
          maxTokens: 2048,
        });

        expect(mockAIService.isProviderAvailable).toHaveBeenCalledWith('anthropic');
        expect(mockAIService.chat).toHaveBeenCalledWith(
          [{ role: 'user', content: 'Hello' }],
          'You are helpful',
          { temperature: 0.7, maxTokens: 2048 }
        );

        expect(result.content[0].text).toBe('Hello from Claude!');
      });

      it('should throw error when Anthropic not configured', async () => {
        mockAIService.isProviderAvailable.mockReturnValue(false);

        await expect((server as any).anthropicChat({ prompt: 'Hello' })).rejects.toThrow(
          'Anthropic not configured'
        );
      });
    });

    describe('anthropic_dm_response', () => {
      it('should generate DM response', async () => {
        mockAIService.isProviderAvailable.mockReturnValue(true);
        mockAIService.dmResponse.mockResolvedValue(
          'The dragon roars and spreads its massive wings!'
        );

        const result = await (server as any).anthropicDMResponse({
          scenario: 'Players encounter a dragon',
          system: 'D&D 5e',
          tone: 'dramatic',
        });

        expect(mockAIService.dmResponse).toHaveBeenCalledWith(
          'Players encounter a dragon',
          'D&D 5e',
          'dramatic'
        );

        expect(result.content[0].text).toContain('dragon');
      });
    });

    describe('anthropic_lookup_rule', () => {
      it('should lookup rules using Claude', async () => {
        mockAIService.isProviderAvailable.mockReturnValue(true);
        mockAIService.lookupRule.mockResolvedValue(
          'Advantage allows you to roll two d20s and take the higher result.'
        );

        const result = await (server as any).anthropicLookupRule({
          query: 'How does advantage work?',
          system: 'D&D 5e',
        });

        expect(mockAIService.lookupRule).toHaveBeenCalledWith(
          'How does advantage work?',
          'D&D 5e'
        );

        expect(result.content[0].text).toContain('Advantage');
      });
    });
  });

  describe('OpenAI Tools', () => {
    describe('openai_chat', () => {
      it('should call AIService.generate', async () => {
        mockAIService.isProviderAvailable.mockReturnValue(true);
        mockAIService.generate.mockResolvedValue({
          content: 'Response from GPT-4o',
          provider: 'openai',
          model: 'gpt-4o',
          usage: { promptTokens: 15, completionTokens: 25, totalTokens: 40 },
        });

        const result = await (server as any).openAIGenerate({
          prompt: 'Generate a story',
          systemPrompt: 'You are creative',
          temperature: 0.8,
          maxTokens: 1000,
        });

        expect(mockAIService.generate).toHaveBeenCalledWith('Generate a story', 'You are creative', {
          temperature: 0.8,
          maxTokens: 1000,
        });

        expect(result.content[0].text).toBe('Response from GPT-4o');
      });
    });

    describe('openai_generate_dungeon', () => {
      it('should generate dungeon with structured output', async () => {
        mockAIService.isProviderAvailable.mockReturnValue(true);
        mockAIService.generateDungeon.mockResolvedValue({
          name: 'Crypt of Shadows',
          description: 'An ancient undead lair',
          rooms: [{ id: 1, name: 'Entrance Hall', description: 'Dark corridor' }],
          totalCR: 10,
        });

        const result = await (server as any).openAIGenerateDungeon({
          theme: 'undead crypt',
          size: 'medium',
          level: 5,
        });

        expect(mockAIService.generateDungeon).toHaveBeenCalledWith({
          theme: 'undead crypt',
          size: 'medium',
          level: 5,
          style: undefined,
        });

        const dungeon = JSON.parse(result.content[0].text);
        expect(dungeon.name).toBe('Crypt of Shadows');
      });
    });

    describe('openai_generate_encounter', () => {
      it('should generate combat encounter', async () => {
        mockAIService.isProviderAvailable.mockReturnValue(true);
        mockAIService.generateEncounter.mockResolvedValue({
          name: 'Goblin Ambush',
          enemies: [{ name: 'Goblin', count: 4, cr: '1/4' }],
          adjustedXP: 200,
        });

        const result = await (server as any).openAIGenerateEncounter({
          type: 'combat',
          difficulty: 'medium',
          partyLevel: 3,
          partySize: 4,
        });

        expect(mockAIService.generateEncounter).toHaveBeenCalledWith({
          type: 'combat',
          difficulty: 'medium',
          partyLevel: 3,
          partySize: 4,
          environment: undefined,
        });

        const encounter = JSON.parse(result.content[0].text);
        expect(encounter.name).toBe('Goblin Ambush');
      });
    });
  });

  describe('Core Concepts Tools', () => {
    describe('rpg_list_systems', () => {
      it('should list all systems', async () => {
        const mockSystems = [
          { id: '1', systemId: 'dnd5e', name: 'D&D 5e', isCore: true },
          { id: '2', systemId: 'pf2e', name: 'Pathfinder 2e', isCore: true },
        ];

        mockCoreConceptsClient.getRpgSystems.mockResolvedValue(mockSystems);

        const result = await (server as any).listRpgSystems({ coreOnly: false });

        expect(mockCoreConceptsClient.getRpgSystems).toHaveBeenCalled();

        const systems = JSON.parse(result.content[0].text);
        expect(systems).toHaveLength(2);
        expect(systems[0].systemId).toBe('dnd5e');
      });

      it('should list only core systems when coreOnly=true', async () => {
        const mockSystems = [{ id: '1', systemId: 'dnd5e', name: 'D&D 5e', isCore: true }];

        mockCoreConceptsClient.getCoreSystems.mockResolvedValue(mockSystems);

        const result = await (server as any).listRpgSystems({ coreOnly: true });

        expect(mockCoreConceptsClient.getCoreSystems).toHaveBeenCalled();
        expect(mockCoreConceptsClient.getRpgSystems).not.toHaveBeenCalled();
      });
    });

    describe('rpg_get_system', () => {
      it('should get system by systemId', async () => {
        const mockSystem = {
          id: '1',
          systemId: 'dnd5e',
          name: 'D&D 5e',
          title: 'Dungeons & Dragons 5th Edition',
        };

        mockCoreConceptsClient.getRpgSystemBySystemId.mockResolvedValue(mockSystem);

        const result = await (server as any).getRpgSystem({ systemId: 'dnd5e' });

        expect(mockCoreConceptsClient.getRpgSystemBySystemId).toHaveBeenCalledWith('dnd5e');

        const system = JSON.parse(result.content[0].text);
        expect(system.systemId).toBe('dnd5e');
      });

      it('should throw error when system not found', async () => {
        mockCoreConceptsClient.getRpgSystemBySystemId.mockResolvedValue(null);

        await expect((server as any).getRpgSystem({ systemId: 'nonexistent' })).rejects.toThrow(
          'System not found: nonexistent'
        );
      });
    });

    describe('rpg_search_creatures', () => {
      it('should search creatures', async () => {
        const mockCreatures = [
          {
            id: 'c1',
            name: 'Adult Red Dragon',
            creatureType: 'Dragon',
            cr: '17',
            size: 'Huge',
          },
        ];

        mockCoreConceptsClient.searchCreatures.mockResolvedValue(mockCreatures);

        const result = await (server as any).searchCreatures({ query: 'dragon', limit: 5 });

        expect(mockCoreConceptsClient.searchCreatures).toHaveBeenCalledWith('dragon', 5);

        const creatures = JSON.parse(result.content[0].text);
        expect(creatures).toHaveLength(1);
        expect(creatures[0].name).toBe('Adult Red Dragon');
      });
    });

    describe('rpg_get_creature', () => {
      it('should get creature by ID', async () => {
        const mockCreature = {
          id: 'c123',
          name: 'Goblin',
          creatureType: 'Humanoid',
          cr: '1/4',
        };

        mockCoreConceptsClient.getCreature.mockResolvedValue(mockCreature);

        const result = await (server as any).getCreature({ id: 'c123' });

        expect(mockCoreConceptsClient.getCreature).toHaveBeenCalledWith('c123');

        const creature = JSON.parse(result.content[0].text);
        expect(creature.name).toBe('Goblin');
      });

      it('should throw error when creature not found', async () => {
        mockCoreConceptsClient.getCreature.mockResolvedValue(null);

        await expect((server as any).getCreature({ id: 'invalid' })).rejects.toThrow(
          'Creature not found: invalid'
        );
      });
    });

    describe('rpg_search_locations', () => {
      it('should search locations', async () => {
        const mockLocations = [
          {
            id: 'l1',
            name: 'waterdeep',
            title: 'City of Splendors',
            locationType: 'city',
            locationScale: 'Settlement',
          },
        ];

        mockCoreConceptsClient.searchLocations.mockResolvedValue(mockLocations);

        const result = await (server as any).searchLocations({ query: 'waterdeep', limit: 10 });

        expect(mockCoreConceptsClient.searchLocations).toHaveBeenCalledWith('waterdeep', 10);

        const locations = JSON.parse(result.content[0].text);
        expect(locations[0].name).toBe('waterdeep');
      });
    });

    describe('rpg_get_system_attributes', () => {
      it('should get system attributes', async () => {
        const mockAttributes = [
          {
            id: 'a1',
            name: 'strength',
            title: 'Strength',
            category: 'stat',
            dataType: 'number',
          },
        ];

        mockCoreConceptsClient.getSystemAttributes.mockResolvedValue(mockAttributes);

        const result = await (server as any).getSystemAttributes({ systemName: 'D&D 5e' });

        expect(mockCoreConceptsClient.getSystemAttributes).toHaveBeenCalledWith('D&D 5e');

        const attributes = JSON.parse(result.content[0].text);
        expect(attributes[0].name).toBe('strength');
      });
    });
  });

  describe('FumbleBot Utility Tools', () => {
    describe('fumble_roll_dice', () => {
      it('should roll dice with valid notation', async () => {
        const result = await (server as any).rollDice({ notation: '2d6+3', label: 'Attack' });

        const roll = JSON.parse(result.content[0].text);
        expect(roll.notation).toBe('2d6+3');
        expect(roll.rolls).toHaveLength(2);
        expect(roll.total).toBeGreaterThanOrEqual(5); // min: 2 + 3
        expect(roll.total).toBeLessThanOrEqual(15); // max: 12 + 3
      });

      it('should throw error for invalid notation', async () => {
        await expect((server as any).rollDice({ notation: 'invalid' })).rejects.toThrow(
          'Invalid dice notation'
        );
      });
    });

    describe('fumble_generate_npc', () => {
      it('should generate NPC using Anthropic', async () => {
        mockAIService.isProviderAvailable.mockReturnValue(true);
        mockAIService.generateNPC.mockResolvedValue('Name: Thorin\nRace: Dwarf\n...');

        const result = await (server as any).generateNPC({ type: 'merchant', system: 'D&D 5e' });

        expect(mockAIService.generateNPC).toHaveBeenCalledWith('merchant', 'D&D 5e');
        expect(result.content[0].text).toContain('Thorin');
      });

      it('should throw error when Anthropic not configured', async () => {
        mockAIService.isProviderAvailable.mockReturnValue(false);

        await expect((server as any).generateNPC({ type: 'guard' })).rejects.toThrow(
          'Anthropic not configured'
        );
      });
    });

    describe('fumble_generate_lore', () => {
      it('should generate lore using Anthropic', async () => {
        mockAIService.isProviderAvailable.mockReturnValue(true);
        mockAIService.generateLore.mockResolvedValue(
          'In the ancient times, the Crystal Caverns...'
        );

        const result = await (server as any).generateLore({
          topic: 'Crystal Caverns',
          style: 'chronicle',
        });

        expect(mockAIService.generateLore).toHaveBeenCalledWith('Crystal Caverns', 'chronicle');
        expect(result.content[0].text).toContain('Crystal Caverns');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle Core Concepts client not initialized', async () => {
      const serverWithoutPrisma = new FumbleBotMCPServer();

      await expect((serverWithoutPrisma as any).listRpgSystems({})).rejects.toThrow(
        'Core Concepts client not initialized'
      );
    });

    it('should handle AI provider not available', async () => {
      mockAIService.isProviderAvailable.mockReturnValue(false);

      await expect((server as any).anthropicChat({ prompt: 'test' })).rejects.toThrow(
        'Anthropic not configured'
      );
    });
  });
});
