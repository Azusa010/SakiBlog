import { beforeEach, describe, expect, it } from 'vitest'
import { applyTheme, currentTheme, resolveInitialTheme, saveTheme } from './theme'

describe('theme module', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('falls back to light when nothing is stored (jsdom has no matchMedia)', () => {
    expect(resolveInitialTheme()).toBe('light')
  })

  it('restores a manually stored preference', () => {
    localStorage.setItem('theme', 'dark')
    expect(resolveInitialTheme()).toBe('dark')
  })

  it('ignores invalid stored values', () => {
    localStorage.setItem('theme', 'blue')
    expect(resolveInitialTheme()).toBe('light')
  })

  it('saveTheme applies the theme to the document and persists it', () => {
    saveTheme('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(currentTheme()).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')

    saveTheme('light')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('applyTheme alone does not touch storage', () => {
    applyTheme('dark')
    expect(localStorage.getItem('theme')).toBeNull()
  })
})
