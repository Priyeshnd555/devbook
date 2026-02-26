import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

import { ThemeProvider } from "./providers/ThemeProvider";
import { PostHogProvider } from "./providers/PostHogProvider";

export const metadata: Metadata = {
  title: "Thread Note",
  description: "Nested Note",
  icons: "https://priyeshnd555.github.io/devbook/newLogo.png",
};

// =================================================================================================
// CONTEXT ANCHOR: ROOT LAYOUT (app/layout.tsx)
// =================================================================================================
// PURPOSE: Defines the global HTML shell for the entire Next.js application. It is the outermost
//          wrapper that persists across all route segments (e.g., `/`, `/weekly`).
//
// DEPENDENCIES:
// - NEXT.JS METADATA: `metadata` export defines SEO-relevant `<title>`, `<meta>`, and `<link>`.
// - PROVIDER: `ThemeProvider` (app/providers/ThemeProvider.tsx): Wraps the entire app to manage
//   global theme state (dark/light mode, accent color, font size). ALL pages inherit this context.
// - PROVIDER: `PostHogProvider` (app/providers/PostHogProvider.tsx): Wraps the app for analytics event tracking.
// - SCRIPT: Ahrefs analytics injected via Next.js `<Script>` (async, non-blocking).
// - CSS: `globals.css` initializes CSS variables and Tailwind base styles.
//
// PROVIDER HIERARCHY (outer to inner):
//   PostHogProvider -> ThemeProvider -> {children}
//
// INVARIANTS:
// - This layout persists across all routes. Code here runs on every page load.
// - `suppressHydrationWarning` on `<html>` is required because ThemeProvider modifies
//   the `class` attribute on the client side (for dark mode), which differs from SSR output.
// - The `storageKey` prop on ThemeProvider must stay stable — changing it clears user preferences.
// =================================================================================================
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <meta name="ahrefs-site-verification" content="63a3427c3074795b2225c5773fcbf0648b3ed76801494286f48e818d81c88224"></meta>
      <Script
        src="https://analytics.ahrefs.com/analytics.js"
        data-key="3kiXtPYkGutierGlX7ORRg"
        async
      />
      <body
        className={`antialiased`}
      >
        <PostHogProvider>
          <ThemeProvider
            storageKey="devbook-theme"
            defaultTheme="system"
          >
            {children}
          </ThemeProvider>
        </PostHogProvider>

      </body>
    </html>
  );
}
