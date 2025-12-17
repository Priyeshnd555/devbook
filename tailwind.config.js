import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    typography,
  ],
  // STRATEGY: 'class' mode enables manual toggling of dark mode via the 'dark' class on HTML tag.
  // This is required for the user-controlled switch to work independently of system preference.
  darkMode: 'class',
}

export default config;
