/**
 * ============================================
 * HOME PAGE - src/app/page.tsx
 * ============================================
 * 
 * This is the landing page at the root URL (/).
 * Shows when users aren't logged in.
 * 
 * In Next.js App Router:
 * - page.tsx files define the actual page content
 * - The URL is determined by the folder structure:
 *   - src/app/page.tsx → /
 *   - src/app/dashboard/page.tsx → /dashboard
 *   - src/app/settings/page.tsx → /settings
 * 
 * This is a SERVER component (no "use client" directive)
 * which means it renders on the server = faster initial load
 * ============================================
 */

// Import Link component for client-side navigation
// This is like <a> but doesn't reload the whole page
import Link from 'next/link'

// Import Clerk components for auth buttons
import { SignInButton, SignUpButton, SignedIn, SignedOut } from '@clerk/nextjs'

// Import icons from lucide-react (a nice icon library)
import { Calendar, Brain, Target, Sparkles, ArrowRight } from 'lucide-react'

/**
 * Home Page Component
 * 
 * No props needed - this is a top-level page
 * 
 * Note: This is an async function! In Next.js 13+ App Router,
 * Server Components can be async (useful for fetching data)
 */
export default function Home() {
  return (
    // Main container - min-h-screen ensures it fills the viewport
    <main className="min-h-screen">
      
      {/* ============================================
          HERO SECTION - The big attention-grabbing top part
          ============================================ */}
      <section className="relative overflow-hidden">
        {/* Background gradient decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-accent-50" />
        
        {/* Decorative circles (just for visual interest) */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-brand-200 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-200 rounded-full blur-3xl opacity-30" />
        
        {/* Content container */}
        <div className="relative max-w-6xl mx-auto px-6 py-20">
          
          {/* Navigation bar */}
          <nav className="flex items-center justify-between mb-20">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-semibold text-slate-900">
                AI Life Calendar
              </span>
            </div>
            
            {/* Auth buttons - different UI based on login state */}
            <div className="flex items-center gap-4">
              {/* 
                SignedOut = Only shows when user is NOT logged in
                This is a Clerk component that handles the conditional logic
              */}
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="btn-primary">
                    Get Started
                  </button>
                </SignUpButton>
              </SignedOut>
              
              {/* 
                SignedIn = Only shows when user IS logged in
              */}
              <SignedIn>
                <Link href="/dashboard" className="btn-primary flex items-center gap-2">
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </SignedIn>
            </div>
          </nav>
          
          {/* Hero content */}
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge/pill */}
            <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              AI-Powered Life Planning
            </div>
            
            {/* Main headline */}
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Plan Your Day,{' '}
              <span className="text-brand-500">Build Your Life</span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              An AI assistant that helps you plan your days, build lasting habits, 
              and become the most productive version of yourself.
            </p>
            
            {/* CTA buttons */}
            <div className="flex items-center justify-center gap-4">
              <SignedOut>
                <SignUpButton mode="modal">
                  <button className="btn-primary text-lg px-8 py-3 flex items-center gap-2">
                    Start Planning Free
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard" className="btn-primary text-lg px-8 py-3 flex items-center gap-2">
                  Open Dashboard
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>
      </section>
      
      {/* ============================================
          FEATURES SECTION
          ============================================ */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">
            How It Works
          </h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            Every evening, spend 10 minutes with your AI planning assistant 
            to design tomorrow for success.
          </p>
          
          {/* Feature cards grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card text-center">
              <div className="w-14 h-14 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-7 h-7 text-brand-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                AI Planning Chat
              </h3>
              <p className="text-slate-600">
                Chat with AI to plan your day. It asks about work, meetings, 
                and suggests optimal times for meals and sleep.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="card text-center">
              <div className="w-14 h-14 bg-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-7 h-7 text-accent-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Smart Calendar
              </h3>
              <p className="text-slate-600">
                Your plans automatically become calendar blocks. 
                Visual timeline shows your optimized day.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="card text-center">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Habit Building
              </h3>
              <p className="text-slate-600">
                Track habits like gym, healthy eating, and sleep. 
                AI schedules time for habits with minimal resistance.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* ============================================
          FOOTER
          ============================================ */}
      <footer className="py-8 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6 text-center text-slate-500">
          <p>© 2024 AI Life Calendar. Built to help you thrive.</p>
        </div>
      </footer>
    </main>
  )
}
