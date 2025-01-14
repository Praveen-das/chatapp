"use client";
import { useEffect } from "react";
import { useTheme } from "next-themes";

export function ThemeManager() {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const active_mode = theme?.split("-")[0];
    let bgcolor = theme?.split("-")[1];

    const isSystemDefault =
      active_mode === "system" ||
      active_mode === "light" ||
      active_mode === "dark";

    const matchMediaList = window.matchMedia("(prefers-color-scheme: dark)")

    const handleChange = (e:MediaQueryListEvent) => {
      if (!isSystemDefault) return;
      let mode = e.matches ? "dark" : "light";

      setTheme(bgcolor ? mode + "-" + bgcolor : mode);
    };

    matchMediaList.addEventListener('change', handleChange);
    
    return () => {
      matchMediaList.removeEventListener('change', handleChange);
    };
  }, [theme]);

  return null;
}
