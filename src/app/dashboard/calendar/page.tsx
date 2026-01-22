/**
 * ============================================
 * CALENDAR PAGE - src/app/dashboard/calendar/page.tsx
 * ============================================
 * 
 * Shows the user's calendar with all their scheduled events.
 * Displays a week view with time blocks.
 * 
 * This is simpler than a full calendar library but gives
 * you control over the design.
 * ============================================
 */

"use client"

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  addWeeks, 
  subWeeks,
  isToday,
  isSameDay
} from 'date-fns'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  Trash2
} from 'lucide-react'

/**
 * Category colors for events
 */
const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
  work: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  meal: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
  sleep: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
  habit: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
  planning: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700' },
  personal: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700' },
  other: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700' },
}

export default function CalendarPage() {
  // Current week start date
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })  // Start on Monday
  )
  
  // Selected date (for mobile/detailed view)
  const [selectedDate, setSelectedDate] = useState(new Date())
  
  // Convex user ID
  const [convexUserId, setConvexUserId] = useState<string | null>(null)
  
  const { user } = useUser()
  
  // Get or create user
  const getOrCreateUser = useMutation(api.users.getOrCreateUser)
  
  // Calculate week dates
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: weekEnd })
  
  // Query events for the week
  const events = useQuery(
    api.events.getEventsByDateRange,
    convexUserId ? {
      userId: convexUserId as any,
      startDate: format(currentWeekStart, 'yyyy-MM-dd'),
      endDate: format(weekEnd, 'yyyy-MM-dd'),
    } : 'skip'
  )
  
  // Delete event mutation
  const deleteEvent = useMutation(api.events.deleteEvent)
  
  // Sync user
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
  
  // Navigate weeks
  function goToPreviousWeek() {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1))
  }
  
  function goToNextWeek() {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1))
  }
  
  function goToToday() {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
    setSelectedDate(new Date())
  }
  
  // Get events for a specific date
  function getEventsForDate(date: Date) {
    if (!events) return []
    const dateStr = format(date, 'yyyy-MM-dd')
    return events.filter((e) => e.date === dateStr)
  }
  
  // Handle event deletion
  async function handleDeleteEvent(eventId: string) {
    if (confirm('Are you sure you want to delete this event?')) {
      await deleteEvent({ eventId: eventId as any })
    }
  }
  
  // Events for selected date (for detail panel)
  const selectedDateEvents = getEventsForDate(selectedDate)
  
  return (
    <div className="h-[calc(100vh-0px)] flex flex-col">
      {/* Header */}
      <header className="p-6 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-brand-500" />
              Calendar
            </h1>
            
            {/* Week navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousWeek}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goToNextWeek}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <span className="text-slate-600 ml-2">
                {format(currentWeekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
              </span>
            </div>
          </div>
          
          <button
            onClick={goToToday}
            className="btn-secondary"
          >
            Today
          </button>
        </div>
      </header>
      
      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Week view */}
        <div className="flex-1 overflow-auto p-6">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-4 mb-4">
            {weekDays.map((day) => (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`text-center p-3 rounded-xl transition-colors ${
                  isToday(day)
                    ? 'bg-brand-500 text-white'
                    : isSameDay(day, selectedDate)
                    ? 'bg-brand-100 text-brand-700'
                    : 'hover:bg-slate-100'
                }`}
              >
                <div className="text-xs font-medium uppercase tracking-wider opacity-70">
                  {format(day, 'EEE')}
                </div>
                <div className="text-2xl font-bold mt-1">
                  {format(day, 'd')}
                </div>
              </button>
            ))}
          </div>
          
          {/* Events grid */}
          <div className="grid grid-cols-7 gap-4">
            {weekDays.map((day) => {
              const dayEvents = getEventsForDate(day)
              
              return (
                <div 
                  key={day.toISOString()}
                  className={`min-h-[200px] rounded-xl border p-2 ${
                    isSameDay(day, selectedDate)
                      ? 'border-brand-300 bg-brand-50/30'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  {dayEvents.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">
                      No events
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {dayEvents.map((event) => {
                        const colors = categoryColors[event.category] || categoryColors.other
                        return (
                          <li
                            key={event._id}
                            className={`p-2 rounded-lg border text-xs ${colors.bg} ${colors.border}`}
                          >
                            <div className={`font-medium truncate ${colors.text}`}>
                              {event.title}
                            </div>
                            <div className="text-slate-500 mt-0.5">
                              {event.startTime.slice(11, 16)}
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Day detail panel */}
        <aside className="w-80 border-l border-slate-200 bg-white p-6 overflow-auto">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            {format(selectedDate, 'EEEE')}
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            {format(selectedDate, 'MMMM d, yyyy')}
          </p>
          
          {selectedDateEvents.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No events scheduled</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {selectedDateEvents.map((event) => {
                const colors = categoryColors[event.category] || categoryColors.other
                return (
                  <li
                    key={event._id}
                    className={`p-3 rounded-xl border ${colors.bg} ${colors.border}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className={`font-medium ${colors.text}`}>
                          {event.title}
                        </h3>
                        <div className="flex items-center gap-1 text-slate-500 text-sm mt-1">
                          <Clock className="w-3.5 h-3.5" />
                          {event.startTime.slice(11, 16)} - {event.endTime.slice(11, 16)}
                        </div>
                        {event.description && (
                          <p className="text-sm text-slate-600 mt-2">
                            {event.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteEvent(event._id)}
                        className="p-1.5 hover:bg-white/50 rounded-lg transition-colors text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-200/50 flex items-center justify-between text-xs">
                      <span className={`px-2 py-0.5 rounded-full ${colors.text} bg-white/50`}>
                        {event.category}
                      </span>
                      <span className="text-slate-400">
                        {event.createdBy === 'ai' ? '🤖 AI' : '👤 You'}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </aside>
      </div>
    </div>
  )
}
