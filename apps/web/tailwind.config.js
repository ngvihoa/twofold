/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './server/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#090d16',
        surface: '#111827',
        'surface-highlight': '#1f293d',
        primary: {
          DEFAULT: '#6366f1',
          hover: '#4f46e5',
        },
        wolf: {
          DEFAULT: '#e11d48',
          glow: '#f43f5e',
        },
        village: {
          DEFAULT: '#10b981',
          glow: '#34d399',
        },
        night: {
          bg: '#040711',
          accent: '#818cf8',
        },
        day: {
          bg: '#1e1b18',
          accent: '#f59e0b',
        },
      },
      fontFamily: {
        game: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

