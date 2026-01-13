/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Vibrant greens for eco theme
        'eco-primary': {
          50: '#ecfdf5',   // Mint cream
          100: '#d1fae5',  // Bright mint
          200: '#a7f3d0',  // Light emerald
          300: '#6ee7b7',  // Seafoam green
          400: '#34d399',  // Vibrant green
          500: '#10b981',  // Emerald (primary)
          600: '#059669',  // Rich emerald
          700: '#047857',  // Deep emerald
          800: '#065f46',  // Forest emerald
          900: '#064e3b',  // Very dark emerald
        },
        // Lime accents for energy
        'eco-lime': {
          light: '#d9f99d',  // Light lime
          DEFAULT: '#84cc16', // Lime green
          dark: '#4d7c0f',   // Dark lime
        },
        // Teal accents for depth
        'eco-teal': {
          light: '#5eead4',  // Light teal
          DEFAULT: '#14b8a6', // Teal
          dark: '#0f766e',   // Dark teal
        },
        // Earthy accents
        'eco-earth': {
          light: '#fde68a',  // Warm sand
          DEFAULT: '#d97706', // Amber
          dark: '#92400e',   // Dark amber
        },
        // Squirrel colors
        'squirrel': {
          body: '#1a1a1a',    // Black body
          highlight: '#2d2d2d', // Gray highlights
          acorn: '#8B4513',   // Acorn brown
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
