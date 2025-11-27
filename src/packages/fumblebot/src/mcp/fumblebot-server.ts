/**
 * FumbleBot MCP Server
 *
 * Unified MCP server exposing:
 * - Foundry VTT operations (screenshots, chat, etc.)
 * - AI operations (Anthropic Claude & OpenAI GPT models)
 * - FumbleBot utilities (dice rolling, NPC generation, etc.)
 *
 * This allows AI agents to autonomously interact with all FumbleBot capabilities.
 * Non-admin Discord commands also call these MCP tools directly.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { FoundryClient } from '../foundry/client.js';
import { getScreenshotService } from '../foundry/screenshot.js';
import { AIService } from '../ai/service.js';
import { CoreConceptsClient } from '../core-concepts/client.js';
import { readFile } from 'fs/promises';
import type { PrismaClient } from '@prisma/client';

// Configuration
const FOUNDRY_URL = process.env.FOUNDRY_URL || 'http://localhost:30000';
const FOUNDRY_API_KEY = process.env.FOUNDRY_API_KEY;

/**
 * FumbleBot MCP Server
 * Comprehensive tool server for AI agents
 */
class FumbleBotMCPServer {
  private server: Server;
  private foundryClient: FoundryClient;
  private aiService: AIService;
  private coreConceptsClient: CoreConceptsClient | null = null;

