import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Figtree"', '"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Sora"', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef8f3',
          100: '#d5efe3',
          200: '#aee0c9',
          300: '#7cc9ab',
          400: '#4aaf8c',
          500: '#2f9373',
          600: '#22765c',
          700: '#1c5e4b',
          800: '#184b3d',
          900: '#143e34',
          950: '#0c241e',
        },
        ink: {
          50: '#f3f5f7',
          100: '#e4e9ee',
          200: '#c8d2dc',
          300: '#a0b0c0',
          400: '#74899e',
          500: '#586f85',
          600: '#45586b',
          700: '#394858',
          800: '#313d4a',
          900: '#2b3540',
          950: '#1c232b',
        },
        surface: {
          DEFAULT: '#f3f5f2',
          elevated: '#ffffff',
          muted: '#e8ece7',
          dark: '#0e1311',
          'dark-elevated': '#151b18',
          'dark-muted': '#1a221e',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15, 20, 18, 0.04), 0 8px 24px rgba(15, 20, 18, 0.05)',
        lift: '0 2px 4px rgba(15, 20, 18, 0.04), 0 12px 32px rgba(15, 20, 18, 0.08)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.6)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      keyframes: {
        'shimmer': {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
