/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gb: {
          red: '#d32f2f',
          'red-dark': '#b71c1c',
          'red-light': '#ef5350',
          charcoal: '#1a1a1a',
          'charcoal-2': '#242424',
          'charcoal-3': '#2d2d2d',
          'charcoal-4': '#3a3a3a',
          muted: '#9e9e9e',
        },
      },
      fontFamily: {
        rajdhani: ['Rajdhani', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulse_red: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(211,47,47,0.5)' },
          '50%': { boxShadow: '0 0 0 8px rgba(211,47,47,0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.4s ease forwards',
        pulse_red: 'pulse_red 2s infinite',
        slideIn: 'slideIn 0.5s ease forwards',
      },
    },
  },
  plugins: [],
}
