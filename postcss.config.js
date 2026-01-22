/** 
 * ============================================
 * POSTCSS CONFIGURATION
 * ============================================
 * 
 * PostCSS is a tool that transforms CSS.
 * Tailwind uses it to generate the final CSS.
 * 
 * You don't need to touch this file - it's boilerplate.
 * ============================================
 */

module.exports = {
  plugins: {
    tailwindcss: {},      // Process Tailwind directives
    autoprefixer: {},     // Add vendor prefixes (-webkit-, -moz-, etc.)
  },
}
