"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";
export type ThemeColor = "orange" | "green" | "blue";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultColor?: ThemeColor;
  storageKey?: string;
  colorStorageKey?: string;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  themeColor: "orange",
  setThemeColor: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

// =================================================================================================
// CONTEXT ANCHOR: THEME PROVIDER
// =================================================================================================
// PURPOSE: Manages the global application theme state (light/dark/system) and persists it.
// DEPENDENCIES: React (Context, Effects), Window.localStorage, Window.matchMedia.
// INVARIANTS: Theme is always one of "light", "dark", or "system". DOM always reflects current effective theme.
// =================================================================================================
export function ThemeProvider({
  children,
  defaultTheme = "system",
  defaultColor = "orange",
  storageKey = "devbook-theme",
  colorStorageKey = "devbook-color-theme",
  ...props
}: ThemeProviderProps) {
  // STRATEGY: Initialize state lazily to avoid hydration mismatch.
  // CONSTRAINT: Must check window existence for server-side rendering compatibility.
  const [theme, setTheme] = useState<Theme>(() => {
    // Avoid hydration mismatch by checking if window is defined
    if (typeof window !== "undefined") {
      return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
    }
    return defaultTheme;
  });

  const [themeColor, setThemeColor] = useState<ThemeColor>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem(colorStorageKey) as ThemeColor) || defaultColor;
    }
    return defaultColor;
  });

  // STRATEGY: Effect updates the DOM class list whenever the theme changes.
  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  // STRATEGY: Effect updates the DOM data-color attribute whenever the color changes.
  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute("data-color", themeColor);
  }, [themeColor]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
    themeColor,
    setThemeColor: (color: ThemeColor) => {
      localStorage.setItem(colorStorageKey, color);
      setThemeColor(color);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

// =================================================================================================
// CONTEXT ANCHOR: USE THEME HOOK
// =================================================================================================
// PURPOSE: Provides access to the theme context values (theme string and setter) for consumer components.
// DEPENDENCIES: React.useContext, ThemeProviderContext.
// INVARIANTS: Must be used within a ThemeProvider descendant.
// =================================================================================================
export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
