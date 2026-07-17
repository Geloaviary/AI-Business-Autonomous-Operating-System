import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        base: {
          950: '#06070a',
          900: '#0a0b10',
          850: '#0e1017',
          800: '#12141d',
          700: '#1b1e29',
          600: '#262a38'
        },
        accent: {
          DEFAULT: '#5b8cff',
          soft: 'rgba(91,140,255,0.12)',
          violet: '#8a5bff'
        },
        good: { DEFAULT: '#3ecf8e', soft: 'rgba(62,207,142,0.12)' },
        warn: { DEFAULT: '#e8b64c', soft: 'rgba(232,182,76,0.12)' },
        bad: { DEFAULT: '#f0616d', soft: 'rgba(240,97,109,0.12)' },
        ink: { DEFAULT: '#e8eaef', muted: '#8b93a1', faint: '#565c6b' }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'Segoe UI', 'sans-serif'],
        mono: ['SFMono-Regular', 'Menlo', 'Consolas', 'monospace']
      },
      boxShadow: {
        panel: '0 1px 0 rgba(255,255,255,0.03) inset, 0 8px 24px rgba(0,0,0,0.28)',
        glow: '0 0 0 1px rgba(91,140,255,0.35), 0 0 24px rgba(91,140,255,0.18)'
      },
      borderRadius: {
        xl2: '18px'
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' }
        }
      },
      animation: {
        pulseSoft: 'pulseSoft 2s ease-in-out infinite'
      }
    }
  },
  plugins: []
};

export default config;
