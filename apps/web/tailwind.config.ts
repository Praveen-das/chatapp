/** @type {import('tailwindcss').Config} */

const darkmode = {
  "secondary": "#ffffff",
  "base-100": "#1e1e1e",
  "base-200": "#333333",
  "base-300": "#121212",
  "--base-400": "#00000033",
  "--bc": "1 0 0",
}

const lightmode = {
  "base-300": "#e7e2ee",
}

const themes = require("daisyui/src/theming/themes")

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require("daisyui"),
  ],
  daisyui: {
    themes: [
      { 'light-6200ee': { ...themes["light"], ...lightmode, "primary": "#6200ee" } },
      { 'light-4f46e5': { ...themes["light"], ...lightmode, "primary": "#4f46e5" } },
      { 'light-d97706': { ...themes["light"], ...lightmode, "primary": "#d97706" } },
      { 'dark-6200ee': { ...themes["dim"], ...darkmode, "primary": "#6200ee" } },
      { 'dark-4f46e5': { ...themes["dim"], ...darkmode, "primary": "#4f46e5", } },
      { 'dark-d97706': { ...themes["dim"], ...darkmode, "primary": "#d97706", } },

      { 'LIGHT-6200ee': { ...themes["light"], ...lightmode, "primary": "#6200ee" } },
      { 'LIGHT-4f46e5': { ...themes["light"], ...lightmode, "primary": "#4f46e5" } },
      { 'LIGHT-d97706': { ...themes["light"], ...lightmode, "primary": "#d97706" } },
      { 'DARK-6200ee': { ...themes["dim"], ...darkmode, "primary": "#6200ee" } },
      { 'DARK-4f46e5': { ...themes["dim"], ...darkmode, "primary": "#4f46e5", } },
      { 'DARK-d97706': { ...themes["dim"], ...darkmode, "primary": "#d97706", } },
    ],
    darkTheme: "dark-6200ee",
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: true,
    themeRoot: ":root",
  },
}

