// =================================================================================================
// CONTEXT ANCHOR: THEME UTILITIES
// =================================================================================================
// PURPOSE: Pure functions for color manipulation and dynamic theme variable generation.
// DEPENDENCIES: None (Pure JS math).
// INVARIANTS: Input is valid HEX string; Output is valid CSS HSL string values.
// =================================================================================================

export function hexToHSL(hex: string): { h: number; s: number; l: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  let r = parseInt(result[1], 16);
  let g = parseInt(result[2], 16);
  let b = parseInt(result[3], 16);

  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0;
    const l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function generateThemeVariables(hex: string) {
  const hsl = hexToHSL(hex);
  if (!hsl) return null;

  const { h, s, l } = hsl;

  // Generate variants
  // Hover: Slightly darker/more saturated or just shift lightness
  const hoverL = Math.max(0, l - 10);
  
  // Light: Very pale version for backgrounds
  const lightL = Math.min(96, l + (100 - l) * 0.9); // Approach white
  const lightS = Math.max(0, s - 20); // Desaturate a bit

  // Text: Very dark version for text over light backgrounds
  const textL = Math.max(10, l - 40);

  return {
    "--color-primary": `${h} ${s}% ${l}%`,
    "--color-primary-hover": `${h} ${s}% ${hoverL}%`,
    "--color-primary-light": `${h} ${lightS}% ${lightL}%`,
    "--color-primary-text": `${h} ${s}% ${textL}%`,
  };
}
