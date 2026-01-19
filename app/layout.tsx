import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

import { ThemeProvider } from "./providers/ThemeProvider";
import { PostHogProvider } from "./providers/PostHogProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Thread Note",
  description: "Nested Note",
  icons: "https://priyeshnd555.github.io/devbook/newLogo.png",
};

// =================================================================================================
// CONTEXT ANCHOR: ROOT LAYOUT
// =================================================================================================
// PURPOSE: Defines the global shell for the application, including fonts, metadata, and providers.
// DEPENDENCIES: Next.js/Font, Global CSS, ThemeProvider.
// INVARIANTS: This layout persists across all routes.
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
