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
        // Custom color palette for dark mode
        dark: {
          bg: '#0a0a0a',
          panel: '#1a1a1a',
          border: '#2a2a2a',
          text: '#e0e0e0',
        },
        safe: {
          light: '#10b981',
          DEFAULT: '#059669',
          dark: '#047857',
        },
        unsafe: {
          light: '#ef4444',
          DEFAULT: '#dc2626',
          dark: '#b91c1c',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
}
