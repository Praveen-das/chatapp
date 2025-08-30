/** @type {import('tailwindcss').Config} */
import COLORS from "./config/themes";
import { generateTheme } from "./lib/theme";
import themes from "daisyui/src/theming/themes";

const darkmode = {
  ...themes["dim"],
  secondary: "#ffffff",
  "base-100": "hsl(228deg 4.76% 20.59%)",
  "base-200": "hsl(220deg 4.62% 12.75%)",
  "base-300": "hsl(0deg 0.02% 8.61%)",
  "--100-primary": "hsl(0deg 0.01% 19.84%)",
  "--200-primary": "oklch(var(--b2))",
  "--300-primary": "oklch(var(--b3))",
  "--white-primary": "#fff",
  "--white-grey": "#fff",
  "--hover-primary": "hsl(0 0 0% / 0.20)",
  "--hover-secondary": "hsl(0 0 0% / 0.20)",
  "--modal": "var(--fallback-b1,oklch(var(--b2)/0.7))",
  "--avatarBg": "oklch(var(--b1))",
  "--bc": "1 0 0",
  "--white-base-100": "oklch(var(--b1))",
  "--d-base-100": "oklch(var(--b1))",
  "--d-base-200": "oklch(var(--b2))",
  "--d-base-300": "oklch(var(--b3))",
  "--base-100-300": "oklch(var(--b1))",
  "--base-200-300": "oklch(var(--b2))",
  "--base-300-100": "oklch(var(--b3))",
  "--base-300-400": "oklch(var(--b3))",
  "--black-white": "oklch(var(--b3))",
".btn-error":{
    color:'oklch(var(--b3))'
  }
};

const lightmode = {
  ...themes["light"],
  secondary: "#000",
  // "base-200": "oklch(0.95 0 0 / 1)",
  // "base-300": "oklch(0.85 0 0 / 1)",
  "--100-primary": "oklch(var(--p))",
  "--200-primary": "oklch(var(--p))",
  "--300-primary": "oklch(var(--p))",
  "--white-primary": "oklch(var(--p))",
  "--white-grey": "oklch(0.5 0 0 / 1)",
  "--hover-primary": "oklch(var(--p))",
  "--hover-secondary": "hsl(0 0 0% / 0.05)",
  "--avatarBg": "oklch(0.75 0 0 / 1)",
  "--bg-white": "#fff",
  "--modal": "var(--fallback-b1,oklch(var(--b2)/0.7))",
  "--white-base-100": "#fff",
  "--l-primary": "oklch(var(--p))",
  "--l-base-100": "oklch(var(--b1))",
  "--l-base-200": "oklch(var(--b2))",
  "--l-base-300": "oklch(var(--b3))",
  "--base-100-300": "oklch(var(--b3))",
  "--base-200-300": "oklch(var(--b3))",
  "--base-300-100": "oklch(var(--b1))",
  "--base-300-400": "oklch(0.85 0 0 / 1)",
  "--black-white": "oklch(var(--b1))",
  ".btn-error":{
    color:'white'
  }
};

const DARK_THEME = `dark-${COLORS.default?.replace("#", "")}`;

const customThemes = [
  ...generateTheme("light", lightmode),
  ...generateTheme("dark", darkmode),

  ...generateTheme("LIGHT", lightmode),
  ...generateTheme("DARK", darkmode),
];

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: customThemes,
    darkTheme: DARK_THEME,
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: true,
    themeRoot: ":root",
  },
};
