/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#4da3ff',
          DEFAULT: '#1976D2',
          dark: '#115293',
        },
        secondary: {
          light: '#ba68c8',
          DEFAULT: '#9c27b0',
          dark: '#7b1fa2',
        },
        success: {
          light: '#4caf50',
          DEFAULT: '#2e7d32',
          dark: '#1b5e20',
        },
        warning: {
          light: '#ff9800',
          DEFAULT: '#ed6c02',
          dark: '#e65100',
        },
        error: {
          light: '#ef5350',
          DEFAULT: '#d32f2f',
          dark: '#c62828',
        },
        info: {
          light: '#03a9f4',
          DEFAULT: '#0288d1',
          dark: '#01579b',
        },
        dark: {
          bg: {
            primary: '#0a0a0a',
            secondary: '#1a1a1a',
            tertiary: '#2a2a2a',
            card: '#1e1e1e',
            hover: '#333333',
            accent: '#404040',
          },
          text: {
            primary: '#ffffff',
            secondary: '#e5e5e5',
            muted: '#a1a1a1',
            disabled: '#666666',
            accent: '#cccccc',
          },
          border: {
            primary: '#404040',
            secondary: '#333333',
            accent: '#555555',
            subtle: '#2a2a2a',
          }
        }
      },
      fontFamily: {
        sans: ['Roboto', 'Arial', 'sans-serif'],
      },
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
      },
      borderRadius: {
        'none': '0',
        'sm': '0.125rem',
        DEFAULT: '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        'full': '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'dark-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        'dark': '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        'dark-md': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
        'dark-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
} 