  constructor(prisma?: PrismaClient) {
    this.server = new Server(
      {
        name: 'fumblebot',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.foundryClient = new FoundryClient({
      baseUrl: FOUNDRY_URL,
      apiKey: FOUNDRY_API_KEY,
      timeout: 10000,
    });

    this.aiService = AIService.getInstance();

    if (prisma) {
      this.coreConceptsClient = new CoreConceptsClient({ prisma });
    }

    this.setupHandlers();
  }

  /**
   * Set up MCP request handlers
   */
  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getTools(),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        // Foundry VTT tools
        if (name.startsWith('foundry_')) {
          return await this.handleFoundryTool(name, args);
        }

        // AI tools (OpenAI & Anthropic)
        if (name.startsWith('openai_') || name.startsWith('anthropic_') || name.startsWith('ai_')) {
          return await this.handleAITool(name, args);
        }

        // FumbleBot utility tools
        if (name.startsWith('fumble_')) {
          return await this.handleFumbleTool(name, args);
        }

        // Core Concepts tools
        if (name.startsWith('cc_') || name.startsWith('rpg_')) {
          return await this.handleCoreConceptsTool(name, args);
        }

        throw new Error(`Unknown tool: ${name}`);
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * Get list of available tools
   */
  private getTools(): Tool[] {
    return [
      // === Foundry VTT Tools ===
      {
        name: 'foundry_health_check',
        description:
          'Check if Foundry VTT instance is running and accessible. Returns status information.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'foundry_screenshot',
        description:
          'Capture a screenshot of the Foundry VTT instance. Use when asked to see what\'s happening in the game.',
        inputSchema: {
          type: 'object',
          properties: {
            fullPage: {
              type: 'boolean',
              description: 'Capture full scrollable page',
              default: false,
            },
          },
        },
      },
      {
        name: 'foundry_screenshot_canvas',
        description:
          'Capture screenshot of just the game canvas/board (tokens and maps).',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'foundry_get_chat',
        description: 'Retrieve recent chat messages from Foundry VTT.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Number of messages to retrieve',
              default: 10,
            },
          },
        },
      },
      {
        name: 'foundry_send_chat',
        description: 'Send a chat message to Foundry VTT as the bot.',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'The message to send',
            },
            type: {
              type: 'string',
              description: 'Message type',
              enum: ['ooc', 'ic', 'emote', 'whisper'],
              default: 'ooc',
            },
          },
          required: ['message'],
        },
      },

      // === AI Tools - Anthropic (Claude) ===
      {
        name: 'anthropic_chat',
        description:
          'Chat with Claude (Sonnet or Haiku). Use for general AI assistance, creative writing, analysis, DM responses, NPC generation.',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'The message to send to Claude',
            },
            model: {
              type: 'string',
              description: 'Claude model to use',
              enum: ['sonnet', 'haiku'],
              default: 'sonnet',
            },
            systemPrompt: {
              type: 'string',
              description: 'Optional system prompt to guide Claude',
            },
            temperature: {
              type: 'number',
              description: 'Creativity/randomness (0.0 to 1.0)',
              default: 0.7,
            },
            maxTokens: {
              type: 'number',
              description: 'Maximum tokens in response',
              default: 2048,
            },
          },
          required: ['prompt'],
        },
      },
      {
        name: 'anthropic_dm_response',
        description:
          'Generate a Dungeon Master response for TTRPG scenarios using Claude. Includes vivid descriptions and suggests dice rolls.',
        inputSchema: {
          type: 'object',
          properties: {
            scenario: {
              type: 'string',
              description: 'The scenario or player action to respond to',
            },
            system: {
              type: 'string',
              description: 'Game system (e.g., "D&D 5e", "Pathfinder 2e")',
              default: 'D&D 5e',
            },
            tone: {
              type: 'string',
              description: 'Response tone',
              enum: ['dramatic', 'humorous', 'serious', 'dark'],
              default: 'dramatic',
            },
          },
          required: ['scenario'],
        },
      },
      {
        name: 'anthropic_lookup_rule',
        description:
          'Look up TTRPG rules using Claude Haiku (fast, accurate). Returns concise rule explanations.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The rule question to answer',
            },
            system: {
              type: 'string',
              description: 'Game system',
              default: 'D&D 5e',
            },
          },
          required: ['query'],
        },
      },

      // === AI Tools - OpenAI (GPT) ===
      {
        name: 'openai_chat',
        description:
          'Chat with OpenAI GPT-4o. Use for complex content generation, function calling, structured output.',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'The prompt/message to send to the model',
            },
            systemPrompt: {
              type: 'string',
              description: 'Optional system prompt to guide the model',
            },
            temperature: {
              type: 'number',
              description: 'Creativity/randomness (0.0 to 2.0)',
              default: 0.7,
            },
            maxTokens: {
              type: 'number',
              description: 'Maximum tokens in response',
              default: 2048,
            },
          },
          required: ['prompt'],
        },
      },
      {
        name: 'openai_generate_dungeon',
        description:
          'Generate a TTRPG dungeon with structured rooms, encounters, and treasure using OpenAI function calling.',
        inputSchema: {
          type: 'object',
          properties: {
            theme: {
              type: 'string',
              description: 'Dungeon theme (e.g., "undead crypt", "dwarven mine")',
            },
            size: {
              type: 'string',
              enum: ['small', 'medium', 'large'],
              description: 'Dungeon size',
              default: 'medium',
            },
            level: {
              type: 'number',
              description: 'Party level (for encounter balancing)',
            },
            style: {
              type: 'string',
              description: 'Optional style (e.g., "linear", "branching", "sandbox")',
            },
          },
          required: ['theme', 'level'],
        },
      },
      {
        name: 'openai_generate_encounter',
        description:
          'Generate a TTRPG combat encounter with enemies, terrain, and rewards using OpenAI.',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              description: 'Encounter type (e.g., "combat", "social", "exploration")',
              default: 'combat',
            },
            difficulty: {
              type: 'string',
              enum: ['easy', 'medium', 'hard', 'deadly'],
              description: 'Encounter difficulty',
              default: 'medium',
            },
            partyLevel: {
              type: 'number',
              description: 'Average party level',
            },
            partySize: {
              type: 'number',
              description: 'Number of players',
            },
            environment: {
              type: 'string',
              description: 'Optional environment (e.g., "forest", "dungeon")',
            },
          },
          required: ['partyLevel', 'partySize'],
        },
      },

      // === Core Concepts Tools - RPG Data ===
      {
        name: 'rpg_list_systems',
        description:
          'List all available RPG systems (D&D 5e, Pathfinder, Cypher, etc.). Use to discover what systems are supported.',
        inputSchema: {
          type: 'object',
          properties: {
            coreOnly: {
              type: 'boolean',
              description: 'Only show core/featured systems',
              default: false,
            },
          },
        },
      },
      {
        name: 'rpg_get_system',
        description:
          'Get detailed information about a specific RPG system by systemId (e.g., "dnd5e", "pf2e").',
        inputSchema: {
          type: 'object',
          properties: {
            systemId: {
              type: 'string',
              description: 'System identifier (e.g., "dnd5e", "pf2e", "cyphersystem")',
            },
          },
          required: ['systemId'],
        },
      },
      {
        name: 'rpg_search_creatures',
        description:
          'Search for creatures/monsters by name. Returns stats, abilities, CR, size, alignment.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (creature name or partial name)',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results',
              default: 10,
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'rpg_get_creature',
        description:
          'Get detailed information about a specific creature by ID.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Creature ID',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'rpg_search_locations',
        description:
          'Search for locations (worlds, dungeons, cities, planes) by name.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (location name or partial name)',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results',
              default: 10,
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'rpg_get_location',
        description:
          'Get detailed information about a specific location by ID.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Location ID',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'rpg_get_system_attributes',
        description:
          'Get attributes (stats, skills, resources) for a specific RPG system.',
        inputSchema: {
          type: 'object',
          properties: {
            systemName: {
              type: 'string',
              description: 'System name (e.g., "D&D 5e", "Pathfinder 2e")',
            },
          },
          required: ['systemName'],
        },
      },

      // === FumbleBot Utility Tools ===
      {
        name: 'fumble_roll_dice',
        description:
          'Roll dice using standard notation (e.g., "2d6+3", "1d20", "4d6 drop lowest"). Returns individual rolls and total.',
        inputSchema: {
          type: 'object',
          properties: {
            notation: {
              type: 'string',
              description: 'Dice notation (e.g., "2d6+3", "1d20")',
            },
            label: {
              type: 'string',
              description: 'Optional label for the roll',
            },
          },
          required: ['notation'],
        },
      },
      {
        name: 'fumble_generate_npc',
        description:
          'Generate a TTRPG NPC with name, backstory, personality, and stats. Use when DM needs a quick NPC.',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              description: 'NPC type or role',
              default: 'random',
            },
            system: {
              type: 'string',
              description: 'Game system (e.g., "D&D 5e", "Pathfinder 2e")',
              default: 'D&D 5e',
            },
          },
        },
      },
      {
        name: 'fumble_generate_lore',
        description:
          'Generate world-building lore (locations, items, factions, etc.). Use for campaign content.',
        inputSchema: {
          type: 'object',
          properties: {
            topic: {
              type: 'string',
              description: 'What to generate lore about',
            },
            style: {
              type: 'string',
              description: 'Writing style',
              enum: ['chronicle', 'legend', 'scholarly', 'tavern'],
              default: 'chronicle',
            },
          },
          required: ['topic'],
        },
      },
    ];
  }

  /**
   * Handle Foundry VTT tools
   */
  private async handleFoundryTool(name: string, args: any) {
    switch (name) {
      case 'foundry_health_check':
        const health = await this.foundryClient.healthCheck();
        return {
          content: [{ type: 'text', text: JSON.stringify(health, null, 2) }],
        };

      case 'foundry_screenshot':
        return await this.captureScreenshot(args);

      case 'foundry_screenshot_canvas':
        return await this.captureCanvasScreenshot();

      case 'foundry_get_chat':
        return await this.getFoundryChat(args);

      case 'foundry_send_chat':
        return await this.sendFoundryChat(args);

      default:
        throw new Error(`Unknown Foundry tool: ${name}`);
    }
  }

  /**
   * Handle AI tools (Anthropic & OpenAI)
   */
  private async handleAITool(name: string, args: any) {
    // Anthropic tools
    if (name.startsWith('anthropic_')) {
      switch (name) {
        case 'anthropic_chat':
          return await this.anthropicChat(args);
        case 'anthropic_dm_response':
          return await this.anthropicDMResponse(args);
        case 'anthropic_lookup_rule':
          return await this.anthropicLookupRule(args);
        default:
          throw new Error(`Unknown Anthropic tool: ${name}`);
      }
    }

    // OpenAI tools
    if (name.startsWith('openai_')) {
      switch (name) {
        case 'openai_chat':
          return await this.openAIGenerate(args);
        case 'openai_generate_dungeon':
          return await this.openAIGenerateDungeon(args);
        case 'openai_generate_encounter':
          return await this.openAIGenerateEncounter(args);
        default:
          throw new Error(`Unknown OpenAI tool: ${name}`);
      }
    }

    throw new Error(`Unknown AI tool: ${name}`);
  }

  /**
   * Handle FumbleBot utility tools
   */
  private async handleFumbleTool(name: string, args: any) {
    switch (name) {
      case 'fumble_roll_dice':
        return await this.rollDice(args);

      case 'fumble_generate_npc':
        return await this.generateNPC(args);

      case 'fumble_generate_lore':
        return await this.generateLore(args);

      default:
        throw new Error(`Unknown FumbleBot tool: ${name}`);
    }
  }

  /**
   * Handle Core Concepts tools
   */
  private async handleCoreConceptsTool(name: string, args: any) {
    if (!this.coreConceptsClient) {
      throw new Error('Core Concepts client not initialized (Prisma required)');
    }

    switch (name) {
      case 'rpg_list_systems':
        return await this.listRpgSystems(args);

      case 'rpg_get_system':
        return await this.getRpgSystem(args);

      case 'rpg_search_creatures':
        return await this.searchCreatures(args);

      case 'rpg_get_creature':
        return await this.getCreature(args);

      case 'rpg_search_locations':
        return await this.searchLocations(args);

      case 'rpg_get_location':
        return await this.getLocation(args);

      case 'rpg_get_system_attributes':
        return await this.getSystemAttributes(args);

      default:
        throw new Error(`Unknown Core Concepts tool: ${name}`);
    }
  }

  // === Foundry Tool Implementations ===

  private async captureScreenshot(args: any) {
    const screenshotService = getScreenshotService();
    const fullPage = args?.fullPage || false;

    const result = await screenshotService.captureScreenshot(FOUNDRY_URL, {
      fullPage,
    });

    const imageBuffer = await readFile(result.filePath);
    const base64Image = imageBuffer.toString('base64');

    return {
      content: [
        {
          type: 'image',
          data: base64Image,
          mimeType: 'image/png',
        },
        {
          type: 'text',
          text: `Screenshot: ${result.viewport.width}x${result.viewport.height}`,
        },
      ],
    };
  }

  private async captureCanvasScreenshot() {
    const screenshotService = getScreenshotService();
    const result = await screenshotService.captureCanvas(FOUNDRY_URL);

    const imageBuffer = await readFile(result.filePath);
    const base64Image = imageBuffer.toString('base64');

    return {
      content: [
        {
          type: 'image',
          data: base64Image,
          mimeType: 'image/png',
        },
        {
          type: 'text',
          text: 'Canvas screenshot captured',
        },
      ],
    };
  }

  private async getFoundryChat(args: any) {
    const limit = args?.limit || 10;
    // TODO: Phase 1 implementation
    return {
      content: [
        {
          type: 'text',
          text: 'Chat retrieval not yet implemented (Phase 1)',
        },
      ],
    };
  }

  private async sendFoundryChat(args: any) {
    const message = args?.message;
    if (!message) throw new Error('Message required');

    // TODO: Phase 1 implementation
    return {
      content: [
        {
          type: 'text',
          text: 'Chat sending not yet implemented (Phase 1)',
        },
      ],
    };
  }

  // === Anthropic Tool Implementations ===

  private async anthropicChat(args: any) {
    const { prompt, model = 'sonnet', systemPrompt, temperature = 0.7, maxTokens = 2048 } = args;

    if (!this.aiService.isProviderAvailable('anthropic')) {
      throw new Error('Anthropic not configured');
    }

    const response = await this.aiService.chat(
      [{ role: 'user', content: prompt }],
      systemPrompt,
      { temperature, maxTokens }
    );

    return {
      content: [
        {
          type: 'text',
          text: response.content,
        },
      ],
    };
  }

  private async anthropicDMResponse(args: any) {
    const { scenario, system = 'D&D 5e', tone = 'dramatic' } = args;

    if (!this.aiService.isProviderAvailable('anthropic')) {
      throw new Error('Anthropic not configured');
    }

    const response = await this.aiService.dmResponse(scenario, system, tone);

    return {
      content: [
        {
          type: 'text',
          text: response,
        },
      ],
    };
  }

  private async anthropicLookupRule(args: any) {
    const { query, system = 'D&D 5e' } = args;

    if (!this.aiService.isProviderAvailable('anthropic')) {
      throw new Error('Anthropic not configured');
    }

    const response = await this.aiService.lookupRule(query, system);

    return {
      content: [
        {
          type: 'text',
          text: response,
        },
      ],
    };
  }

  // === OpenAI Tool Implementations ===

  private async openAIGenerate(args: any) {
    const { prompt, systemPrompt, temperature = 0.7, maxTokens = 2048 } = args;

    if (!this.aiService.isProviderAvailable('openai')) {
      throw new Error('OpenAI not configured');
    }

    const response = await this.aiService.generate(prompt, systemPrompt, {
      temperature,
      maxTokens,
    });

    return {
      content: [
        {
          type: 'text',
          text: response.content,
        },
      ],
    };
  }

  private async openAIGenerateDungeon(args: any) {
    const { theme, size = 'medium', level, style } = args;

    if (!this.aiService.isProviderAvailable('openai')) {
      throw new Error('OpenAI not configured');
    }

    const dungeon = await this.aiService.generateDungeon({
      theme,
      size,
      level,
      style,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(dungeon, null, 2),
        },
      ],
    };
  }

  private async openAIGenerateEncounter(args: any) {
    const { type = 'combat', difficulty = 'medium', partyLevel, partySize, environment } = args;

    if (!this.aiService.isProviderAvailable('openai')) {
      throw new Error('OpenAI not configured');
    }

    const encounter = await this.aiService.generateEncounter({
      type,
      difficulty,
      partyLevel,
      partySize,
      environment,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(encounter, null, 2),
        },
      ],
    };
  }

  // === FumbleBot Tool Implementations ===

  private async rollDice(args: any) {
    const { notation, label } = args;

    // Simple dice roller (can be enhanced)
    const match = notation.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
    if (!match) {
      throw new Error(`Invalid dice notation: ${notation}`);
    }

    const [, numDice, sides, modifier] = match;
    const rolls: number[] = [];
    let total = 0;

    for (let i = 0; i < parseInt(numDice); i++) {
      const roll = Math.floor(Math.random() * parseInt(sides)) + 1;
      rolls.push(roll);
      total += roll;
    }

    if (modifier) {
      total += parseInt(modifier);
    }

    const result = {
      notation,
      label,
      rolls,
      total,
      modifier: modifier || '+0',
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async generateNPC(args: any) {
    const { type = 'random', system = 'D&D 5e' } = args;

    if (!this.aiService.isProviderAvailable('anthropic')) {
      throw new Error('Anthropic not configured (required for NPC generation)');
    }

    const response = await this.aiService.generateNPC(type, system);

    return {
      content: [
        {
          type: 'text',
          text: response,
        },
      ],
    };
  }

  private async generateLore(args: any) {
    const { topic, style = 'chronicle' } = args;

    if (!this.aiService.isProviderAvailable('anthropic')) {
      throw new Error('Anthropic not configured (required for lore generation)');
    }

    const response = await this.aiService.generateLore(topic, style);

    return {
      content: [
        {
          type: 'text',
          text: response,
        },
      ],
    };
  }

  // === Core Concepts Tool Implementations ===

  private async listRpgSystems(args: any) {
    const { coreOnly = false } = args;

    const systems = coreOnly
      ? await this.coreConceptsClient!.getCoreSystems()
      : await this.coreConceptsClient!.getRpgSystems();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(systems, null, 2),
        },
      ],
    };
  }

  private async getRpgSystem(args: any) {
    const { systemId } = args;

    const system = await this.coreConceptsClient!.getRpgSystemBySystemId(systemId);

    if (!system) {
      throw new Error(`System not found: ${systemId}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(system, null, 2),
        },
      ],
    };
  }

  private async searchCreatures(args: any) {
    const { query, limit = 10 } = args;

    const creatures = await this.coreConceptsClient!.searchCreatures(query, limit);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(creatures, null, 2),
        },
      ],
    };
  }

  private async getCreature(args: any) {
    const { id } = args;

    const creature = await this.coreConceptsClient!.getCreature(id);

    if (!creature) {
      throw new Error(`Creature not found: ${id}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(creature, null, 2),
        },
      ],
    };
  }

  private async searchLocations(args: any) {
    const { query, limit = 10 } = args;

    const locations = await this.coreConceptsClient!.searchLocations(query, limit);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(locations, null, 2),
        },
      ],
    };
  }

  private async getLocation(args: any) {
    const { id } = args;

    const location = await this.coreConceptsClient!.getLocation(id);

    if (!location) {
      throw new Error(`Location not found: ${id}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(location, null, 2),
        },
      ],
    };
  }

  private async getSystemAttributes(args: any) {
    const { systemName } = args;

    const attributes = await this.coreConceptsClient!.getSystemAttributes(systemName);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(attributes, null, 2),
        },
      ],
    };
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.error('FumbleBot MCP server started');
    console.error('Available tool categories:');
    console.error('  - foundry_*   : Foundry VTT operations');
    console.error('  - anthropic_* : Claude (Sonnet, Haiku) operations');
    console.error('  - openai_*    : OpenAI (GPT-4o, DALL-E) operations');
    console.error('  - rpg_*       : Core Concepts RPG data (systems, creatures, locations)');
    console.error('  - fumble_*    : FumbleBot utilities (dice, NPC, lore)');
  }
}

// Start server if run directly
if (import.meta.url === `file://${process.argv[1]}`.replace(/\\/g, '/')) {
  const server = new FumbleBotMCPServer();
  server.start().catch(console.error);
}

export { FumbleBotMCPServer };
