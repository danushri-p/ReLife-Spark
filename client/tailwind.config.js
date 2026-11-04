/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Exact screenshot color palette
        pine: {
          50: '#edf7f4',
          100: '#d4ede5',
          200: '#aedcd0',
          300: '#7ec4b5',
          400: '#52a797',
          500: '#388b7d',
          600: '#2b7065',
          700: '#245952',
          800: '#1e4842',
          900: '#0d4a3e', // Primary button and logo color from screenshot
          950: '#062d26',
        },
        laser: '#2feaa8', // Glowing neon laser trail from screenshot
        laserCyan: '#00f2fe',
      },
      fontFamily: {
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        sans: ['"Hanken Grotesk"', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'float-slow': 'floatSlow 6s ease-in-out infinite',
        'float-delayed': 'floatSlow 7s ease-in-out infinite 2.5s',
        'float-subtle': 'floatSubtle 5s ease-in-out infinite 1s',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'laser-glow': 'laserGlow 3s ease-in-out infinite alternate',
      },
      keyframes: {
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-14px) rotate(4deg)' },
        },
        floatSubtle: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-8px) rotate(-3deg)' },
        },
        laserGlow: {
          '0%': { opacity: '0.6', filter: 'drop-shadow(0 0 10px rgba(47, 234, 168, 0.5))' },
          '100%': { opacity: '0.95', filter: 'drop-shadow(0 0 24px rgba(47, 234, 168, 0.9))' },
        }
      }
    },
  },
  plugins: [],
};
