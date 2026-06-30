// "use client" tells Next.js this runs in the browser
// Without this, you can't use React hooks like useState
"use client"

// Import Convex's React provider and client creator
import { ConvexProvider, ConvexReactClient } from "convex/react"

// Import React types
import { ReactNode } from "react"

/**
 * Create the Convex client
 * 
 * This connects to your Convex backend using the URL from .env.local
 * The "!" tells TypeScript "trust me, this value exists"
 * (In Python you'd just get a runtime error if it's missing)
 * 
 * process.env = environment variables (like os.environ in Python)
 * NEXT_PUBLIC_ prefix = exposed to browser (without prefix = server only)
 */
const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL!
)

/**
 * ConvexClientProvider Component
 * 
 * @param children - All the app content that needs database access
 * 
 * This wraps the app and provides the Convex client to all children.
 * Any component inside can now use Convex hooks like useQuery, useMutation.
 */
export function ConvexClientProvider({ 
  children 
}: { 
  children: ReactNode  // ReactNode = any valid React content
}) {
  return (
    // ConvexProvider makes the client available to all children
    // Similar to React Context or Redux Provider
    <ConvexProvider client={convex}>
      {children}
    </ConvexProvider>
  )
}
