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
        primary: {
          DEFAULT: '#0B2447', // deep navy
          light: '#19376D',
        },
        accent: {
          DEFAULT: '#00C4FF', // turquoise/travel blue
          light: '#5EE6EB',
        },
        bg: {
          DEFAULT: '#F8FAFC', // warm off-white / very light gray
        },
        charcoal: {
          DEFAULT: '#334155', // dark charcoal
        },
        muted: {
          DEFAULT: '#94A3B8', // gray
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 10px 40px -10px rgba(0,0,0,0.08)',
        'float': '0 20px 40px -10px rgba(0,0,0,0.12)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      }
    },
  },
  plugins: [],
}
