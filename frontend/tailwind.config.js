/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#C8A96E',
        secondary: '#1A1A1A',
        background: '#F7F5F0',
        'card-bg': '#FFFFFF',
        'text-main': '#2C2C2C',
        'text-muted': '#8B8B8B',
        success: '#2E7D32',
        danger: '#D32F2F',
        warning: '#F57C00',
        border: '#E8E0D5',
        'barber-available': '#4CAF50',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}