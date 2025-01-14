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
  "--hover-primary": "hsl(0 0 0% / 0.20)",
  "--hover-secondary": "hsl(0 0 0% / 0.20)",
  "--modal": "hsl(0deg 0.02% 8.61%)",
  "--bc": "1 0 0",
};

const lightmode = {
  ...themes["light"],
  secondary: "#000",
  "base-200": "#fff",
  "--100-primary": "oklch(var(--p))",
  "--hover-primary": "oklch(var(--p))",
  "--hover-secondary": "hsl(0 0 0% / 0.05)",
  "--modal": "oklch(var(--b3))",
};

const DARK_THEME = `dark-${Object.values(COLORS)[0]?.replace("#", "")}`;

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      ...generateTheme("light", lightmode),
      ...generateTheme("dark", darkmode),

      ...generateTheme("LIGHT", lightmode),
      ...generateTheme("DARK", darkmode),
    ],
    darkTheme: DARK_THEME,
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: true,
    themeRoot: ":root",
  },
};
