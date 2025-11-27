/**
 * Discord RPG Commands Tests
 * Tests for /rpg Discord commands with mocked dependencies
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ChatInputCommandInteraction } from 'discord.js';

// Mock the MCP server and Prisma before importing
vi.mock('../../../mcp/fumblebot-server.js');
vi.mock('@crit-fumble/core-concepts-api', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({})),
}));

// Import after mocking
import { FumbleBotMCPServer } from '../../../mcp/fumblebot-server.js';

// Create mock interaction helper
const createMockInteraction = (
  subcommand: string,
  options: Record<string, any> = {}
): Partial<ChatInputCommandInteraction> => {
  return {
    options: {
      getSubcommand: vi.fn().mockReturnValue(subcommand),
      getString: vi.fn((key: string, required?: boolean) => options[key] ?? null),
      getBoolean: vi.fn((key: string) => options[key] ?? null),
      getInteger: vi.fn((key: string) => options[key] ?? null),
    } as any,
    deferReply: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
    reply: vi.fn().mockResolvedValue(undefined),
  };
};

describe('RPG Discord Commands', () => {
  let mockMCPServer: any;

  beforeEach(() => {
    // Mock MCP server instance methods
    mockMCPServer = {
      listRpgSystems: vi.fn(),
      searchCreatures: vi.fn(),
      searchLocations: vi.fn(),
      anthropicLookupRule: vi.fn(),
    };

    // Mock the FumbleBotMCPServer constructor to return our mock
    vi.mocked(FumbleBotMCPServer).mockImplementation(() => mockMCPServer);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('/rpg systems', () => {
    it('should display all systems', async () => {
      const mockSystems = [
        {
          id: '1',
          systemId: 'dnd5e',
          name: 'D&D 5e',
          title: 'Dungeons & Dragons 5th Edition',
          version: '5.2.0',
          isCore: true,
          platforms: { foundry: { version: '11.0' } },
        },
        {
          id: '2',
          systemId: 'pf2e',
          name: 'Pathfinder 2e',
          title: 'Pathfinder Second Edition',
          version: '2.4.0',
          isCore: true,
          platforms: { foundry: { version: '11.0' } },
        },
      ];

      mockMCPServer.listRpgSystems.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(mockSystems) }],
      });

      const interaction = createMockInteraction('systems', { 'core-only': false });

      // Import and execute handler
      const { rpgHandler } = await import('./rpg.js');
      await rpgHandler.execute(interaction as ChatInputCommandInteraction);

      expect(interaction.deferReply).toHaveBeenCalled();
      expect(mockMCPServer.listRpgSystems).toHaveBeenCalledWith({ coreOnly: false });
      expect(interaction.editReply).toHaveBeenCalledWith(
        expect.objectContaining({
          embeds: expect.arrayContaining([
            expect.objectContaining({
              data: expect.objectContaining({
                title: expect.stringContaining('RPG Systems'),
              }),
            }),
          ]),
        })
      );
    });

    it('should display only core systems when core-only=true', async () => {
      const mockSystems = [
        {
          id: '1',
          systemId: 'dnd5e',
          name: 'D&D 5e',
          isCore: true,
          platforms: {},
          version: '5.2.0',
        },
      ];

      mockMCPServer.listRpgSystems.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(mockSystems) }],
      });

      const interaction = createMockInteraction('systems', { 'core-only': true });

      const { rpgHandler } = await import('./rpg.js');
      await rpgHandler.execute(interaction as ChatInputCommandInteraction);

      expect(mockMCPServer.listRpgSystems).toHaveBeenCalledWith({ coreOnly: true });
    });

    it('should handle empty systems list', async () => {
      mockMCPServer.listRpgSystems.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify([]) }],
      });

      const interaction = createMockInteraction('systems', {});

      const { rpgHandler } = await import('./rpg.js');
      await rpgHandler.execute(interaction as ChatInputCommandInteraction);

      expect(interaction.editReply).toHaveBeenCalledWith({
        content: 'No RPG systems found.',
      });
    });

    it('should handle errors gracefully', async () => {
      mockMCPServer.listRpgSystems.mockRejectedValue(new Error('Database error'));

      const interaction = createMockInteraction('systems', {});

      const { rpgHandler } = await import('./rpg.js');
      await rpgHandler.execute(interaction as ChatInputCommandInteraction);

      expect(interaction.editReply).toHaveBeenCalledWith({
        content: expect.stringContaining('❌ Error: Database error'),
      });
    });
  });

  describe('/rpg creature', () => {
    it('should search and display creatures', async () => {
      const mockCreatures = [
        {
          id: 'c1',
          name: 'Adult Red Dragon',
          creatureType: 'Dragon',
          description: 'A fearsome red dragon with crimson scales',
          stats: { cr: '17', size: 'Huge', alignment: 'Chaotic Evil' },
          cr: '17',
          size: 'Huge',
          alignment: 'Chaotic Evil',
        },
      ];

      mockMCPServer.searchCreatures.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(mockCreatures) }],
      });

      const interaction = createMockInteraction('creature', { name: 'dragon', limit: 5 });

      const { rpgHandler } = await import('./rpg.js');
      await rpgHandler.execute(interaction as ChatInputCommandInteraction);

      expect(interaction.deferReply).toHaveBeenCalled();
      expect(mockMCPServer.searchCreatures).toHaveBeenCalledWith({ query: 'dragon', limit: 5 });
      expect(interaction.editReply).toHaveBeenCalledWith(
        expect.objectContaining({
          embeds: expect.arrayContaining([
            expect.objectContaining({
              data: expect.objectContaining({
                title: expect.stringContaining('dragon'),
              }),
            }),
          ]),
        })
      );
    });

    it('should use default limit when not specified', async () => {
      mockMCPServer.searchCreatures.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify([]) }],
      });

      const interaction = createMockInteraction('creature', { name: 'goblin' });

      const { rpgHandler } = await import('./rpg.js');
      await rpgHandler.execute(interaction as ChatInputCommandInteraction);

      expect(mockMCPServer.searchCreatures).toHaveBeenCalledWith({ query: 'goblin', limit: 5 });
    });

    it('should handle no results found', async () => {
      mockMCPServer.searchCreatures.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify([]) }],
      });

      const interaction = createMockInteraction('creature', { name: 'nonexistent' });

      const { rpgHandler } = await import('./rpg.js');
      await rpgHandler.execute(interaction as ChatInputCommandInteraction);

      expect(interaction.editReply).toHaveBeenCalledWith({
        content: 'No creatures found matching "nonexistent"',
      });
    });
  });

  describe('/rpg location', () => {
    it('should search and display locations', async () => {
      const mockLocations = [
        {
          id: 'l1',
          name: 'waterdeep',
          title: 'City of Splendors - Waterdeep',
          description: 'The jewel of the Sword Coast',
          locationType: 'city',
          locationScale: 'Settlement',
        },
      ];

      mockMCPServer.searchLocations.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(mockLocations) }],
      });

      const interaction = createMockInteraction('location', { name: 'waterdeep', limit: 5 });

      const { rpgHandler } = await import('./rpg.js');
      await rpgHandler.execute(interaction as ChatInputCommandInteraction);

      expect(mockMCPServer.searchLocations).toHaveBeenCalledWith({
        query: 'waterdeep',
        limit: 5,
      });
      expect(interaction.editReply).toHaveBeenCalledWith(
        expect.objectContaining({
          embeds: expect.arrayContaining([
            expect.objectContaining({
              data: expect.objectContaining({
                title: expect.stringContaining('waterdeep'),
              }),
            }),
          ]),
        })
      );
    });

    it('should truncate long descriptions', async () => {
      const longDescription = 'A'.repeat(200); // 200 character description
      const mockLocations = [
        {
          id: 'l1',
          name: 'test',
          title: 'Test Location',
          description: longDescription,
          locationType: 'city',
          locationScale: 'Settlement',
        },
      ];

      mockMCPServer.searchLocations.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(mockLocations) }],
      });

      const interaction = createMockInteraction('location', { name: 'test' });

      const { rpgHandler } = await import('./rpg.js');
      await rpgHandler.execute(interaction as ChatInputCommandInteraction);

      // Verify truncation happened (description should be cut + "...")
      expect(interaction.editReply).toHaveBeenCalled();
      const call = vi.mocked(interaction.editReply).mock.calls[0][0];
      const embed = (call as any).embeds[0];
      expect(embed.data.fields[0].value).toContain('...');
    });
  });

  describe('/rpg lookup', () => {
    it('should lookup rules using AI', async () => {
      const mockAnswer = 'Advantage allows you to roll two d20s and take the higher result.';

      mockMCPServer.anthropicLookupRule.mockResolvedValue({
        content: [{ type: 'text', text: mockAnswer }],
      });

      const interaction = createMockInteraction('lookup', {
        query: 'How does advantage work?',
        system: 'D&D 5e',
      });

      const { rpgHandler } = await import('./rpg.js');
      await rpgHandler.execute(interaction as ChatInputCommandInteraction);

      expect(mockMCPServer.anthropicLookupRule).toHaveBeenCalledWith({
        query: 'How does advantage work?',
        system: 'D&D 5e',
      });

      expect(interaction.editReply).toHaveBeenCalledWith(
        expect.objectContaining({
          embeds: expect.arrayContaining([
            expect.objectContaining({
              data: expect.objectContaining({
                title: expect.stringContaining('Rules Lookup'),
                fields: expect.arrayContaining([
                  expect.objectContaining({
                    name: 'Answer',
                    value: expect.stringContaining('Advantage'),
                  }),
                ]),
              }),
            }),
          ]),
        })
      );
    });

    it('should use default system when not specified', async () => {
      mockMCPServer.anthropicLookupRule.mockResolvedValue({
        content: [{ type: 'text', text: 'Answer' }],
      });

      const interaction = createMockInteraction('lookup', { query: 'test query' });

      const { rpgHandler } = await import('./rpg.js');
      await rpgHandler.execute(interaction as ChatInputCommandInteraction);

      expect(mockMCPServer.anthropicLookupRule).toHaveBeenCalledWith({
        query: 'test query',
        system: 'D&D 5e',
      });
    });

    it('should truncate very long answers', async () => {
      const longAnswer = 'A'.repeat(1500); // Answer longer than 1024 chars

      mockMCPServer.anthropicLookupRule.mockResolvedValue({
        content: [{ type: 'text', text: longAnswer }],
      });

      const interaction = createMockInteraction('lookup', { query: 'long query' });

      const { rpgHandler } = await import('./rpg.js');
      await rpgHandler.execute(interaction as ChatInputCommandInteraction);

      const call = vi.mocked(interaction.editReply).mock.calls[0][0];
      const embed = (call as any).embeds[0];
      const answerField = embed.data.fields.find((f: any) => f.name === 'Answer');
      expect(answerField.value.length).toBeLessThanOrEqual(1024);
      expect(answerField.value).toContain('...');
    });

    it('should handle AI errors gracefully', async () => {
      mockMCPServer.anthropicLookupRule.mockRejectedValue(new Error('AI service unavailable'));

      const interaction = createMockInteraction('lookup', { query: 'test' });

      const { rpgHandler } = await import('./rpg.js');
      await rpgHandler.execute(interaction as ChatInputCommandInteraction);

      expect(interaction.editReply).toHaveBeenCalledWith({
        content: expect.stringContaining('❌ Error: AI service unavailable'),
      });
    });
  });

  describe('Unknown Subcommand', () => {
    it('should handle unknown subcommands', async () => {
      const interaction = createMockInteraction('unknown', {});

      const { rpgHandler } = await import('./rpg.js');
      await rpgHandler.execute(interaction as ChatInputCommandInteraction);

      expect(interaction.reply).toHaveBeenCalledWith({
        content: 'Unknown subcommand',
        ephemeral: true,
      });
    });
  });
});
