/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          300: '#9FB3C8',
          400: '#829AB1',
          500: '#627D98',
          600: '#486581',
          700: '#334E68',
          800: '#243B53',
          900: '#102A43',
          950: '#0B1B33',
        },
        saffron: {
          50: '#FFF7ED',
          400: '#FFB366',
          500: '#FF9933',
          600: '#E6851A',
          700: '#C96A0A',
        },
        india: {
          green: '#138808',
          'green-light': '#1FAA59',
        },
        gold: {
          400: '#C4A35A',
          500: '#B8963E',
        },
        // keep cyber aliases mapped for existing classes → light navy
        cyber: {
          950: '#F5F7FA',
          900: '#FFFFFF',
          800: '#F0F4F8',
          700: '#D9E2EC',
          600: '#9FB3C8',
          500: '#486581',
          400: '#334E68',
          300: '#243B53',
          200: '#102A43',
        },
        glass: {
          border: 'rgba(16, 42, 67, 0.12)',
          bg: 'rgba(255, 255, 255, 0.92)',
          hover: 'rgba(240, 244, 248, 0.95)',
        },
      },
      fontFamily: {
        sans: ['"Source Sans 3"', 'Noto Sans Devanagari', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['"Source Serif 4"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
        hindi: ['"Noto Sans Devanagari"', 'Mangal', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 4px 16px rgba(16, 42, 67, 0.08)',
        'glow-lg': '0 8px 28px rgba(16, 42, 67, 0.12)',
        card: '0 2px 12px rgba(16, 42, 67, 0.08)',
      },
      backgroundImage: {
        'grid-pattern':
          'linear-gradient(rgba(16,42,67,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(16,42,67,0.04) 1px, transparent 1px)',
        'radial-glow':
          'radial-gradient(ellipse at top, rgba(255,153,51,0.08) 0%, transparent 55%)',
        'tricolor-bar':
          'linear-gradient(90deg, #FF9933 0%, #FF9933 33%, #FFFFFF 33%, #FFFFFF 66%, #138808 66%, #138808 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
}
