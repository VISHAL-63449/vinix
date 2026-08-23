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
          primary: '#2563EB',
          secondary: '#7C3AED',
          accent: '#06B6D4',
          bgLight: '#F8FAFC',
          bgDark: '#0D0E12',
          cardLight: '#FFFFFF',
          cardDark: '#13151D',
          hoverLight: '#EFF6FF',
          hoverDark: '#1E293B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

