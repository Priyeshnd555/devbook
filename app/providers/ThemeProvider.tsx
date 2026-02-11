"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";
export type ThemeColor = "orange" | "green" | "blue" | "custom";
type FontSize = "small" | "normal" | "large";
import { generateThemeVariables } from "../utils/themeUtils";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultColor?: ThemeColor;
  storageKey?: string;
  colorStorageKey?: string;
  defaultCustomColor?: string;
  defaultFontSize?: FontSize;
  fontSizeStorageKey?: string;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
  customColor: string;
  setCustomColor: (color: string) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  themeColor: "orange",
  setThemeColor: () => null,
  customColor: "#FB8500", // Default orange hex
  setCustomColor: () => null,
  fontSize: "normal",
  setFontSize: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

// =================================================================================================
// CONTEXT ANCHOR: THEME PROVIDER
// =================================================================================================
// PURPOSE: Manages global application theme state (light/dark/system), Accent Colors (preset/custom), and Font Size.
// DEPENDENCIES: React, Window.localStorage, Window.matchMedia, themeUtils (for custom generation).
// INVARIANTS: 
// - Theme is always one of "light", "dark", "system".
// - ThemeColor is "orange", "green", "blue", or "custom".
// - FontSize is "small", "normal", "large".
// - If "custom", proper CSS variables are injected into :root style.
// =================================================================================================
export function ThemeProvider({
  children,
  defaultTheme = "system",
  defaultColor = "orange",
  defaultCustomColor = "#FB8500",
  defaultFontSize = "normal",
  storageKey = "devbook-theme",
  colorStorageKey = "devbook-color-theme",
  fontSizeStorageKey = "devbook-font-size",
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

  const [customColor, setCustomColor] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`${colorStorageKey}-custom`) || defaultCustomColor;
    }
    return defaultCustomColor;
  });

  const [fontSize, setFontSize] = useState<FontSize>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem(fontSizeStorageKey) as FontSize) || defaultFontSize;
    }
    return defaultFontSize;
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

  // STRATEGY: Effect updates the DOM data-color attribute or injects custom styles.
  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute("data-color", themeColor);

    if (themeColor === "custom") {
      const variables = generateThemeVariables(customColor);
      if (variables) {
        Object.entries(variables).forEach(([key, value]) => {
          root.style.setProperty(key, value);
        });
      }
    } else {
      // Clean up custom variables if we switch back to a preset
      root.style.removeProperty("--color-primary");
      root.style.removeProperty("--color-primary-hover");
      root.style.removeProperty("--color-primary-light");
      root.style.removeProperty("--color-primary-text");
    }
  }, [themeColor, customColor]);

  // STRATEGY: Effect updates the root font size.
  // Tailwind uses 'rem', so changing the root font-size scales the entire UI.
  useEffect(() => {
    const root = window.document.documentElement;
    if (fontSize === "small") {
      root.style.fontSize = "14px";
    } else if (fontSize === "large") {
      root.style.fontSize = "18px";
    } else {
      root.style.fontSize = "16px";
    }
  }, [fontSize]);

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
    customColor,
    setCustomColor: (color: string) => {
      localStorage.setItem(`${colorStorageKey}-custom`, color);
      setCustomColor(color);
    },
    fontSize,
    setFontSize: (size: FontSize) => {
      localStorage.setItem(fontSizeStorageKey, size);
      setFontSize(size);
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
