/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
    './plugins/**/*.{js,ts}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#02152b',
          light: '#092642',
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#b3c6d9',
          300: '#7d99b5',
          400: '#4a6a8f',
          500: '#2e4a6b',
          600: '#1a3450',
          700: '#0f2438',
          800: '#081a2e',
          900: '#02152b',
        },
        cyan: {
          DEFAULT: '#08c5ec',
          light: '#a7e5f2',
          dark: '#0089a9',
        },
        ink: '#10243e',
        muted: '#69717e',
        line: '#d8dde3',
        surface: '#f7f9fb',
        danger: '#dc2222',
        success: '#0a9e3a',
        warning: '#e8a317',
      },
      fontFamily: {
        sans: ['Manrope', 'Arial', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
      },
    },
  },
}
