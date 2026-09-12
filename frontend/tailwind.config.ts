import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
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
        },
        surface: {
          DEFAULT: '#f7f8f6',
          dark: '#0f1412',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15, 20, 18, 0.06), 0 8px 24px rgba(15, 20, 18, 0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
