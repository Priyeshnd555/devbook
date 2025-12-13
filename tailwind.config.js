import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'hsl(var(--color-primary) / <alpha-value>)',
        accent: 'hsl(var(--color-accent) / <alpha-value>)',
        background: 'hsl(var(--color-background) / <alpha-value>)',
        surface: 'hsl(var(--color-surface) / <alpha-value>)',
        'text-primary': 'hsl(var(--color-text-primary) / <alpha-value>)',
        'text-secondary': 'hsl(var(--color-text-secondary) / <alpha-value>)',
        border: 'hsl(var(--color-border) / <alpha-value>)',
        shadow: 'hsl(var(--color-shadow) / <alpha-value>)',
        success: 'hsl(var(--color-success) / <alpha-value>)',
        danger: 'hsl(var(--color-danger) / <alpha-value>)',
        warning: 'hsl(var(--color-warning) / <alpha-value>)',
      },
    },
  },
  plugins: [
    typography,
  ],
}

export default config;
