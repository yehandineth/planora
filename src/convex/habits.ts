/**
 * ============================================
 * CONVEX HABITS FUNCTIONS - src/convex/habits.ts
 * ============================================
 * 
 * Database operations for habits and habit tracking.
 * Handles creating habits, logging completions, and calculating streaks.
 * ============================================
 */

import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

/**
 * Get all habits for a user
 */
export const getHabits = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect()
    
    // Sort by creation date (newest first)
    return habits.sort((a, b) => b.createdAt - a.createdAt)
  },
})

/**
 * Get only active habits for a user
 */
export const getActiveHabits = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect()
    
    // Filter to active only and sort by name
    return habits
      .filter((h) => h.isActive)
      .sort((a, b) => a.name.localeCompare(b.name))
  },
})

/**
 * Create a new habit
 */
export const createHabit = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    frequency: v.union(
      v.literal("daily"),
      v.literal("weekdays"),
      v.literal("weekends"),
      v.literal("weekly"),
      v.literal("custom")
    ),
    customDays: v.optional(v.array(v.number())),
    preferredTime: v.optional(v.union(
      v.literal("morning"),
      v.literal("afternoon"),
      v.literal("evening"),
      v.literal("flexible")
    )),
    durationMinutes: v.number(),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const habitId = await ctx.db.insert("habits", {
      ...args,
      currentStreak: 0,
      bestStreak: 0,
      isActive: true,
      createdAt: Date.now(),
    })
    
    return habitId
  },
})

/**
 * Update a habit
 */
export const updateHabit = mutation({
  args: {
    habitId: v.id("habits"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    frequency: v.optional(v.union(
      v.literal("daily"),
      v.literal("weekdays"),
      v.literal("weekends"),
      v.literal("weekly"),
      v.literal("custom")
    )),
    customDays: v.optional(v.array(v.number())),
    preferredTime: v.optional(v.union(
      v.literal("morning"),
      v.literal("afternoon"),
      v.literal("evening"),
      v.literal("flexible")
    )),
    durationMinutes: v.optional(v.number()),
    color: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { habitId, ...updates } = args
    
    // Filter out undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    )
    
    await ctx.db.patch(habitId, cleanUpdates)
    
    return { success: true }
  },
})

/**
 * Delete a habit
 */
export const deleteHabit = mutation({
  args: {
    habitId: v.id("habits"),
  },
  handler: async (ctx, args) => {
    // Also delete all logs for this habit
    const logs = await ctx.db
      .query("habitLogs")
      .withIndex("by_habit_and_date", (q) => q.eq("habitId", args.habitId))
      .collect()
    
    await Promise.all(logs.map((log) => ctx.db.delete(log._id)))
    
    // Delete the habit itself
    await ctx.db.delete(args.habitId)
    
    return { success: true }
  },
})

/**
 * Log habit completion for a specific date
 */
export const logHabitCompletion = mutation({
  args: {
    habitId: v.id("habits"),
    userId: v.id("users"),
    date: v.string(),
    completed: v.boolean(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if there's already a log for this habit on this date
    const existingLog = await ctx.db
      .query("habitLogs")
      .withIndex("by_habit_and_date", (q) => 
        q.eq("habitId", args.habitId).eq("date", args.date)
      )
      .unique()
    
    if (existingLog) {
      // Update existing log
      await ctx.db.patch(existingLog._id, {
        completed: args.completed,
        notes: args.notes,
      })
    } else {
      // Create new log
      await ctx.db.insert("habitLogs", {
        habitId: args.habitId,
        userId: args.userId,
        date: args.date,
        completed: args.completed,
        notes: args.notes,
        createdAt: Date.now(),
      })
    }
    
    // Update streak for this habit
    await updateStreak(ctx, args.habitId)
    
    return { success: true }
  },
})

/**
 * Helper function to update streak count
 * Not exported - only used internally
 */
async function updateStreak(ctx: any, habitId: any) {
  // Get the habit
  const habit = await ctx.db.get(habitId)
  if (!habit) return
  
  // Get all logs for this habit, sorted by date descending
  const logs = await ctx.db
    .query("habitLogs")
    .withIndex("by_habit_and_date", (q) => q.eq("habitId", habitId))
    .collect()
  
  // Sort by date descending (most recent first)
  logs.sort((a: any, b: any) => b.date.localeCompare(a.date))
  
  // Calculate current streak
  let currentStreak = 0
  const today = new Date().toISOString().split('T')[0]  // YYYY-MM-DD
  
  // Start from today and go backwards
  let checkDate = new Date(today)
  
  for (let i = 0; i < logs.length; i++) {
    const log = logs[i]
    const logDate = log.date
    const expectedDate = checkDate.toISOString().split('T')[0]
    
    if (logDate === expectedDate && log.completed) {
      currentStreak++
      // Move to previous day
      checkDate.setDate(checkDate.getDate() - 1)
    } else if (logDate === expectedDate && !log.completed) {
      // Streak broken
      break
    } else {
      // Missing day - streak broken (unless it's future date)
      break
    }
  }
  
  // Update the habit with new streak
  const bestStreak = Math.max(habit.bestStreak, currentStreak)
  
  await ctx.db.patch(habitId, {
    currentStreak,
    bestStreak,
  })
}

/**
 * Get habit logs for a specific date (all habits)
 */
export const getHabitLogsByDate = query({
  args: {
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("habitLogs")
      .withIndex("by_user_and_date", (q) => 
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .collect()
    
    return logs
  },
})

/**
 * Get habit completion stats for a date range
 * Useful for showing weekly/monthly progress
 */
export const getHabitStats = query({
  args: {
    habitId: v.id("habits"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("habitLogs")
      .withIndex("by_habit_and_date", (q) => q.eq("habitId", args.habitId))
      .collect()
    
    // Filter to date range
    const filteredLogs = logs.filter(
      (log) => log.date >= args.startDate && log.date <= args.endDate
    )
    
    const completedCount = filteredLogs.filter((log) => log.completed).length
    const totalCount = filteredLogs.length
    
    return {
      completed: completedCount,
      total: totalCount,
      percentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
    }
  },
})
