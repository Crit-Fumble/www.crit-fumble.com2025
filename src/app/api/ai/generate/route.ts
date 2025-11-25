/**
 * AI Generation API - GPT for Structured Data Generation
 * Uses OpenAI function calling to generate Cards, Sheets, and structured game data
 *
 * SECURITY: Owner-only access with strict rate limiting (staging/production)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isOwner } from '@/lib/admin'
import { apiRateLimiter, getClientIdentifier, getIpAddress, checkRateLimit } from '@/lib/rate-limit'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

// Define schemas for structured generation
const schemas = {
  card: {
    name: 'generate_card',
    description: 'Generate a structured RPG card (item, spell, ability, etc.)',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Card name' },
        cardType: { type: 'string', enum: ['item', 'spell', 'ability', 'feat', 'trait', 'condition', 'rule'], description: 'Type of card' },
        rarity: { type: 'string', enum: ['common', 'uncommon', 'rare', 'very-rare', 'legendary', 'artifact'], description: 'Rarity level' },
        description: { type: 'string', description: 'Detailed description' },
        rules: { type: 'string', description: 'Game mechanics and rules' },
        flavorText: { type: 'string', description: 'Flavor text for immersion' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Categorization tags' },
        metadata: {
          type: 'object',
          properties: {
            level: { type: 'number', description: 'Level requirement (if applicable)' },
            cost: { type: 'string', description: 'Cost in GP or other currency' },
            weight: { type: 'number', description: 'Weight in pounds' },
            damage: { type: 'string', description: 'Damage dice (e.g., 1d8)' },
            range: { type: 'string', description: 'Range (e.g., 30 ft)' },
            duration: { type: 'string', description: 'Duration (e.g., 1 hour)' },
          }
        }
      },
      required: ['name', 'cardType', 'description', 'rules']
    }
  },
  creature: {
    name: 'generate_creature',
    description: 'Generate a structured creature/NPC',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Creature name' },
        creatureType: { type: 'string', enum: ['player-character', 'npc', 'monster', 'companion'], description: 'Type of creature' },
        race: { type: 'string', description: 'Race/species' },
        class: { type: 'string', description: 'Character class (if applicable)' },
        level: { type: 'number', description: 'Level or CR' },
        description: { type: 'string', description: 'Physical description' },
        personality: {
          type: 'object',
          properties: {
            traits: { type: 'array', items: { type: 'string' }, description: 'Personality traits' },
            ideals: { type: 'array', items: { type: 'string' }, description: 'Ideals' },
            bonds: { type: 'array', items: { type: 'string' }, description: 'Bonds' },
            flaws: { type: 'array', items: { type: 'string' }, description: 'Flaws' },
          }
        },
        stats: {
          type: 'object',
          properties: {
            str: { type: 'number', description: 'Strength' },
            dex: { type: 'number', description: 'Dexterity' },
            con: { type: 'number', description: 'Constitution' },
            int: { type: 'number', description: 'Intelligence' },
            wis: { type: 'number', description: 'Wisdom' },
            cha: { type: 'number', description: 'Charisma' },
          }
        },
        background: { type: 'string', description: 'Background story' },
        motivations: { type: 'string', description: 'Goals and motivations' },
      },
      required: ['name', 'creatureType', 'description']
    }
  },
  location: {
    name: 'generate_location',
    description: 'Generate a structured location',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Location name' },
        title: { type: 'string', description: 'Formal title' },
        locationType: { type: 'string', enum: ['city', 'dungeon', 'wilderness', 'structure', 'plane', 'settlement', 'underground'], description: 'Type of location' },
        locationScale: {
          type: 'string',
          enum: ['Interaction', 'Arena', 'Building', 'Settlement', 'County', 'Province', 'Kingdom', 'Continent', 'Realm', 'Planet', 'Orbital Space', 'Star System'],
          description: 'Scale of the location'
        },
        description: { type: 'string', description: 'Detailed description' },
        climate: { type: 'string', description: 'Climate conditions' },
        terrain: { type: 'string', description: 'Terrain type' },
        dangerLevel: { type: 'number', minimum: 1, maximum: 20, description: 'Danger level (1-20)' },
        pointsOfInterest: { type: 'array', items: { type: 'string' }, description: 'Notable locations within' },
        inhabitants: { type: 'array', items: { type: 'string' }, description: 'Who lives here' },
        secrets: { type: 'array', items: { type: 'string' }, description: 'Hidden secrets' },
        hooks: { type: 'array', items: { type: 'string' }, description: 'Adventure hooks' },
      },
      required: ['name', 'title', 'locationType', 'description']
    }
  }
}

/**
 * POST /api/ai/generate
 * Generate structured game data using GPT with function calling
 *
 * SECURITY: Owner-only access (prevents API cost abuse)
 * Rate limit: 100 requests/minute (inherited from apiRateLimiter)
 */
export async function POST(request: NextRequest) {
  try {
    // RATE LIMITING: Apply before auth to prevent brute force
    const ip = getIpAddress(request);
    const rateLimitResult = await checkRateLimit(
      apiRateLimiter,
      getClientIdentifier(undefined, ip)
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: { 'Retry-After': rateLimitResult.retryAfter.toString() }
        }
      );
    }

    // AUTHENTICATION: Require logged-in user
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // AUTHORIZATION: Owner-only for staging (prevents cost abuse)
    const user = await prisma.critUser.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !isOwner(user)) {
      return NextResponse.json(
        { error: 'Forbidden - Owner access required (AI features in beta)' },
        { status: 403 }
      );
    }

    const body = await request.json()
    const {
      prompt,
      type = 'card', // 'card', 'creature', 'location'
      context,
      systemName = 'dnd5e',
    } = body

    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing required field: prompt' },
        { status: 400 }
      )
    }

    if (!schemas[type as keyof typeof schemas]) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${Object.keys(schemas).join(', ')}` },
        { status: 400 }
      )
    }

    const schema = schemas[type as keyof typeof schemas]

    // Build system message
    const systemMessage = `You are an expert TTRPG content generator for the Crit-Fumble platform.
Generate high-quality, balanced, and creative ${type} data for ${systemName}.
Follow the schema precisely and ensure all generated content is:
- Balanced and appropriate for the system
- Creative and engaging
- Detailed but concise
- Game-ready with proper mechanics
${context ? `\n\nAdditional Context: ${context}` : ''}`

    // Call GPT with function calling
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt }
      ],
      tools: [
        {
          type: 'function',
          function: schema
        }
      ],
      tool_choice: { type: 'function', function: { name: schema.name } },
      temperature: 0.8, // More creative for generation
    })

    const toolCall = response.choices[0]?.message?.tool_calls?.[0]

    if (!toolCall || !toolCall.function.arguments) {
      return NextResponse.json(
        { error: 'No structured data generated' },
        { status: 500 }
      )
    }

    const generatedData = JSON.parse(toolCall.function.arguments)

    // AUDIT LOG: Track AI usage for cost monitoring
    console.log(
      `[OWNER_AI_GENERATE] Owner ${session.user.id} generated ${type}. Tokens: ${response.usage?.prompt_tokens || 0} in, ${response.usage?.completion_tokens || 0} out`
    );

    return NextResponse.json({
      data: generatedData,
      type,
      model: 'gpt-4-turbo-preview',
      usage: response.usage,
    })
  } catch (error) {
    console.error('AI Generate API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate structured data', details: String(error) },
      { status: 500 }
    )
  }
}
