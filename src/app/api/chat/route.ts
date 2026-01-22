/**
 * ============================================
 * CLAUDE CHAT API ROUTE - src/app/api/chat/route.ts
 * ============================================
 */

import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const PLANNING_SYSTEM_PROMPT = `You are a friendly and helpful AI life planning assistant. Your job is to help users plan their day for tomorrow in a conversational way.

## Your Personality:
- Warm, encouraging, and supportive
- Practical and focused on actionable plans
- Aware that building good habits is hard
- You celebrate small wins

## Your Process:
When helping someone plan their day, gather information conversationally:

1. First, ask about their fixed commitments (work hours, meetings, appointments)
2. Then ask about any special events or deadlines
3. Ask about their energy patterns (when are they most productive?)
4. Review their habits they want to build and suggest times for them
5. Suggest optimal times for:
   - 3 meals (breakfast, lunch, dinner)
   - Sleep/wake times (aim for 7-8 hours)
   - Their habit goals

## Important Guidelines:
- Ask ONE or TWO questions at a time - don't overwhelm them
- Be conversational, not like a form
- If they mention habits they're trying to build, proactively schedule time for them
- Suggest realistic timeframes - don't pack the day too tight
- Leave buffer time between activities
- Consider their energy levels (don't schedule gym when they said they're tired in mornings)

## Output Format:
When you have enough information and the user confirms the plan, output the schedule in this JSON format (wrap in \`\`\`json code blocks):

\`\`\`json
{
  "events": [
    {
      "title": "Event name",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "category": "work|meal|sleep|habit|planning|personal|other",
      "description": "Optional description"
    }
  ],
  "summary": "Brief summary of the day plan"
}
\`\`\`

Only output this JSON when the user has confirmed they're happy with the plan. Until then, keep the conversation going naturally.

Remember: You're helping them build a sustainable routine, not a perfect one. Progress over perfection!`

export async function POST(request: NextRequest) {
  try {
    // Auth check - only logged in users can use this
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { messages, habits, existingEvents } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      )
    }

    let contextAddition = ''

    if (habits && habits.length > 0) {
      contextAddition += '\n\n## User\'s Habits to Schedule:\n'
      habits.forEach((habit: any) => {
        contextAddition += `- ${habit.name} (${habit.durationMinutes} mins, prefers ${habit.preferredTime || 'flexible'} time)\n`
      })
    }

    if (existingEvents && existingEvents.length > 0) {
      contextAddition += '\n\n## Already Scheduled Events:\n'
      existingEvents.forEach((event: any) => {
        contextAddition += `- ${event.title}: ${event.startTime} - ${event.endTime}\n`
      })
    }

    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: PLANNING_SYSTEM_PROMPT + contextAddition,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    })

    const encoder = new TextEncoder()

    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const event of stream) {
          if (event.type === 'content_block_delta') {
            const delta = event.delta as any
            if (delta.type === 'text_delta' && delta.text) {
              controller.enqueue(encoder.encode(delta.text))
            }
          }
        }
        controller.close()
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    )
  }
}