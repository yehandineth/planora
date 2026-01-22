/**
 * ============================================
 * CONVEX USER FUNCTIONS - src/convex/users.ts
 * ============================================
 * 
 * This file contains all database operations related to users.
 * Think of these as your API endpoints or Django views for user data.
 * 
 * CONVEX FUNCTION TYPES:
 * - query = Read data (like GET request, SELECT in SQL)
 * - mutation = Write data (like POST/PUT/DELETE, INSERT/UPDATE in SQL)
 * - action = Can call external APIs, more complex logic
 * 
 * These functions run on Convex's servers, not in the browser.
 * The browser calls them via hooks like useQuery() and useMutation().
 * ============================================
 */

// Import Convex function builders
import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

/**
 * Get or create a user by their Clerk ID
 * 
 * This is called when someone logs in to ensure they exist in our DB.
 * Similar to Django's get_or_create().
 */
export const getOrCreateUser = mutation({
  // Define the arguments this function accepts (like function parameters)
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
  },
  
  // The handler function - this runs when the mutation is called
  // ctx = context, has access to the database
  // args = the arguments passed by the caller
  handler: async (ctx, args) => {
    // Try to find existing user by Clerk ID
    // db.query("tableName") starts a query builder
    // .withIndex() uses our index for fast lookup
    // .unique() returns one result or null
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique()
    
    // If user exists, return their ID
    if (existingUser) {
      return existingUser._id
    }
    
    // Otherwise, create new user
    // db.insert() is like INSERT INTO in SQL
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      onboardingComplete: false,  // New users need onboarding
      createdAt: Date.now(),      // Current timestamp in milliseconds
    })
    
    return userId
  },
})

/**
 * Get the current user's data
 * 
 * Returns null if user doesn't exist (not logged in)
 */
export const getCurrentUser = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique()
    
    return user
  },
})

/**
 * Update user's planning time preference
 */
export const updatePlanningTime = mutation({
  args: {
    clerkId: v.string(),
    planningTime: v.string(),  // Format: "HH:MM" like "21:00"
  },
  handler: async (ctx, args) => {
    // Find the user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique()
    
    if (!user) {
      throw new Error("User not found")
    }
    
    // Update the user's planning time
    // db.patch() is like UPDATE in SQL - only changes specified fields
    await ctx.db.patch(user._id, {
      planningTime: args.planningTime,
    })
    
    return { success: true }
  },
})

/**
 * Complete user onboarding
 */
export const completeOnboarding = mutation({
  args: {
    clerkId: v.string(),
    planningTime: v.string(),
    timezone: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique()
    
    if (!user) {
      throw new Error("User not found")
    }
    
    await ctx.db.patch(user._id, {
      planningTime: args.planningTime,
      timezone: args.timezone,
      onboardingComplete: true,
    })
    
    return { success: true }
  },
})

/**
 * Get user by their internal Convex ID
 * (Used by other functions that have the ID already)
 */
export const getUserById = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId)
  },
})
