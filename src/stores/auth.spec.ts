import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { fetchMe, login as apiLogin, logout as apiLogout } from '@/api/admin'
import { useAuthStore } from './auth'

vi.mock('@/api/admin', () => ({
  fetchMe: vi.fn<() => Promise<{ username: string }>>(),
  login: vi.fn<(u: string, p: string) => Promise<{ username: string }>>(),
  logout: vi.fn<() => Promise<{ status: string }>>(),
}))

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(fetchMe).mockReset()
    vi.mocked(apiLogin).mockReset()
    vi.mocked(apiLogout).mockReset()
  })

  it('restore picks up a valid session', async () => {
    vi.mocked(fetchMe).mockResolvedValue({ username: 'admin' })
    const auth = useAuthStore()

    expect(auth.checked).toBe(false)
    await auth.restore()
    expect(auth.username).toBe('admin')
    expect(auth.checked).toBe(true)
  })

  it('restore clears the session when it has expired', async () => {
    vi.mocked(fetchMe).mockRejectedValue(new Error('401'))
    const auth = useAuthStore()

    await auth.restore()
    expect(auth.username).toBeNull()
    expect(auth.checked).toBe(true)
  })

  it('login stores the username and logout clears it', async () => {
    vi.mocked(apiLogin).mockResolvedValue({ username: 'admin' })
    vi.mocked(apiLogout).mockResolvedValue({ status: 'ok' })
    const auth = useAuthStore()

    await auth.login('admin', 'password')
    expect(auth.username).toBe('admin')

    await auth.logout()
    expect(auth.username).toBeNull()
    expect(apiLogout).toHaveBeenCalledOnce()
  })
})
