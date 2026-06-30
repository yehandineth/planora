import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

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

