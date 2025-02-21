/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#526B85',
        secondary: '#6B8EB2',
        'text-primary': '#1A1D1F',
        'text-secondary': '#6C727F',
        'background-primary': '#FFFFFF',
        'background-secondary': '#F8F9FA',
      },
      boxShadow: {
        'chat': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'card': '0 4px 12px rgba(0, 0, 0, 0.1)',
      },
      backgroundImage: {
        'gradient-orange-blue': 'linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-middle) 50%, var(--gradient-end) 100%)',
      },
      opacity: {
        '85': '0.85',
      },
    },
  },
  plugins: [],
}
