/**
 * AI Game Master API - Sonnet for Auto-GM and Data Population
 * Intelligent GM assistance, world-building, and data generation
 *
 * SECURITY: Owner-only access with strict rate limiting (staging/production)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prismaMain } from '@/lib/db';
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isOwner } from '@/lib/admin'
import { apiRateLimiter, getClientIdentifier, getIpAddress, checkRateLimit } from '@/lib/rate-limit'
import Anthropic from '@anthropic-ai/sdk'
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})
 * POST /api/ai/gm
 * Get GM assistance using Claude Sonnet for complex scenarios
 * SECURITY: Owner-only access (prevents API cost abuse)
 * Rate limit: 100 requests/minute (inherited from apiRateLimiter)
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
    // AUTHORIZATION: Owner-only for staging (prevents cost abuse)
    const user = await prismaMain.critUser.findUnique({
      where: { id: session.user.id },
    });
    if (!user || !isOwner(user)) {
        { error: 'Forbidden - Owner access required (AI features in beta)' },
        { status: 403 }
    const body = await request.json()
    const {
      prompt,
      context,
      worldId,
      locationId,
      task = 'general', // 'general', 'npc', 'location', 'encounter', 'loot', 'plot'
      systemPrompt
    } = body
    if (!prompt) {
        { error: 'Missing required field: prompt' },
        { status: 400 }
      )
    // Build enhanced system message based on task type
    let enhancedSystemPrompt = systemPrompt || `You are an expert AI Game Master for the Crit-Fumble TTRPG platform.
You help GMs create engaging content, populate game worlds, and manage complex scenarios.
You understand D&D 5e and compatible systems deeply.
Provide detailed, creative, and game-ready content.`
    // Add task-specific instructions
    switch (task) {
      case 'npc':
        enhancedSystemPrompt += `\n\nYou are generating NPC data. Include:
- Name, race, class, level
- Personality traits, ideals, bonds, flaws
- Physical description
- Background and motivations
- Stat block or reference to existing monsters
- Potential plot hooks`
        break
      case 'location':
        enhancedSystemPrompt += `\n\nYou are generating location data. Include:
- Name and description
- Key features and points of interest
- Inhabitants and factions
- Secrets and hidden elements
- Adventure hooks
- Scale-appropriate details (refer to location scale if provided)`
      case 'encounter':
        enhancedSystemPrompt += `\n\nYou are generating encounter data. Include:
- Encounter setup and description
- Enemy composition and tactics
- Environmental factors
- Treasure/rewards
- Potential complications
- CR/difficulty rating`
      case 'loot':
        enhancedSystemPrompt += `\n\nYou are generating loot and treasure. Include:
- Items with descriptions
- Rarity and value
- Magical properties if applicable
- History or backstory for unique items
- Distribution across party members`
      case 'plot':
        enhancedSystemPrompt += `\n\nYou are generating plot content. Include:
- Story hooks and narrative threads
- Character motivations
- Potential conflicts
- Resolution paths
- Pacing suggestions
- Connections to existing world elements`
    // Fetch world/location context if provided
    let contextData = context || ''
    if (worldId) {
      const world = await prismaMain.rpgWorld.findUnique({
        where: { id: worldId },
        select: {
          name: true,
          description: true,
          systemName: true,
          worldScale: true,
      })
      if (world) {
        contextData += `\n\nWorld Context:\n- Name: ${world.name}\n- System: ${world.systemName}\n- Scale: ${world.worldScale}\n- Description: ${world.description || 'Not provided'}`
      }
    if (locationId) {
      const location = await prismaMain.rpgLocation.findUnique({
        where: { id: locationId },
          title: true,
          locationScale: true,
          locationType: true,
      if (location) {
        contextData += `\n\nLocation Context:\n- Name: ${location.name}\n- Type: ${location.locationType}\n- Scale: ${location.locationScale}\n- Description: ${location.description || 'Not provided'}`
    // Build messages array
    const messages: Anthropic.MessageParam[] = []
    if (contextData) {
      messages.push({
        role: 'user',
        content: `Context:\n${contextData}`
        role: 'assistant',
        content: 'I understand the context and will incorporate it into my response.'
    messages.push({
      role: 'user',
      content: prompt
    })
    // Call Claude Sonnet (intelligent, balanced)
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: enhancedSystemPrompt,
      messages,
    const textContent = response.content.find(c => c.type === 'text')
    const gmResponse = textContent && 'text' in textContent ? textContent.text : ''
    // AUDIT LOG: Track AI usage for cost monitoring
    console.log(
      `[OWNER_AI_GM] Owner ${session.user.id} used AI GM (task: ${task}). Tokens: ${response.usage?.input_tokens || 0} in, ${response.usage?.output_tokens || 0} out`
    return NextResponse.json({
      response: gmResponse,
      task,
      usage: response.usage,
  } catch (error) {
    console.error('AI GM API error:', error)
    return NextResponse.json(
      { error: 'Failed to get AI GM assistance', details: String(error) },
      { status: 500 }
    )
  }
}
