import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#12172A',
          soft: '#1B2238',
          softer: '#232C48',
        },
        parchment: {
          DEFAULT: '#F6F1E4',
          dim: '#ECE4D0',
          paper: '#FFFDF8',
        },
        brass: {
          50: '#FBF3E1',
          100: '#F3E1B5',
          300: '#DDBA6E',
          DEFAULT: '#C89B3C',
          600: '#A97E28',
          700: '#8A661F',
        },
        emerald: {
          DEFAULT: '#1F7A5C',
          soft: '#2A9575',
          dim: '#164F3C',
        },
        brick: {
          DEFAULT: '#C2452D',
          soft: '#D96448',
          dim: '#7E2C1B',
        },
        slate: {
          50: '#F5F6F9',
          200: '#DDE1EC',
          400: '#8C93AB',
          600: '#4C5476',
          800: '#262E4D',
        },
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(18,23,42,0.04), 0 8px 24px -8px rgba(18,23,42,0.12)',
        cardHover:
          '0 4px 8px rgba(18,23,42,0.06), 0 16px 40px -12px rgba(18,23,42,0.18)',
        gold: '0 8px 30px -10px rgba(200,155,60,0.45)',
      },
      backgroundImage: {
        'brass-gradient':
          'linear-gradient(135deg, #DDBA6E 0%, #C89B3C 55%, #A97E28 100%)',
        'ink-gradient':
          'linear-gradient(160deg, #12172A 0%, #1B2238 55%, #232C48 100%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-500px 0' },
          '100%': { backgroundPosition: '500px 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out both',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
