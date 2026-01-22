/**
 * ============================================
 * DASHBOARD LAYOUT - src/app/dashboard/layout.tsx
 * ============================================
 * 
 * This layout wraps all pages under /dashboard/*.
 * It provides:
 * - Sidebar navigation
 * - Protected route (must be logged in)
 * - Common structure for dashboard pages
 * 
 * Layout files in Next.js are like nested templates.
 * ============================================
 */

// This is a client component because it uses Clerk hooks
"use client"

import { useUser, UserButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Calendar, 
  MessageSquare, 
  Target, 
  Settings, 
  Home,
  Loader2 
} from 'lucide-react'

// Helper function to combine class names conditionally
// Like: className={cn("base", isActive && "active")}
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

/**
 * Navigation items for the sidebar
 * Array of objects - easy to add more later
 */
const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/plan', label: 'Plan Day', icon: MessageSquare },
  { href: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
  { href: '/dashboard/habits', label: 'Habits', icon: Target },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

/**
 * Dashboard Layout Component
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get current user from Clerk
  // This hook provides: user object, isLoaded (boolean), isSignedIn (boolean)
  const { user, isLoaded, isSignedIn } = useUser()
  
  // Router for programmatic navigation
  const router = useRouter()
  
  // Get current path to highlight active nav item
  const pathname = usePathname()
  
  // Redirect to login if not authenticated
  // useEffect runs after component mounts (like componentDidMount or onMounted)
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/')  // Redirect to home page
    }
  }, [isLoaded, isSignedIn, router])
  
  // Show loading state while checking auth
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    )
  }
  
  // Don't render dashboard if not signed in
  if (!isSignedIn) {
    return null
  }
  
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ============================================
          SIDEBAR
          ============================================ */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        {/* Logo section */}
        <div className="p-6 border-b border-slate-200">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <span className="text-lg font-semibold text-slate-900">
              AI Calendar
            </span>
          </Link>
        </div>
        
        {/* Navigation links */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              // Check if this is the current page
              // For dashboard home, exact match; for others, starts with
              const isActive = item.href === '/dashboard' 
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href)
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      // Base styles
                      "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                      // Conditional styles based on active state
                      isActive
                        ? "bg-brand-50 text-brand-600"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
        
        {/* User section at bottom */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3">
            {/* Clerk's UserButton provides avatar + dropdown menu */}
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10"
                }
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {user?.firstName || user?.emailAddresses[0]?.emailAddress}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {user?.emailAddresses[0]?.emailAddress}
              </p>
            </div>
          </div>
        </div>
      </aside>
      
      {/* ============================================
          MAIN CONTENT AREA
          ============================================ */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
