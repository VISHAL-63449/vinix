/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#1e40af', // Deep blue
          purple: '#7c3aed', // Purple accent
          richBlack: '#0f172a', // Slate black
        }
      }
    },
  },
  plugins: [],
}
