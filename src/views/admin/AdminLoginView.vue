<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

/** 管理员登录页(FR-AUTH-001/002)。 */
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const username = ref('')
const password = ref('')
const error = ref('')
const submitting = ref(false)

async function submit() {
  if (submitting.value) return
  submitting.value = true
  error.value = ''
  try {
    await auth.login(username.value.trim(), password.value)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/admin/posts'
    router.push(redirect)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '登录失败,请稍后重试'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="login">
    <h1>管理员登录</h1>
    <form @submit.prevent="submit">
      <label>
        用户名
        <input v-model="username" type="text" name="username" autocomplete="username" required />
      </label>
      <label>
        密码
        <input v-model="password" type="password" name="password" autocomplete="current-password" required />
      </label>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <button type="submit" :disabled="submitting">{{ submitting ? '登录中…' : '登录' }}</button>
    </form>
  </section>
</template>

<style scoped>
.login {
  max-width: 20rem;
  margin: var(--space-12) auto;
}

label {
  display: block;
  margin-bottom: var(--space-4);
  color: var(--color-text-muted);
}

input {
  display: block;
  width: 100%;
  margin-top: var(--space-1);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg);
  color: var(--color-text);
  font: inherit;
}

.error {
  color: var(--color-danger);
  font-size: 0.875rem;
}

button {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
}

button:hover:not(:disabled) {
  border-color: var(--color-accent);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
