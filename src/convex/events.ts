/**
 * ============================================
 * CONVEX EVENTS FUNCTIONS - src/convex/events.ts
 * ============================================
 * 
 * Database operations for calendar events.
 * These handle creating, reading, updating, and deleting events.
 * 
 * In Python terms, this is like your events API views/handlers.
 * ============================================
 */

import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

/**
 * Get all events for a user on a specific date
 * 
 * @param userId - The user's Convex ID
 * @param date - The date in YYYY-MM-DD format
 */
export const getEventsByDate = query({
  args: {
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    // Query events using our compound index
    const events = await ctx.db
      .query("calendarEvents")
      .withIndex("by_user_and_date", (q) => 
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .collect()  // .collect() returns all matching results as an array
    
    // Sort by start time
    // localeCompare is like Python's string comparison
    return events.sort((a, b) => a.startTime.localeCompare(b.startTime))
  },
})

/**
 * Get events for a user within a date range
 * Useful for showing a week or month view
 */
export const getEventsByDateRange = query({
  args: {
    userId: v.id("users"),
    startDate: v.string(),  // YYYY-MM-DD
    endDate: v.string(),    // YYYY-MM-DD
  },
  handler: async (ctx, args) => {
    // Get all events for user, then filter by date range
    // (Convex doesn't support range queries on non-indexed fields well)
    const allEvents = await ctx.db
      .query("calendarEvents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect()
    
    // Filter to date range (like Python list comprehension)
    const filteredEvents = allEvents.filter(
      (event) => event.date >= args.startDate && event.date <= args.endDate
    )
    
    return filteredEvents.sort((a, b) => {
      // Sort by date first, then by start time
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date)
      }
      return a.startTime.localeCompare(b.startTime)
    })
  },
})

/**
 * Create a new calendar event
 */
export const createEvent = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.string(),
    endTime: v.string(),
    date: v.string(),
    category: v.union(
      v.literal("work"),
      v.literal("meal"),
      v.literal("sleep"),
      v.literal("habit"),
      v.literal("planning"),
      v.literal("personal"),
      v.literal("other")
    ),
    isRecurring: v.boolean(),
    recurringPattern: v.optional(v.string()),
    createdBy: v.union(v.literal("ai"), v.literal("user")),
  },
  handler: async (ctx, args) => {
    // Insert the new event
    const eventId = await ctx.db.insert("calendarEvents", {
      ...args,  // Spread operator - copies all args
      completed: false,
      createdAt: Date.now(),
    })
    
    return eventId
  },
})

/**
 * Create multiple events at once
 * Useful when AI generates a full day plan
 */
export const createManyEvents = mutation({
  args: {
    userId: v.id("users"),
    events: v.array(v.object({
      title: v.string(),
      description: v.optional(v.string()),
      startTime: v.string(),
      endTime: v.string(),
      date: v.string(),
      category: v.union(
        v.literal("work"),
        v.literal("meal"),
        v.literal("sleep"),
        v.literal("habit"),
        v.literal("planning"),
        v.literal("personal"),
        v.literal("other")
      ),
      isRecurring: v.boolean(),
      createdBy: v.union(v.literal("ai"), v.literal("user")),
    })),
  },
  handler: async (ctx, args) => {
    // Create all events and collect their IDs
    const eventIds = await Promise.all(
      args.events.map((event) =>
        ctx.db.insert("calendarEvents", {
          ...event,
          userId: args.userId,
          completed: false,
          createdAt: Date.now(),
        })
      )
    )
    
    return eventIds
  },
})

/**
 * Update an existing event
 */
export const updateEvent = mutation({
  args: {
    eventId: v.id("calendarEvents"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    category: v.optional(v.union(
      v.literal("work"),
      v.literal("meal"),
      v.literal("sleep"),
      v.literal("habit"),
      v.literal("planning"),
      v.literal("personal"),
      v.literal("other")
    )),
    completed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { eventId, ...updates } = args
    
    // Filter out undefined values
    // Object.entries() is like dict.items() in Python
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    )
    
    await ctx.db.patch(eventId, cleanUpdates)
    
    return { success: true }
  },
})

/**
 * Delete an event
 */
export const deleteEvent = mutation({
  args: {
    eventId: v.id("calendarEvents"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.eventId)
    return { success: true }
  },
})

/**
 * Delete all events for a specific date
 * Useful when regenerating a day plan
 */
export const deleteEventsByDate = mutation({
  args: {
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("calendarEvents")
      .withIndex("by_user_and_date", (q) => 
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .collect()
    
    // Delete all events
    await Promise.all(events.map((event) => ctx.db.delete(event._id)))
    
    return { deleted: events.length }
  },
})

/**
 * Mark an event as completed
 */
export const markEventComplete = mutation({
  args: {
    eventId: v.id("calendarEvents"),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.eventId, {
      completed: args.completed,
    })
    
    return { success: true }
  },
})
