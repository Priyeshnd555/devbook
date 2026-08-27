import type { Metadata } from "next";
import Script from "next/script";
import { Outfit, Public_Sans } from "next/font/google";
import "./globals.css";

import { ThemeProvider, PostHogProvider } from "@shared/providers";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Thread Note",
  description: "Nested Note",
  icons: "https://priyeshnd555.github.io/devbook/newLogo.png",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${outfit.variable} ${publicSans.variable}`}>
      <head>
        <meta name="ahrefs-site-verification" content="63a3427c3074795b2225c5773fcbf0648b3ed76801494286f48e818d81c88224" />
      </head>
      <Script
        src="https://analytics.ahrefs.com/analytics.js"
        data-key="3kiXtPYkGutierGlX7ORRg"
        async
      />
      <body className="antialiased">
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
