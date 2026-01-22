import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  // Add this at the very top of the function
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // ... rest of your existing code

/**
 * ============================================
 * CLAUDE CHAT API ROUTE - src/app/api/chat/route.ts
 * ============================================
 * 
 * This is a Next.js API route - it handles HTTP requests.
 * Think of it like a Flask route or FastAPI endpoint.
 * 
 * URL: POST /api/chat
 * 
 * In Next.js App Router:
 * - Files named route.ts in /api folders become API endpoints
 * - The folder structure defines the URL path
 * - Export functions named GET, POST, PUT, DELETE, etc.
 * 
 * This route:
 * 1. Receives chat messages from the frontend
 * 2. Sends them to Claude API
 * 3. Streams back the response
 * ============================================
 */

// Import Anthropic SDK for Claude API
import Anthropic from '@anthropic-ai/sdk'

// Import Next.js types
import { NextRequest, NextResponse } from 'next/server'

// Create Anthropic client
// It automatically uses ANTHROPIC_API_KEY from environment
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

/**
 * System prompt for the planning AI
 * 
 * This is CRUCIAL - it defines how Claude behaves as your planning assistant.
 * Think of it like programming the AI's personality and capabilities.
 */
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



/**
 * POST handler for chat requests
 * 
 * @param request - The incoming HTTP request
 * @returns Streamed response from Claude
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the JSON body from the request
    // This is like request.get_json() in Flask
    const body = await request.json()
    
    // Extract data from the request body
    const { messages, habits, existingEvents } = body
    
    // Validate that messages exist
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }  // 400 = Bad Request
      )
    }
    
    // Build context for the AI about user's habits and existing events
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
    
    // Call Claude API with streaming
    // Streaming = get response word by word instead of waiting for full response
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',  // Good balance of speed and quality
      max_tokens: 1024,
      system: PLANNING_SYSTEM_PROMPT + contextAddition,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    })
    
    // Create a readable stream to send back to the client
    // This is more complex than Flask but enables real-time streaming
    const encoder = new TextEncoder()
    
    const readableStream = new ReadableStream({
      async start(controller) {
        // Listen for text events from Claude
        for await (const event of stream) {
          // Check if this event contains text
          if (event.type === 'content_block_delta') {
            const delta = event.delta as any
            if (delta.type === 'text_delta' && delta.text) {
              // Send the text chunk to the client
              controller.enqueue(encoder.encode(delta.text))
            }
          }
        }
        // Close the stream when done
        controller.close()
      },
    })
    
    // Return the stream as the response
    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
    
  } catch (error) {
    // Log the error for debugging
    console.error('Chat API error:', error)
    
    // Return an error response
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }  // 500 = Internal Server Error
    )
  }
}
