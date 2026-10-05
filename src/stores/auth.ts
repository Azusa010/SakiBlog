import { ref } from 'vue'
import { defineStore } from 'pinia'
import { fetchMe, login as apiLogin, logout as apiLogout } from '@/api/admin'

/**
 * 管理员会话状态(FR-AUTH-001 ~ 005):
 * restore 在进入受保护路由前调用一次,用 /api/admin/me 检查会话是否仍有效。
 */
export const useAuthStore = defineStore('auth', () => {
  const username = ref<string | null>(null)
  const checked = ref(false)

  async function restore() {
    try {
      username.value = (await fetchMe()).username
    } catch {
      username.value = null
    } finally {
      checked.value = true
    }
  }

  async function login(user: string, password: string) {
    const result = await apiLogin(user, password)
    username.value = result.username
  }

  async function logout() {
    try {
      await apiLogout()
    } finally {
      username.value = null
    }
  }

  return { username, checked, restore, login, logout }
})
