import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // 管理端会话走签名 Cookie:开发期把 /api 代理到后端,保证 Cookie 同源
    // (localhost:5173 与 127.0.0.1:8000 跨站,SameSite 会拦掉 Cookie)
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
})
