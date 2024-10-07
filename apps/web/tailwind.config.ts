/** @type {import('tailwindcss').Config} */
// import primary from "config/themes";
import themes from "daisyui/src/theming/themes";

const primary ={ 
  purple:"#8139f9",
  blue:"#5d55f6",
  orange:"#f9941f",
};

const darkmode = {
  ...themes["dim"],
  secondary: "#ffffff",
  "base-100": "hsl(223deg 15% 30%)",
  "base-200": "hsl(223deg 15% 21.2%)",
  "base-300": "hsl(223 17% 13% / 1)",
  "--100-primary": "hsl(0deg 0.01% 19.84%)",
  "--hover-primary": "hsl(0 0 0% / 0.20)",
  "--hover-secondary": "hsl(0 0 0% / 0.20)",
  "--modal": "hsl(223 17% 13% / 1)",
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

const lightmode_1 = { ...lightmode, primary: primary.purple };
const lightmode_2 = { ...lightmode, primary: primary.blue };
const lightmode_3 = { ...lightmode, primary: primary.orange };

const darkmode_1 = { ...darkmode, primary: primary.purple };
const darkmode_2 = { ...darkmode, primary: primary.blue };
const darkmode_3 = { ...darkmode, primary: primary.orange };

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
      { "light-8139f9": lightmode_1 },
      { "light-5d55f6": lightmode_2 },
      { "light-f9941f": lightmode_3 },

      { "dark-8139f9": darkmode_1 },
      { "dark-5d55f6": darkmode_2 },
      { "dark-f9941f": darkmode_3 },

      { "LIGHT-8139f9": lightmode_1 },
      { "LIGHT-5d55f6": lightmode_2 },
      { "LIGHT-f9941f": lightmode_3 },

      { "DARK-8139f9": darkmode_1 },
      { "DARK-5d55f6": darkmode_2 },
      { "DARK-f9941f": darkmode_3 },
    ],
    darkTheme: "dark-8139f9",
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: true,
    themeRoot: ":root",
  },
};
