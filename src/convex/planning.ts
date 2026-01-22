/**
 * ============================================
 * CONVEX PLANNING SESSIONS - src/convex/planning.ts
 * ============================================
 * 
 * Database operations for AI planning chat sessions.
 * Stores conversation history so users can resume planning.
 * ============================================
 */

import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

/**
 * Get or create a planning session for a specific date
 */
export const getOrCreateSession = mutation({
  args: {
    userId: v.id("users"),
    planningDate: v.string(),  // YYYY-MM-DD
  },
  handler: async (ctx, args) => {
    // Check if session already exists
    const existingSession = await ctx.db
      .query("planningSessions")
      .withIndex("by_user_and_date", (q) => 
        q.eq("userId", args.userId).eq("planningDate", args.planningDate)
      )
      .unique()
    
    if (existingSession) {
      return existingSession
    }
    
    // Create new session
    const now = Date.now()
    const sessionId = await ctx.db.insert("planningSessions", {
      userId: args.userId,
      planningDate: args.planningDate,
      messages: [],
      isComplete: false,
      createdAt: now,
      updatedAt: now,
    })
    
    // Return the created session
    return await ctx.db.get(sessionId)
  },
})

/**
 * Get a planning session by user and date
 */
export const getSession = query({
  args: {
    userId: v.id("users"),
    planningDate: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("planningSessions")
      .withIndex("by_user_and_date", (q) => 
        q.eq("userId", args.userId).eq("planningDate", args.planningDate)
      )
      .unique()
  },
})

/**
 * Add a message to a planning session
 */
export const addMessage = mutation({
  args: {
    sessionId: v.id("planningSessions"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Get current session
    const session = await ctx.db.get(args.sessionId)
    if (!session) {
      throw new Error("Session not found")
    }
    
    // Add new message to messages array
    const newMessage = {
      role: args.role,
      content: args.content,
      timestamp: Date.now(),
    }
    
    await ctx.db.patch(args.sessionId, {
      messages: [...session.messages, newMessage],
      updatedAt: Date.now(),
    })
    
    return { success: true }
  },
})

/**
 * Mark a planning session as complete
 */
export const completeSession = mutation({
  args: {
    sessionId: v.id("planningSessions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      isComplete: true,
      updatedAt: Date.now(),
    })
    
    return { success: true }
  },
})

/**
 * Get recent planning sessions for a user
 */
export const getRecentSessions = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("planningSessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect()
    
    // Sort by date descending and limit
    const sorted = sessions.sort((a, b) => 
      b.planningDate.localeCompare(a.planningDate)
    )
    
    const limit = args.limit || 10
    return sorted.slice(0, limit)
  },
})

/**
 * Delete a planning session
 */
export const deleteSession = mutation({
  args: {
    sessionId: v.id("planningSessions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.sessionId)
    return { success: true }
  },
})
