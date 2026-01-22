/**
 * ============================================
 * AI PLANNING PAGE - src/app/dashboard/plan/page.tsx
 * ============================================
 * 
 * This is the CORE FEATURE of your app!
 * 
 * Here users chat with Claude to plan their day.
 * The AI asks questions, understands their schedule,
 * and creates a plan that gets saved to the calendar.
 * 
 * KEY CONCEPTS:
 * - useState: Like a Python variable that triggers re-render when changed
 * - useEffect: Code that runs after render (like componentDidMount)
 * - useRef: A mutable reference that persists across renders
 * - fetch: Built-in function to make HTTP requests (like requests.get in Python)
 * ============================================
 */

"use client"

import { useState, useRef, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { format, addDays } from 'date-fns'
import { 
  Send, 
  Loader2, 
  Sparkles, 
  Calendar,
  Check,
  RefreshCw
} from 'lucide-react'

/**
 * Message type - represents a chat message
 * 
 * In Python this would be:
 * @dataclass
 * class Message:
 *     role: Literal["user", "assistant"]
 *     content: str
 */
interface Message {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Event type for parsed schedule
 */
interface ParsedEvent {
  title: string
  startTime: string
  endTime: string
  category: string
  description?: string
}

export default function PlanPage() {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  
  // Chat messages history
  const [messages, setMessages] = useState<Message[]>([])
  
  // Current input text
  const [input, setInput] = useState('')
  
  // Loading state while waiting for AI response
  const [isLoading, setIsLoading] = useState(false)
  
  // Parsed schedule from AI (when planning is complete)
  const [parsedSchedule, setParsedSchedule] = useState<ParsedEvent[] | null>(null)
  
  // Did user confirm the schedule?
  const [scheduleConfirmed, setScheduleConfirmed] = useState(false)
  
  // User ID from Convex
  const [convexUserId, setConvexUserId] = useState<string | null>(null)
  
  // Reference to scroll container (to auto-scroll to bottom)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // ============================================
  // HOOKS & QUERIES
  // ============================================
  
  const { user } = useUser()
  
  // Tomorrow's date (we're planning for tomorrow)
  const tomorrow = addDays(new Date(), 1)
  const tomorrowFormatted = format(tomorrow, 'EEEE, MMMM d')
  const tomorrowDate = format(tomorrow, 'yyyy-MM-dd')
  
  // Get or create user mutation
  const getOrCreateUser = useMutation(api.users.getOrCreateUser)
  
  // Get user's habits
  const habits = useQuery(
    api.habits.getActiveHabits,
    convexUserId ? { userId: convexUserId as any } : 'skip'
  )
  
  // Create events mutation
  const createManyEvents = useMutation(api.events.createManyEvents)
  
  // ============================================
  // EFFECTS
  // ============================================
  
  // Sync user to Convex on mount
  useEffect(() => {
    async function syncUser() {
      if (user?.id && user?.emailAddresses?.[0]?.emailAddress) {
        const userId = await getOrCreateUser({
          clerkId: user.id,
          email: user.emailAddresses[0].emailAddress,
          name: user.firstName || undefined,
        })
        setConvexUserId(userId)
      }
    }
    syncUser()
  }, [user, getOrCreateUser])
  
  // Send initial greeting when component mounts
  useEffect(() => {
    if (messages.length === 0) {
      // Add initial AI message
      setMessages([{
        role: 'assistant',
        content: `Hi! 👋 I'm here to help you plan your day for **${tomorrowFormatted}**.\n\nLet's make tomorrow great! First, tell me - do you have work or school tomorrow? If so, what time do you need to start and finish?`
      }])
    }
  }, [tomorrowFormatted, messages.length])
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  // ============================================
  // HANDLERS
  // ============================================
  
  /**
   * Handle form submission
   * Sends user message to Claude API and streams response
   */
  async function handleSubmit(e: React.FormEvent) {
    // Prevent page reload (default form behavior)
    e.preventDefault()
    
    // Don't submit if input is empty or already loading
    if (!input.trim() || isLoading) return
    
    // Add user message to chat
    const userMessage: Message = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')  // Clear input
    setIsLoading(true)
    
    try {
      // Call our API route
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          habits: habits || [],
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to get response')
      }
      
      // Read the streamed response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      
      // Start with empty assistant message
      let assistantMessage = ''
      setMessages([...newMessages, { role: 'assistant', content: '' }])
      
      // Read stream chunks
      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        
        // Decode the chunk and add to message
        const chunk = decoder.decode(value, { stream: true })
        assistantMessage += chunk
        
        // Update the assistant message in state
        setMessages([
          ...newMessages,
          { role: 'assistant', content: assistantMessage }
        ])
      }
      
      // Check if the response contains a JSON schedule
      const jsonMatch = assistantMessage.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1])
          if (parsed.events && Array.isArray(parsed.events)) {
            setParsedSchedule(parsed.events)
          }
        } catch (e) {
          // JSON parsing failed, that's okay
          console.log('No valid JSON in response')
        }
      }
      
    } catch (error) {
      console.error('Chat error:', error)
      // Add error message
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }
      ])
    } finally {
      setIsLoading(false)
    }
  }
  
  /**
   * Save the parsed schedule to the calendar
   */
  async function handleConfirmSchedule() {
    if (!parsedSchedule || !convexUserId) return
    
    setIsLoading(true)
    
    try {
      // Transform events for database
      const eventsToCreate = parsedSchedule.map((event) => ({
        title: event.title,
        description: event.description,
        startTime: `${tomorrowDate}T${event.startTime}:00`,
        endTime: `${tomorrowDate}T${event.endTime}:00`,
        date: tomorrowDate,
        category: (event.category || 'other') as any,
        isRecurring: false,
        createdBy: 'ai' as const,
      }))
      
      // Save to database
      await createManyEvents({
        userId: convexUserId as any,
        events: eventsToCreate,
      })
      
      setScheduleConfirmed(true)
      
      // Add confirmation message
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `✅ **Your schedule for ${tomorrowFormatted} is saved!**\n\nYou can view it in your calendar. Have a productive day tomorrow! 🚀`
        }
      ])
      
    } catch (error) {
      console.error('Error saving schedule:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I had trouble saving your schedule. Please try again.'
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }
  
  /**
   * Reset and start over
   */
  function handleStartOver() {
    setMessages([{
      role: 'assistant',
      content: `Let's start fresh! 🔄\n\nWhat would you like to plan for **${tomorrowFormatted}**? Do you have work tomorrow?`
    }])
    setParsedSchedule(null)
    setScheduleConfirmed(false)
  }
  
  // ============================================
  // RENDER
  // ============================================
  
  return (
    <div className="h-[calc(100vh-0px)] flex flex-col">
      {/* Header */}
      <header className="p-6 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-500" />
              Plan Your Day
            </h1>
            <p className="text-slate-600">
              Planning for {tomorrowFormatted}
            </p>
          </div>
          
          {messages.length > 1 && (
            <button
              onClick={handleStartOver}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Start Over
            </button>
          )}
        </div>
      </header>
      
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-brand-500 text-white'
                  : 'bg-white border border-slate-200 text-slate-900'
              }`}
            >
              {/* Render markdown-ish content (bold, newlines) */}
              <div 
                className="whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: message.content
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br />')
                }}
              />
            </div>
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
              <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
            </div>
          </div>
        )}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Schedule Preview (when AI generates one) */}
      {parsedSchedule && !scheduleConfirmed && (
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="max-w-2xl mx-auto">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Your Schedule Preview
            </h3>
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 max-h-48 overflow-y-auto">
              <ul className="space-y-2">
                {parsedSchedule.map((event, index) => (
                  <li key={index} className="flex items-center gap-3 text-sm">
                    <span className="text-slate-500 w-20">
                      {event.startTime}
                    </span>
                    <span className="font-medium text-slate-900">
                      {event.title}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={handleConfirmSchedule}
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Save to Calendar
                </>
              )}
            </button>
          </div>
        </div>
      )}
      
      {/* Input Form */}
      <form 
        onSubmit={handleSubmit}
        className="p-4 border-t border-slate-200 bg-white"
      >
        <div className="max-w-2xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading || scheduleConfirmed}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 
                       focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                       disabled:bg-slate-100 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || scheduleConfirmed}
            className="btn-primary px-6 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
