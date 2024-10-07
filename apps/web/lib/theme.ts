export function getSystemTheme() {
  return getComputedStyle(document.documentElement).getPropertyValue("--theme");
}
