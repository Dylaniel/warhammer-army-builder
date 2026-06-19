/** @type {import('tailwindcss').Config} */
module.exports = {
  // Required for ThemeContext's class-based dark/light toggling on <html>.
  // Without this, every dark: utility across all components is silently dead.
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // You can add custom colors here for your Warhammer theme
      },
    },
  },
  plugins: [],
};
