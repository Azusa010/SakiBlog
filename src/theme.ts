/**
 * 主题切换(SRS FR-THEME-001 ~ 005):
 * 浅色/深色两种主题;未手动选择时跟随系统偏好,手动选择写入 localStorage 记忆。
 * 样式端由 <html data-theme="..."> 驱动,见 assets/main.css。
 */
export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
}

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

function storedTheme(): Theme | null {
  const value = localStorage.getItem(STORAGE_KEY)
  return value === 'light' || value === 'dark' ? value : null
}

function systemTheme(): Theme {
  // matchMedia 不可用时默认浅色(FR-THEME-002)
  if (typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

export function resolveInitialTheme(): Theme {
  return storedTheme() ?? systemTheme()
}

export function saveTheme(theme: Theme): void {
  applyTheme(theme)
  localStorage.setItem(STORAGE_KEY, theme)
}

/** 未手动选择主题时,跟随系统偏好的实时变化。 */
export function watchSystemTheme(): void {
  if (typeof matchMedia !== 'function') return
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
    if (!storedTheme()) {
      applyTheme(event.matches ? 'dark' : 'light')
    }
  })
}
