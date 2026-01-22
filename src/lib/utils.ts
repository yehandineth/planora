/**
 * ============================================
 * UTILITY FUNCTIONS - src/lib/utils.ts
 * ============================================
 * 
 * Shared utility functions used across the app.
 * Like a utils.py file in Python projects.
 * ============================================
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines class names intelligently
 * 
 * This is super useful for conditional styling:
 * cn("base-class", isActive && "active-class", "always-class")
 * 
 * twMerge handles Tailwind conflicts (e.g., p-2 and p-4 = p-4)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format time string (HH:MM) for display
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

/**
 * Generate a random color from our palette
 */
export function randomColor(): string {
  const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

/**
 * Sleep for a given number of milliseconds
 * Useful for debugging or adding delays
 * 
 * Usage: await sleep(1000) // wait 1 second
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Truncate a string to a max length with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}
