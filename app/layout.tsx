import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "./providers/ThemeProvider";

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          storageKey="devbook-theme"
          defaultTheme="system"
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
