// Marie AI query API endpoint
// POST /api/marie/query - accepts { query }, returns { response, usage }
// Uses @anthropic-ai/sdk directly with tool_use loop

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { buildSystemPrompt } from '@/lib/marie/system-prompt'
import { getMarieTools, executeTool } from '@/lib/marie/tools'
import { checkUsageLimit, UsageLimitError } from '@/lib/billing/enforce'
import type { UserRole } from '@/types/database'

const anthropic = new Anthropic()

const MAX_TOOL_LOOPS = 5
const MODEL = process.env.MARIE_MODEL || 'claude-sonnet-4-20250514'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const supabase = await createClient()

  // Validate user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  let queryText = ''
  try {
    const body = await request.json()
    queryText = body.query
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!queryText || typeof queryText !== 'string') {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 })
  }

  // Check AI query limit before calling Claude
  try {
    await checkUsageLimit(profile.org_id, 'ai_queries')
  } catch (err) {
    if (err instanceof UsageLimitError) {
      return NextResponse.json(
        { error: 'AI query limit reached. Upgrade your plan for more queries.' },
        { status: 402 }
      )
    }
    throw err
  }

  try {
    // Build context
    const systemPrompt = await buildSystemPrompt(
      supabase,
      profile.role as UserRole
    )

    // Get role-filtered tools
    const tools = getMarieTools(profile.role as UserRole)

    // Tool use loop
    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: queryText },
    ]
    let response: Anthropic.Message
    let loopCount = 0

    do {
      response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        ...(tools.length > 0 ? { tools: tools as Anthropic.Tool[] } : {}),
        messages,
      })

      if (response.stop_reason === 'tool_use') {
        messages.push({ role: 'assistant', content: response.content })
        const toolResults: Anthropic.ToolResultBlockParam[] = []

        for (const block of response.content) {
          if (block.type === 'tool_use') {
            const result = await executeTool(
              block.name,
              block.input as Record<string, unknown>,
              supabase,
              profile.org_id,
              user.id
            )
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify(result),
            })
          }
        }
        messages.push({ role: 'user', content: toolResults })
      }
      loopCount++
    } while (response.stop_reason === 'tool_use' && loopCount < MAX_TOOL_LOOPS)

    // Extract text response
    const responseText = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')

    // Log query
    const latencyMs = Date.now() - startTime
    await supabase.from('marie_queries').insert({
      org_id: profile.org_id,
      user_id: user.id,
      query_text: queryText,
      response_text: responseText,
      query_type: loopCount > 1 ? 'action' : 'question',
      tokens_used:
        (response.usage?.input_tokens ?? 0) +
        (response.usage?.output_tokens ?? 0),
      latency_ms: latencyMs,
      model: MODEL,
      success: true,
      error_message: null,
    })

    return NextResponse.json({
      response: responseText,
      usage: response.usage,
    })
  } catch (err) {
    // Log failed query
    const latencyMs = Date.now() - startTime
    const errorMessage =
      err instanceof Error ? err.message : 'Unknown error'

    try {
      await supabase
        .from('marie_queries')
        .insert({
          org_id: profile.org_id,
          user_id: user.id,
          query_text: queryText,
          response_text: null,
          query_type: 'question',
          tokens_used: 0,
          latency_ms: latencyMs,
          model: MODEL,
          success: false,
          error_message: errorMessage,
        })
    } catch {
      // Best-effort logging -- don't throw if logging fails
    }

    return NextResponse.json(
      { error: 'Marie encountered an error. Please try again.' },
      { status: 500 }
    )
  }
}
