export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          900: '#08090C',
          800: '#0E1117',
          700: '#151A22',
          600: '#1E2530',
          500: '#2A3444'
        },
        cyber: {
          emerald: '#10B981',
          teal: '#0D9488',
          cyan: '#06B6D4',
          accent: '#34D399'
        }
      }
    },
  },
  plugins: [],
}
