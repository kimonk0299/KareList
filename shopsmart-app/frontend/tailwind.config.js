/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        secondary: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
        // Nutrition score colors
        score: {
          excellent: '#16a34a', // green-600
          good: '#65a30d',      // lime-600
          fair: '#ea580c',      // orange-600
          poor: '#dc2626'       // red-600
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 0.6s ease-in-out',
        'pulse-gentle': 'pulseGentle 2s infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        pulseGentle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200px 0' },
          '100%': { backgroundPosition: 'calc(200px + 100%) 0' },
        }
      },
      backgroundImage: {
        'shimmer': 'linear-gradient(90deg, #f0f0f0 0px, #e0e0e0 40px, #f0f0f0 80px)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        '2.5xl': '1.25rem',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'soft-lg': '0 4px 16px rgba(0, 0, 0, 0.12)',
        'glow-primary': '0 0 20px rgba(34, 197, 94, 0.3)',
        'glow-score-excellent': '0 0 15px rgba(22, 163, 74, 0.4)',
        'glow-score-good': '0 0 15px rgba(101, 163, 13, 0.4)',
        'glow-score-fair': '0 0 15px rgba(234, 88, 12, 0.4)',
        'glow-score-poor': '0 0 15px rgba(220, 38, 38, 0.4)',
      },
      screens: {
        'xs': '475px',
        '3xl': '1600px',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#374151',
            a: {
              color: '#16a34a',
              '&:hover': {
                color: '#15803d',
              },
            },
          },
        },
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};