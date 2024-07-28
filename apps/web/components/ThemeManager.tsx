'use client';
import { useEffect } from 'react';
import { useTheme } from 'next-themes';

export function ThemeManager() {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const default_mode = theme?.split('-')[0]

    if(default_mode === 'DARK' || default_mode === 'LIGHT') return

    window.matchMedia('(prefers-color-scheme: dark)').onchange = (e) => {
      let mode = e.matches ? 'dark' : 'light';
      let bgcolor = theme?.split('-')[1];

      let _theme = mode + "-" + bgcolor;

      setTheme(_theme);
    };
  }, [theme]);

  return null;
}
