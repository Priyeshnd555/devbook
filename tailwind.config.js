/**
 * =================================================================================================
 * CONTEXT ANCHOR: Tailwind CSS Configuration (tailwind.config.js)
 * =================================================================================================
 *
 * @purpose
 * Configures Tailwind CSS for the project, including content paths, theme extensions, and plugins.
 * This file is crucial for defining the utility-first styling system used throughout the application.
 *
 * @dependencies
 * - @tailwindcss/typography: A plugin for styling rich text content (e.g., from Tiptap editor).
 *
 * @invariants
 * 1. AUTOMATIC UTILITY GENERATION: Tailwind CSS generates utility classes based on this configuration.
 * 2. JIT MODE: Changes to this file trigger a rapid rebuild of the CSS bundle.
 *
 * @state_management
 * - Not applicable; this file is a static configuration.
 *
 * @ai_note
 * - The `content` array specifies the files where Tailwind should look for class names to generate CSS.
 * - The `plugins` array includes `@tailwindcss/typography`, which provides the `prose` classes
 *   used to style HTML rendered from the rich text editor (`dangerouslySetInnerHTML`). This ensures
 *   that rich text content (like lists) is formatted correctly in the display.
 * =================================================================================================
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
