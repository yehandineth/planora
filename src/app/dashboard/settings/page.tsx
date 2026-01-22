/**
 * ============================================
 * SETTINGS PAGE - src/app/dashboard/settings/page.tsx
 * ============================================
 * 
 * User settings page for configuring:
 * - Planning time preference
 * - Timezone
 * - Other preferences
 * ============================================
 */

"use client"

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Settings, Clock, Globe, Save, Check } from 'lucide-react'

export default function SettingsPage() {
  const [convexUserId, setConvexUserId] = useState<string | null>(null)
  const [planningTime, setPlanningTime] = useState('21:00')
  const [timezone, setTimezone] = useState('')
  const [saved, setSaved] = useState(false)
  
  const { user } = useUser()
  
  // Mutations
  const getOrCreateUser = useMutation(api.users.getOrCreateUser)
  const completeOnboarding = useMutation(api.users.completeOnboarding)
  
  // Query user data
  const convexUser = useQuery(
    api.users.getCurrentUser,
    user?.id ? { clerkId: user.id } : 'skip'
  )
  
  // Sync user and load settings
  useEffect(() => {
    async function syncUser() {
      if (user?.id && user?.emailAddresses?.[0]?.emailAddress) {
        const userId = await getOrCreateUser({
          clerkId: user.id,
          email: user.emailAddresses[0].emailAddress,
          name: user.firstName || undefined,
        })
        setConvexUserId(userId)
      }
    }
    syncUser()
  }, [user, getOrCreateUser])
  
  // Load existing settings
  useEffect(() => {
    if (convexUser) {
      if (convexUser.planningTime) {
        setPlanningTime(convexUser.planningTime)
      }
      if (convexUser.timezone) {
        setTimezone(convexUser.timezone)
      }
    }
    
    // Detect timezone if not set
    if (!timezone) {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
    }
  }, [convexUser, timezone])
  
  // Handle save
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user?.id) return
    
    await completeOnboarding({
      clerkId: user.id,
      planningTime,
      timezone,
    })
    
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }
  
  // Common timezones
  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Toronto',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Singapore',
    'Australia/Sydney',
    'Pacific/Auckland',
  ]
  
  return (
    <div className="p-8 max-w-2xl">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand-500" />
          Settings
        </h1>
        <p className="text-slate-600">
          Configure your planning preferences
        </p>
      </header>
      
      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Planning Time */}
        <div className="card">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-brand-600" />
            </div>
            <div className="flex-1">
              <label className="block text-lg font-semibold text-slate-900 mb-1">
                Daily Planning Time
              </label>
              <p className="text-slate-500 text-sm mb-4">
                What time do you want to plan tomorrow's schedule each day?
                We recommend evenings (8-9 PM) for most people.
              </p>
              <input
                type="time"
                value={planningTime}
                onChange={(e) => setPlanningTime(e.target.value)}
                className="px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>
        
        {/* Timezone */}
        <div className="card">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <label className="block text-lg font-semibold text-slate-900 mb-1">
                Timezone
              </label>
              <p className="text-slate-500 text-sm mb-4">
                Your timezone for scheduling events correctly.
              </p>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Save Button */}
        <button
          type="submit"
          className={`btn-primary flex items-center gap-2 ${
            saved ? 'bg-green-500 hover:bg-green-500' : ''
          }`}
        >
          {saved ? (
            <>
              <Check className="w-5 h-5" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Settings
            </>
          )}
        </button>
      </form>
      
      {/* Account Info */}
      <div className="mt-8 pt-8 border-t border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Account Information
        </h2>
        <div className="card bg-slate-50">
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-slate-500">Email</dt>
              <dd className="text-slate-900 font-medium">
                {user?.emailAddresses?.[0]?.emailAddress}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Name</dt>
              <dd className="text-slate-900 font-medium">
                {user?.firstName} {user?.lastName}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Account Status</dt>
              <dd className="text-green-600 font-medium">Active</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
