"use client";
import { useEffect } from "react";
import { useTheme as useNextTheme } from "next-themes";
import COLORS from "config/themes";

export function useTheme() {
  const props = useNextTheme();

  let mode = props.resolvedTheme?.split("-")[0];
  let defaultColorHex = COLORS.default.replace("#", "");
  let colorHex = props.resolvedTheme?.split("-")[1] || defaultColorHex;
  let bgcolor = "#" + colorHex;

  const isDarkMode = mode?.toLowerCase() === "dark";
  const isLightMode = mode?.toLowerCase() === "light";

  const isSystemDefault = props.themes.includes(mode!);

  useEffect(() => {
    const handleChange = (e: MediaQueryListEvent) => {
      if (!isSystemDefault) return;

      let mode = e.matches ? "dark" : "light";
      props.setTheme(bgcolor ? mode + "-" + colorHex : mode);
    };

    const matchMediaList = window.matchMedia("(prefers-color-scheme: dark)");

    matchMediaList.addEventListener("change", handleChange);

    return () => {
      matchMediaList.removeEventListener("change", handleChange);
    };
  }, [props.resolvedTheme]);

  return {
    ...props,
    mode,
    bgcolor,
    colorHex,
    isDarkMode,
    isLightMode,
    isSystemDefault,
  };
}
