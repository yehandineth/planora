/**
 * ============================================
 * CONVEX SCHEMA - src/convex/schema.ts
 * ============================================
 * 
 * This defines your database structure (like models.py in Django).
 * Convex uses this to:
 * - Validate data before inserting
 * - Provide TypeScript types automatically
 * - Create indexes for fast queries
 * 
 * KEY DIFFERENCES FROM SQL:
 * - No migrations needed - Convex handles schema changes
 * - Document-based (like MongoDB) not relational
 * - Automatic TypeScript types from schema
 * 
 * CONVEX TYPES:
 * - v.string() = text
 * - v.number() = integer or float
 * - v.boolean() = true/false
 * - v.array() = list
 * - v.object() = nested object/dict
 * - v.optional() = field can be missing (like None in Python)
 * - v.id("tableName") = reference to another document (like ForeignKey)
 * ============================================
 */

// Import Convex's schema definition helpers
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"  // v = validators (like Pydantic in Python)

// Define and export the schema
export default defineSchema({
  
  /**
   * USERS TABLE
   * -----------
   * Stores user profile data linked to Clerk authentication.
   * We don't store passwords - Clerk handles all auth.
   */
  users: defineTable({
    // Clerk's user ID (links our data to Clerk auth)
    clerkId: v.string(),
    
    // User's email from Clerk
    email: v.string(),
    
    // Display name
    name: v.optional(v.string()),
    
    // User's preferred planning time (e.g., "21:00" for 9 PM)
    planningTime: v.optional(v.string()),
    
    // User's timezone (e.g., "America/New_York")
    timezone: v.optional(v.string()),
    
    // Onboarding completed?
    onboardingComplete: v.boolean(),
    
    // When they signed up
    createdAt: v.number(),  // Unix timestamp (like time.time() in Python)
  })
    // Index for fast lookups by Clerk ID
    // Like: CREATE INDEX idx_clerk_id ON users(clerkId)
    .index("by_clerk_id", ["clerkId"]),
  
  /**
   * CALENDAR_EVENTS TABLE
   * ---------------------
   * Stores all calendar events/time blocks for users.
   */
  calendarEvents: defineTable({
    // Which user owns this event
    userId: v.id("users"),  // Reference to users table (like ForeignKey)
    
    // Event title (e.g., "Team Meeting", "Gym", "Lunch")
    title: v.string(),
    
    // Optional description
    description: v.optional(v.string()),
    
    // Start and end times (ISO 8601 strings like "2024-01-15T09:00:00")
    startTime: v.string(),
    endTime: v.string(),
    
    // What date this event is on (YYYY-MM-DD format for easy filtering)
    date: v.string(),
    
    // Event category for color coding
    // Think of this like an enum in Python
    category: v.union(
      v.literal("work"),       // Work/meetings
      v.literal("meal"),       // Breakfast, lunch, dinner
      v.literal("sleep"),      // Sleep time
      v.literal("habit"),      // Habit-related
      v.literal("planning"),   // Daily planning session
      v.literal("personal"),   // Personal stuff
      v.literal("other")       // Anything else
    ),
    
    // Is this a recurring event?
    isRecurring: v.boolean(),
    
    // If recurring, what's the pattern?
    recurringPattern: v.optional(v.string()),  // "daily", "weekdays", etc.
    
    // Was this created by AI or manually?
    createdBy: v.union(v.literal("ai"), v.literal("user")),
    
    // Completed? (for habit tracking)
    completed: v.optional(v.boolean()),
    
    // When was this created
    createdAt: v.number(),
  })
    // Index for getting all events for a user on a specific date
    .index("by_user_and_date", ["userId", "date"])
    // Index for getting all events for a user
    .index("by_user", ["userId"]),
  
  /**
   * HABITS TABLE
   * ------------
   * Stores user's habits they want to build.
   */
  habits: defineTable({
    // Which user owns this habit
    userId: v.id("users"),
    
    // Habit name (e.g., "Go to gym", "Meditate", "Read")
    name: v.string(),
    
    // Detailed description
    description: v.optional(v.string()),
    
    // Target frequency
    frequency: v.union(
      v.literal("daily"),
      v.literal("weekdays"),
      v.literal("weekends"),
      v.literal("weekly"),
      v.literal("custom")
    ),
    
    // If custom frequency, specify days (0=Sunday, 1=Monday, etc.)
    customDays: v.optional(v.array(v.number())),
    
    // Preferred time of day
    preferredTime: v.optional(v.union(
      v.literal("morning"),
      v.literal("afternoon"),
      v.literal("evening"),
      v.literal("flexible")
    )),
    
    // How long does this habit take? (in minutes)
    durationMinutes: v.number(),
    
    // Current streak count
    currentStreak: v.number(),
    
    // Best streak ever
    bestStreak: v.number(),
    
    // Is this habit active?
    isActive: v.boolean(),
    
    // Color for the habit (hex code)
    color: v.optional(v.string()),
    
    // When was this created
    createdAt: v.number(),
  })
    .index("by_user", ["userId"]),
  
  /**
   * HABIT_LOGS TABLE
   * ----------------
   * Tracks each time a habit is completed (for streak calculation).
   */
  habitLogs: defineTable({
    // Which habit this log is for
    habitId: v.id("habits"),
    
    // Which user (denormalized for easier queries)
    userId: v.id("users"),
    
    // Date completed (YYYY-MM-DD)
    date: v.string(),
    
    // Was it completed?
    completed: v.boolean(),
    
    // Optional notes
    notes: v.optional(v.string()),
    
    // When was this logged
    createdAt: v.number(),
  })
    .index("by_habit_and_date", ["habitId", "date"])
    .index("by_user_and_date", ["userId", "date"]),
  
  /**
   * PLANNING_SESSIONS TABLE
   * -----------------------
   * Stores the AI planning chat history for each session.
   */
  planningSessions: defineTable({
    // Which user
    userId: v.id("users"),
    
    // Which date is being planned (YYYY-MM-DD)
    planningDate: v.string(),
    
    // Chat messages history
    // Array of message objects
    messages: v.array(v.object({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
      timestamp: v.number(),
    })),
    
    // Is this session complete?
    isComplete: v.boolean(),
    
    // When did the session start
    createdAt: v.number(),
    
    // When was it last updated
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "planningDate"]),
})
