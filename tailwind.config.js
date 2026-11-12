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
          primary: '#DC2626',
          secondary: '#18181B',
          accent: '#EF4444',
          bgLight: '#FFFFFF',
          bgDark: '#0A0A0C',
          cardLight: '#FFFFFF',
          cardDark: '#121215',
          hoverLight: '#FEF2F2',
          hoverDark: '#1C1917',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      screens: {
        'xs': '380px',
      }
    },
  },
  plugins: [],
}
