/** 
 * ============================================
 * TAILWIND CSS CONFIGURATION
 * ============================================
 * 
 * Tailwind is a CSS framework that uses utility classes.
 * Instead of writing CSS files, you add classes directly to HTML:
 * 
 * Python/HTML way: <div class="my-box"> then CSS: .my-box { padding: 20px; }
 * Tailwind way:    <div class="p-5">  (p-5 = padding of 1.25rem)
 * 
 * It sounds weird but it's FAST once you get used to it.
 * ============================================
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Tell Tailwind which files to scan for class names
  // It only includes CSS for classes you actually use (smaller files)
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',  // All files in src folder
  ],
  
  theme: {
    extend: {
      // Custom colors for our app
      // Usage: bg-brand-500, text-brand-700, etc.
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',   // Primary brand color
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // Warm accent color for habits/achievements
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',   // Orange accent
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        }
      },
      // Custom fonts
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cal Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  
  // Tailwind plugins (none for now)
  plugins: [],
}
