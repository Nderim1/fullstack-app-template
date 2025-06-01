/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6', // Example blue
        secondary: '#10B981', // Example green
        neutral: {
          DEFAULT: '#F3F4F6', // Light gray for backgrounds
          dark: '#1F2937',    // Dark gray for text
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.07)',
      },
      borderRadius: {
        'xl': '1rem',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
