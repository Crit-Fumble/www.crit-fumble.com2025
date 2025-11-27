/**
 * AI Assistance API - Haiku for Rule Assistance and Fast Responses
 * Fast, cost-effective responses for rules clarification and quick answers
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

/**
 * POST /api/ai/assist
 * Get quick rule assistance using Claude Haiku
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
    const user = await prismaMain.critUser.findUnique({
      where: { id: session.user.id },
    });
    if (!user || !isOwner(user)) {
      return NextResponse.json(
        { error: 'Forbidden - Owner access required (AI features in beta)' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { prompt, context, systemPrompt } = body
    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing required field: prompt' },
        { status: 400 }
      )
    }

    // Build system message
    const systemMessage = systemPrompt || `You are a helpful TTRPG rules assistant for the Crit-Fumble platform.
Provide clear, concise answers about game rules, mechanics, and gameplay questions.
Focus on D&D 5e and compatible systems unless otherwise specified.
Be helpful but brief - users want quick answers.`
    // Build messages array
    const messages: Anthropic.MessageParam[] = []
    if (context) {
      messages.push({
        role: 'user',
        content: `Context: ${context}`
      })
      messages.push({
        role: 'assistant',
        content: 'I understand the context. How can I help?'
      })
    }
    messages.push({
      role: 'user',
      content: prompt
    })
    // Call Claude Haiku (fast, cost-effective)
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      system: systemMessage,
      messages,
    })

    const textContent = response.content.find(c => c.type === 'text')
    const assistantResponse = textContent && 'text' in textContent ? textContent.text : ''

    // AUDIT LOG: Track AI usage for cost monitoring
    console.log(
      `[OWNER_AI_ASSIST] Owner ${session.user.id} used AI assist. Tokens: ${response.usage?.input_tokens || 0} in, ${response.usage?.output_tokens || 0} out`
    )

    return NextResponse.json({
      response: assistantResponse,
      usage: response.usage,
    })
  } catch (error) {
    console.error('AI Assist API error:', error)
    return NextResponse.json(
      { error: 'Failed to get AI assistance', details: String(error) },
      { status: 500 }
    )
  }
}
