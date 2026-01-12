/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary greens for eco theme
        'eco-primary': {
          50: '#f0fdf4',   // Very light mint
          100: '#dcfce7',  // Light mint
          200: '#bbf7d0',  // Soft green
          300: '#86efac',  // Light green (backgrounds)
          400: '#4ade80',  // Medium green
          500: '#22c55e',  // Primary green (buttons, accents)
          600: '#16a34a',  // Dark green (headers)
          700: '#15803d',  // Deeper green
          800: '#166534',  // Forest green (text)
          900: '#14532d',  // Very dark green
        },
        // Earthy accents
        'eco-earth': {
          light: '#d4a574',  // Tan
          DEFAULT: '#8b7355', // Brown
          dark: '#5c4a3a',   // Dark brown
        },
        // Sky/water accent
        'eco-sky': {
          light: '#7dd3fc',  // Light blue
          DEFAULT: '#0ea5e9', // Blue
          dark: '#0369a1',   // Dark blue
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
