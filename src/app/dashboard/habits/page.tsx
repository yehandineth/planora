/**
 * ============================================
 * HABITS PAGE - src/app/dashboard/habits/page.tsx
 * ============================================
 * 
 * Manage and track habits.
 * Users can:
 * - Add new habits
 * - View habit streaks
 * - Mark habits as complete for today
 * ============================================
 */

"use client"

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { format } from 'date-fns'
import { 
  Target, 
  Plus, 
  Flame, 
  Check, 
  X,
  Clock,
  Trash2,
  Edit2
} from 'lucide-react'

/**
 * Available colors for habits
 */
const habitColors = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
]

/**
 * Frequency options
 */
const frequencyOptions = [
  { value: 'daily', label: 'Every day' },
  { value: 'weekdays', label: 'Weekdays only' },
  { value: 'weekends', label: 'Weekends only' },
  { value: 'weekly', label: 'Once a week' },
]

/**
 * Time preference options
 */
const timeOptions = [
  { value: 'morning', label: '🌅 Morning' },
  { value: 'afternoon', label: '☀️ Afternoon' },
  { value: 'evening', label: '🌙 Evening' },
  { value: 'flexible', label: '🔄 Flexible' },
]

export default function HabitsPage() {
  // State
  const [convexUserId, setConvexUserId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  
  // Form state for new habit
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    frequency: 'daily',
    preferredTime: 'flexible',
    durationMinutes: 30,
    color: habitColors[0],
  })
  
  const { user } = useUser()
  const today = format(new Date(), 'yyyy-MM-dd')
  
  // Mutations
  const getOrCreateUser = useMutation(api.users.getOrCreateUser)
  const createHabit = useMutation(api.habits.createHabit)
  const deleteHabit = useMutation(api.habits.deleteHabit)
  const logHabitCompletion = useMutation(api.habits.logHabitCompletion)
  
  // Queries
  const habits = useQuery(
    api.habits.getHabits,
    convexUserId ? { userId: convexUserId as any } : 'skip'
  )
  
  const todayLogs = useQuery(
    api.habits.getHabitLogsByDate,
    convexUserId ? { userId: convexUserId as any, date: today } : 'skip'
  )
  
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
  
  // Check if habit is completed today
  function isHabitCompletedToday(habitId: string): boolean {
    if (!todayLogs) return false
    return todayLogs.some((log) => log.habitId === habitId && log.completed)
  }
  
  // Handle form submission
  async function handleCreateHabit(e: React.FormEvent) {
    e.preventDefault()
    if (!convexUserId || !newHabit.name.trim()) return
    
    await createHabit({
      userId: convexUserId as any,
      name: newHabit.name.trim(),
      description: newHabit.description.trim() || undefined,
      frequency: newHabit.frequency as any,
      preferredTime: newHabit.preferredTime as any,
      durationMinutes: newHabit.durationMinutes,
      color: newHabit.color,
    })
    
    // Reset form
    setNewHabit({
      name: '',
      description: '',
      frequency: 'daily',
      preferredTime: 'flexible',
      durationMinutes: 30,
      color: habitColors[0],
    })
    setShowAddForm(false)
  }
  
  // Handle habit completion toggle
  async function handleToggleCompletion(habitId: string) {
    if (!convexUserId) return
    
    const isCompleted = isHabitCompletedToday(habitId)
    
    await logHabitCompletion({
      habitId: habitId as any,
      userId: convexUserId as any,
      date: today,
      completed: !isCompleted,
    })
  }
  
  // Handle habit deletion
  async function handleDeleteHabit(habitId: string) {
    if (confirm('Are you sure you want to delete this habit? This will also delete all completion history.')) {
      await deleteHabit({ habitId: habitId as any })
    }
  }
  
  return (
    <div className="p-8">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-brand-500" />
            Habits
          </h1>
          <p className="text-slate-600">
            Build better habits, one day at a time
          </p>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Habit
        </button>
      </header>
      
      {/* Add Habit Modal/Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Create New Habit
            </h2>
            
            <form onSubmit={handleCreateHabit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Habit Name *
                </label>
                <input
                  type="text"
                  value={newHabit.name}
                  onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                  placeholder="e.g., Go to the gym"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
              
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newHabit.description}
                  onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                  placeholder="Optional details..."
                  rows={2}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              
              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Frequency
                </label>
                <select
                  value={newHabit.frequency}
                  onChange={(e) => setNewHabit({ ...newHabit, frequency: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {frequencyOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Preferred Time */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Preferred Time
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {timeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setNewHabit({ ...newHabit, preferredTime: opt.value })}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                        newHabit.preferredTime === opt.value
                          ? 'bg-brand-100 text-brand-700 border-2 border-brand-500'
                          : 'bg-slate-100 text-slate-600 border-2 border-transparent hover:bg-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={newHabit.durationMinutes}
                  onChange={(e) => setNewHabit({ ...newHabit, durationMinutes: parseInt(e.target.value) || 30 })}
                  min={5}
                  max={240}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              
              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Color
                </label>
                <div className="flex gap-2">
                  {habitColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewHabit({ ...newHabit, color })}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        newHabit.color === color ? 'scale-125 ring-2 ring-offset-2 ring-slate-400' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              
              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  Create Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Habits List */}
      {!habits || habits.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            No habits yet
          </h3>
          <p className="text-slate-600 mb-6">
            Start building better habits by adding your first one.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Your First Habit
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {habits.map((habit) => {
            const isCompleted = isHabitCompletedToday(habit._id)
            
            return (
              <div
                key={habit._id}
                className={`card relative overflow-hidden ${
                  isCompleted ? 'bg-green-50 border-green-200' : ''
                }`}
              >
                {/* Color bar */}
                <div 
                  className="absolute top-0 left-0 w-1 h-full"
                  style={{ backgroundColor: habit.color || '#94a3b8' }}
                />
                
                <div className="pl-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {habit.name}
                      </h3>
                      {habit.description && (
                        <p className="text-sm text-slate-500 mt-1">
                          {habit.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Completion button */}
                    <button
                      onClick={() => handleToggleCompletion(habit._id)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {habit.durationMinutes}m
                    </span>
                    <span className="flex items-center gap-1 text-orange-600">
                      <Flame className="w-4 h-4" />
                      {habit.currentStreak} streak
                    </span>
                    <span className="text-slate-400">
                      Best: {habit.bestStreak}
                    </span>
                  </div>
                  
                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-400">
                      {habit.frequency} • {habit.preferredTime || 'flexible'}
                    </span>
                    <button
                      onClick={() => handleDeleteHabit(habit._id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
