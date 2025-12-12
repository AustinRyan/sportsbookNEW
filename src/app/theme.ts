export type Theme = 'dark' | 'light'

// Bump key so old persisted values (e.g. light) don't override new default behavior.
const THEME_KEY = 'sportsbook.theme.v2'

export function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null
  const v = window.localStorage.getItem(THEME_KEY)
  if (v === 'dark' || v === 'light') return v
  return null
}

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = theme
}

export function setStoredTheme(theme: Theme) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(THEME_KEY, theme)
}

export function toggleTheme(current: Theme): Theme {
  return current === 'dark' ? 'light' : 'dark'
}


