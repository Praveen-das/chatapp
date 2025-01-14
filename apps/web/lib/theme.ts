import COLORS from "../config/themes";

export function getSystemTheme() {
  return getComputedStyle(document.documentElement).getPropertyValue("--theme");
}

export function generateTheme(mode: string, base: any) {
  return Object.values(COLORS).map(key=>({[`${mode}-${key.replace('#','')}`]: {...base, primary: key}}));
}

export   function generateRelatedColors(inputColor:string, count = 5) {
  // Convert hex to RGB
  const hexToRgb = (hex:string) => {
    const bigint = parseInt(hex.slice(1), 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255,
    };
  };

  // Convert RGB to hex
  const rgbToHex = ({ r, g, b }:{ r:number, g:number, b:number }) =>
    `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;

  // Adjust brightness
  const adjustBrightness = (rgb:{ r:number, g:number, b:number }, factor:number) => ({
    r: Math.min(255, Math.max(0, Math.floor(rgb.r * factor))),
    g: Math.min(255, Math.max(0, Math.floor(rgb.g * factor))),
    b: Math.min(255, Math.max(0, Math.floor(rgb.b * factor))),
  });

  // Generate related colors
  const baseRgb = hexToRgb(inputColor);
  const relatedColors = [];

  // Create shades and tints
  for (let i = 1; i <= count; i++) {
    const factor = 1 + i * 0.1; // Lighter colors
    const lighter = adjustBrightness(baseRgb, factor);
    relatedColors.push(rgbToHex(lighter));

    const darker = adjustBrightness(baseRgb, 1 - i * 0.1); // Darker colors
    relatedColors.push(rgbToHex(darker));
  }

  return relatedColors;
}
