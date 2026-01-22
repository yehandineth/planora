/**
 * ============================================
 * ROOT LAYOUT - src/app/layout.tsx
 * ============================================
 * 
 * This is the ROOT layout that wraps EVERY page in your app.
 * Think of it like a base template in Django/Jinja2.
 * 
 * In Next.js App Router:
 * - layout.tsx files wrap their child pages
 * - This root layout wraps the ENTIRE app
 * - It's where you put providers (auth, database, themes, etc.)
 * 
 * KEY CONCEPTS:
 * - "use client" vs no directive: 
 *   - No directive = Server Component (runs on server, can't use React hooks)
 *   - "use client" = Client Component (runs in browser, can use hooks)
 * - This file has NO directive, so it's a Server Component
 * ============================================
 */

import './globals.css'
import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { ConvexClientProvider } from '@/components/ConvexClientProvider'
import { Inter } from 'next/font/google'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'AI Life Calendar',
  description: 'Plan your life and build better habits with AI assistance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={inter.variable}>
        <body className="font-sans min-h-screen">
          <ConvexClientProvider>
            {children}
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}