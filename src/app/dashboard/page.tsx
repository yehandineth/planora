/**
 * ============================================
 * DASHBOARD HOME PAGE - src/app/dashboard/page.tsx
 * ============================================
 * 
 * The main dashboard view showing:
 * - Today's schedule overview
 * - Quick actions (plan day, view habits)
 * - Habit streak summary
 * 
 * This is a Client Component because it uses hooks.
 * ============================================
 */

"use client"

import { useUser } from '@clerk/nextjs'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Calendar, 
  MessageSquare, 
  Target, 
  Sparkles,
  ChevronRight,
  Clock,
  Flame
} from 'lucide-react'
import { format } from 'date-fns'

/**
 * Helper to get greeting based on time of day
 */
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

/**
 * Category colors for event badges
 */
const categoryColors: Record<string, string> = {
  work: 'bg-blue-100 text-blue-700',
  meal: 'bg-green-100 text-green-700',
  sleep: 'bg-purple-100 text-purple-700',
  habit: 'bg-orange-100 text-orange-700',
  planning: 'bg-brand-100 text-brand-700',
  personal: 'bg-pink-100 text-pink-700',
  other: 'bg-slate-100 text-slate-700',
}

export default function DashboardPage() {
  // Get current user from Clerk
  const { user } = useUser()
  
  // State for current user's Convex data
  const [convexUserId, setConvexUserId] = useState<string | null>(null)
  
  // Today's date in YYYY-MM-DD format
  const today = format(new Date(), 'yyyy-MM-dd')
  const todayFormatted = format(new Date(), 'EEEE, MMMM d')  // "Monday, January 15"
  
  // Mutation to get or create user in Convex
  const getOrCreateUser = useMutation(api.users.getOrCreateUser)
  
  // Query to get current user data (only runs when we have the clerk ID)
  const convexUser = useQuery(
    api.users.getCurrentUser,
    user?.id ? { clerkId: user.id } : 'skip'  // 'skip' = don't run query
  )
  
  // Query today's events (only when we have convexUserId)
  const todayEvents = useQuery(
    api.events.getEventsByDate,
    convexUserId ? { userId: convexUserId as any, date: today } : 'skip'
  )
  
  // Query active habits
  const habits = useQuery(
    api.habits.getActiveHabits,
    convexUserId ? { userId: convexUserId as any } : 'skip'
  )
  
  // Sync Clerk user to Convex on mount
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
  
  // Also set convexUserId if we already have the user data
  useEffect(() => {
    if (convexUser?._id) {
      setConvexUserId(convexUser._id)
    }
  }, [convexUser])
  
  return (
    <div className="p-8">
      {/* Header with greeting */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          {getGreeting()}, {user?.firstName || 'there'}! 👋
        </h1>
        <p className="text-slate-600">
          {todayFormatted} • Here's your day at a glance
        </p>
      </header>
      
      {/* Quick Actions */}
      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {/* Plan Tomorrow Card */}
        <Link 
          href="/dashboard/plan" 
          className="card hover:shadow-md transition-shadow group"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-brand-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                Plan Tomorrow
              </h3>
              <p className="text-slate-600 text-sm">
                Chat with AI to plan your perfect day
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-brand-500 transition-colors" />
          </div>
        </Link>
        
        {/* View Calendar Card */}
        <Link 
          href="/dashboard/calendar" 
          className="card hover:shadow-md transition-shadow group"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                View Calendar
              </h3>
              <p className="text-slate-600 text-sm">
                See your scheduled events and time blocks
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-green-500 transition-colors" />
          </div>
        </Link>
        
        {/* Manage Habits Card */}
        <Link 
          href="/dashboard/habits" 
          className="card hover:shadow-md transition-shadow group"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                Manage Habits
              </h3>
              <p className="text-slate-600 text-sm">
                Track habits and view your streaks
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-orange-500 transition-colors" />
          </div>
        </Link>
      </section>
      
      {/* Main content grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <section className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Today's Schedule
            </h2>
            <Link 
              href="/dashboard/calendar" 
              className="text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              View all
            </Link>
          </div>
          
          {!todayEvents || todayEvents.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 mb-4">No events scheduled for today</p>
              <Link href="/dashboard/plan" className="btn-primary inline-flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Plan your day
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {todayEvents.slice(0, 5).map((event) => (
                <li 
                  key={event._id} 
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
                >
                  <div className="flex items-center gap-2 text-sm text-slate-500 w-24 shrink-0">
                    <Clock className="w-4 h-4" />
                    {event.startTime.slice(0, 5)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {event.title}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${categoryColors[event.category]}`}>
                    {event.category}
                  </span>
                </li>
              ))}
              {todayEvents.length > 5 && (
                <li className="text-center">
                  <Link 
                    href="/dashboard/calendar" 
                    className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                  >
                    +{todayEvents.length - 5} more events
                  </Link>
                </li>
              )}
            </ul>
          )}
        </section>
        
        {/* Habit Streaks */}
        <section className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Habit Streaks
            </h2>
            <Link 
              href="/dashboard/habits" 
              className="text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              View all
            </Link>
          </div>
          
          {!habits || habits.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 mb-4">No habits tracked yet</p>
              <Link href="/dashboard/habits" className="btn-primary inline-flex items-center gap-2">
                <Target className="w-4 h-4" />
                Add a habit
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {habits.slice(0, 5).map((habit) => (
                <li 
                  key={habit._id} 
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
                >
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: habit.color || '#f1f5f9' }}
                  >
                    <Target className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {habit.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {habit.frequency} • {habit.durationMinutes} mins
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-orange-600">
                    <Flame className="w-4 h-4" />
                    <span className="font-semibold">{habit.currentStreak}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
