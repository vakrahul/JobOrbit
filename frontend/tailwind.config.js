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
        sarvam: {
          bg: '#0A0D14',
          card: '#111622',
          surface: '#161C2C',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-hover': 'rgba(245, 158, 11, 0.4)',
          amber: '#F59E0B',
          'amber-glow': '#FFB020',
          cyan: '#06B6D4',
          emerald: '#10B981',
          ink: '#F9FAFB',
          muted: '#94A3B8',
          subtle: '#64748B'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(245, 158, 11, 0.2)' },
          '100%': { boxShadow: '0 0 30px rgba(245, 158, 11, 0.5)' },
        }
      }
    },
  },
  plugins: [],
}
