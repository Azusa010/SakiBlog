import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { applyTheme, resolveInitialTheme, watchSystemTheme } from './theme'
import { vReveal } from './directives/reveal'
import { vSpotlight } from './directives/spotlight'
import { vScramble } from './directives/scramble'

// 挂载前先应用主题,避免首屏闪烁(FR-THEME-002/004)
applyTheme(resolveInitialTheme())
watchSystemTheme()

const app = createApp(App)

app.directive('reveal', vReveal)
app.directive('spotlight', vSpotlight)
app.directive('scramble', vScramble)
app.use(createPinia())
app.use(router)

app.mount('#app')
