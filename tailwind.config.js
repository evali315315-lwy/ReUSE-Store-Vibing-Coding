/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Darker forest greens for eco theme
        'eco-primary': {
          50: '#e8f5e3',   // Light sage
          100: '#c8e6c0',  // Pale green
          200: '#a5d69d',  // Soft green
          300: '#81c77a',  // Medium green
          400: '#66b85e',  // Forest green
          500: '#4a9943',  // Deep forest (primary)
          600: '#3d833a',  // Rich forest
          700: '#2f6b2f',  // Dark forest
          800: '#215323',  // Very dark forest
          900: '#133b18',  // Almost black forest
        },
        // Darker lime accents
        'eco-lime': {
          light: '#cddc39',  // Lime
          DEFAULT: '#9caf28', // Dark lime
          dark: '#6d7a1f',   // Very dark lime
        },
        // Darker teal accents
        'eco-teal': {
          light: '#4db6ac',  // Medium teal
          DEFAULT: '#00897b', // Dark teal
          dark: '#00564f',   // Very dark teal
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
