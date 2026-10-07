import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTerminalStore } from './terminal'

describe('terminal store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts with closed state', () => {
    const terminal = useTerminalStore()
    expect(terminal.isOpen).toBe(false)
  })

  it('opens and closes correctly', () => {
    const terminal = useTerminalStore()
    terminal.open()
    expect(terminal.isOpen).toBe(true)
    terminal.close()
    expect(terminal.isOpen).toBe(false)
  })

  it('toggles correctly', () => {
    const terminal = useTerminalStore()
    expect(terminal.isOpen).toBe(false)
    terminal.toggle()
    expect(terminal.isOpen).toBe(true)
    terminal.toggle()
    expect(terminal.isOpen).toBe(false)
  })

  it('handles pending commands when opening', () => {
    const terminal = useTerminalStore()
    terminal.open('projects')
    expect(terminal.isOpen).toBe(true)
    expect(terminal.pendingCommand).toBe('projects')
    expect(terminal.consumePendingCommand()).toBe('projects')
    expect(terminal.pendingCommand).toBeNull()
  })
})
