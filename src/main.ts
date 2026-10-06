import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { applyTheme, resolveInitialTheme, watchSystemTheme } from './theme'
import { initSmoothScroll } from './lib/smoothScroll'
import { vReveal } from './directives/reveal'
import { vSpotlight } from './directives/spotlight'
import { vScramble } from './directives/scramble'

// 挂载前先应用主题,避免首屏闪烁(FR-THEME-002/004)
applyTheme(resolveInitialTheme())
watchSystemTheme()
initSmoothScroll()

const app = createApp(App)

app.directive('reveal', vReveal)
app.directive('spotlight', vSpotlight)
app.directive('scramble', vScramble)
app.use(createPinia())
app.use(router)

app.mount('#app')

// 控制台彩蛋:SAKIBLOG 航空招飞
console.log(
  '%c✈ SAKIBLOG%c 招飞启事:会写 Vue 的飞行员优先。能打开控制台的 you,已经完成登机。',
  'background:#0d1420;color:#d9a878;padding:2px 10px;letter-spacing:.25em',
  'color:#8b95a5;letter-spacing:.05em',
)
