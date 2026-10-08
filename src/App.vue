<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { currentTheme, saveTheme, type Theme } from '@/theme'
import { useBootStore } from '@/stores/boot'
import { useTerminalStore } from '@/stores/terminal'
import { useScenicStore } from '@/stores/scenic'
import BootLoader from '@/components/BootLoader.vue'
import CursorFx from '@/components/CursorFx.vue'
import FullscreenScenicStage from '@/components/FullscreenScenicStage.vue'
import PlaneSprite from '@/components/PlaneSprite.vue'
import ZenTerminalModal from '@/components/ZenTerminalModal.vue'
import BackToTop from '@/components/BackToTop.vue'

const terminal = useTerminalStore()
const scenic = useScenicStore()

// FR-SEARCH-001/003: 主要页面提供搜索入口, 空关键词不触发导航
const route = useRoute()
const router = useRouter()
const searchQuery = ref('')

function submitSearch() {
  const q = searchQuery.value.trim()
  if (!q) return
  router.push({ path: '/search', query: { q } })
  searchQuery.value = ''
}

// FR-THEME-003/004: 手动切换主题并记忆偏好; 支持的浏览器走 View Transition
const theme = ref<Theme>(currentTheme())

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

function toggleTheme(event?: MouseEvent) {
  const next: Theme = theme.value === 'dark' ? 'light' : 'dark'
  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => { ready: Promise<void> }
  }
  if (!prefersReducedMotion() && typeof doc.startViewTransition === 'function') {
    const transition = doc.startViewTransition(() => saveTheme(next))
    const button = event?.currentTarget as HTMLElement | undefined
    if (button) {
      const rect = button.getBoundingClientRect()
      const x = rect.left + rect.width / 2
      const y = rect.top + rect.height / 2
      const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
      transition.ready
        .then(() => {
          document.documentElement.animate(
            {
              clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
            },
            { duration: 420, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' },
          )
        })
        .catch(() => {})
    }
  } else {
    saveTheme(next)
  }
  theme.value = next
}

// 滚动感知: 驱动 N5 悬浮胶囊导航自适应微缩
const isScrolled = ref(false)
const boot = useBootStore()
const isHome = computed(() => route.path === '/')

watch(
  () => route.path,
  (path) => {
    if (path === '/') {
      // 首页交由 HomeView 视差流控制，默认呈现场景 0
      scenic.setScene(0)
    } else if (path === '/projects') {
      scenic.setScene(1)
    } else if (path.startsWith('/posts')) {
      scenic.setScene(2)
    } else if (path === '/about') {
      scenic.setScene(0)
    } else {
      scenic.setScene(1)
    }
  },
  { immediate: true },
)

watch(
  () => terminal.isOpen,
  (open) => {
    scenic.setDimmed(open)
  },
)

let scrollListener: (() => void) | null = null

onMounted(() => {
  if (prefersReducedMotion()) {
    boot.finish()
  }

  const checkScroll = () => {
    isScrolled.value = window.scrollY > 40
  }
  window.addEventListener('scroll', checkScroll, { passive: true })
  checkScroll()
  scrollListener = () => {
    window.removeEventListener('scroll', checkScroll)
  }
})

onBeforeUnmount(() => {
  scrollListener?.()
})
</script>

<template>
  <div class="layout">
    <!-- 全屏高地全景画布底座 (GLOBAL FULLSCREEN SCENIC STAGE - 仅非首页/非作品页全局展示) -->
    <FullscreenScenicStage v-if="!isHome && route.path !== '/projects'" />

    <!-- Editorial Minimal Navigation -->
    <nav 
      class="fixed top-0 left-0 w-full z-[100] px-8 md:px-16 py-8 flex justify-between items-center mix-blend-difference transition-all duration-700"
      :class="{ 'opacity-0 -translate-y-4': !boot.done && isHome, 'opacity-100 translate-y-0': boot.done || !isHome }"
    >
      <RouterLink to="/" class="text-lg tracking-widest uppercase text-slate-300 font-accent hover:text-white transition-colors">Saki</RouterLink>
      
      <div class="flex items-center gap-6 md:gap-8 text-xs md:text-sm tracking-widest uppercase text-slate-400">
        <RouterLink to="/" class="nav-link relative overflow-hidden cursor-pointer transition-colors duration-400 hover:text-white" active-class="active text-white">Home</RouterLink>
        <RouterLink to="/projects" class="nav-link relative overflow-hidden cursor-pointer transition-colors duration-400 hover:text-white" active-class="active text-white">Works</RouterLink>
        <RouterLink to="/posts" class="nav-link relative overflow-hidden cursor-pointer transition-colors duration-400 hover:text-white" active-class="active text-white">Notes</RouterLink>
        <RouterLink to="/about" class="nav-link relative overflow-hidden cursor-pointer transition-colors duration-400 hover:text-white" active-class="active text-white">About</RouterLink>
        
        <!-- Terminal & Theme Actions in minimal style -->
        <button type="button" class="hover:text-blue-300 transition-colors" @click="toggleTheme($event)" aria-label="Toggle Theme">
          {{ theme === 'dark' ? '☀' : '☾' }}
        </button>
        <button type="button" class="hover:text-blue-300 transition-colors font-mono" @click="terminal.toggle()" aria-label="Toggle Terminal">
          &gt;_
        </button>
      </div>
    </nav>

    <main class="site-main" :class="{ 'is-home': isHome }">
      <!-- 缓存文章列表页, 返回时保留筛选/分页/滚动状态(FR-LIST-006) -->
      <RouterView v-slot="{ Component }">
        <Transition name="route" mode="out-in">
          <KeepAlive include="PostsView">
            <component :is="Component" />
          </KeepAlive>
        </Transition>
      </RouterView>
    </main>

    <!-- Hallmark Ft4/Ft5 禅意终端 Colophon 页脚 -->
    <footer class="site-footer">
      <div class="footer-inner">
        <div
          class="footer-status interactive"
          title="点击呼出交互终端 (Ctrl+K / ~)"
          role="button"
          tabindex="0"
          @click="terminal.open()"
          @keydown.enter="terminal.open()"
        >
          <span class="status-dot" aria-hidden="true"></span>
          <span class="status-label">SYS·ONLINE · SAKIBLOG WORKSPACE [CLI &gt;_]</span>
        </div>
        <div class="footer-aside" style="display: flex; gap: 1rem; align-items: center;">
          <span class="footer-copy">© 2026 SAKIBLOG · ZEN TERMINAL</span>
          <span class="footer-copy" style="opacity: 0.6;">·</span>
          <span class="footer-copy">Imagery via <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" style="text-decoration: underline; text-underline-offset: 2px;">Unsplash</a></span>
        </div>
      </div>
    </footer>

    <Transition name="boot">
      <!-- 非首页落地时的兜底载入层 -->
      <BootLoader v-if="!boot.done && !isHome" @done="boot.finish()" />
    </Transition>

    <PlaneSprite />

    <CursorFx />

    <ZenTerminalModal />
    <BackToTop />
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Minimal Editorial Nav Link Styles */
.nav-link {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: color 0.4s ease;
}
.nav-link::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0%;
  height: 1px;
  background: currentColor;
  transition: width 0.6s cubic-bezier(0.23, 1, 0.32, 1);
}
.nav-link:hover::after,
.nav-link.active::after {
  width: 100%;
}
.nav-link.active {
  color: #fff;
}

/* N5 悬浮毛玻璃胶囊导航 */
.site-header {
  position: fixed;
  top: var(--space-md);
  left: 0;
  right: 0;
  z-index: var(--z-nav, 50);
  display: flex;
  justify-content: center;
  pointer-events: none;
  transition:
    transform var(--dur-base) var(--ease-out),
    opacity var(--dur-slow) ease;
}

.site-header.boot-hidden {
  opacity: 0;
  transform: translateY(-16px);
}

.nav-pill {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-2xs) var(--space-md);
  background: var(--color-surface);
  backdrop-filter: var(--backdrop-blur);
  -webkit-backdrop-filter: var(--backdrop-blur);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.28);
  transition:
    background-color var(--dur-base) ease,
    border-color var(--dur-base) ease,
    padding var(--dur-base) var(--ease-out),
    box-shadow var(--dur-base) ease;
}

.site-header.is-scrolled .nav-pill {
  padding-block: var(--space-3xs);
  background: var(--color-surface-hover);
  border-color: var(--color-border-glow);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.45);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  letter-spacing: 0.22em;
  font-weight: 500;
  text-decoration: none;
  padding: var(--space-3xs) var(--space-2xs);
  border-radius: var(--radius-sm);
  transition: color var(--dur-fast) ease;
}

.brand:hover {
  color: var(--color-accent);
}

.brand-mark {
  width: 1.125rem;
  height: 0.875rem;
  color: var(--color-accent);
}

.pill-divider {
  width: 1px;
  height: 1rem;
  background: var(--color-border);
  opacity: 0.7;
}

.site-nav {
  display: flex;
  align-items: center;
  gap: var(--space-3xs);
  font-size: 0.84rem;
  letter-spacing: 0.08em;
}

.site-nav a {
  position: relative;
  padding: var(--space-3xs) var(--space-2xs);
  border-radius: var(--radius-xs);
  color: var(--color-text-muted);
  transition:
    color var(--dur-fast) ease,
    background-color var(--dur-fast) ease;
}

.site-nav a:hover,
.site-nav a.router-link-active {
  color: var(--color-accent-high);
  background: var(--color-accent-glow);
}

.pill-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
}

.search-form {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  padding: 2px var(--space-2xs);
  transition: border-color var(--dur-fast) ease;
}

.search-form:focus-within {
  border-color: var(--color-accent);
}

.search-form input {
  width: 5.5rem;
  padding: 2px 4px;
  border: none;
  background: transparent;
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  outline: none;
}

.search-form input::placeholder {
  color: var(--color-text-dim);
}

.search-form button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 2px;
}

.search-form button:hover {
  color: var(--color-accent);
}

.search-icon {
  width: 0.85rem;
  height: 0.85rem;
}

.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.875rem;
  transition:
    color var(--dur-fast) ease,
    border-color var(--dur-fast) ease,
    background-color var(--dur-fast) ease;
}

.theme-toggle:hover {
  color: var(--color-accent-high);
  border-color: var(--color-accent);
  background: var(--color-accent-glow);
}

.terminal-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-accent);
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: -0.05em;
  transition:
    color var(--dur-fast) ease,
    border-color var(--dur-fast) ease,
    background-color var(--dur-fast) ease,
    transform var(--dur-fast) ease;
}

.terminal-toggle:hover {
  color: var(--color-accent-high);
  border-color: var(--color-accent);
  background: var(--color-accent-glow);
  transform: translateY(-1px);
}

/* 核心内容区 */
.site-main {
  position: relative;
  z-index: 1;
  flex: 1;
  width: 100%;
  max-width: var(--content-wide);
  margin: 0 auto;
  padding: calc(var(--space-3xl) + var(--space-lg)) max(var(--space-md), 3vw) var(--space-xl);
}

.site-main.is-home {
  max-width: 100%;
  margin: 0;
  padding: 0;
}

/* 极客禅意 Colophon 页脚 */
.site-footer {
  position: relative;
  z-index: 1;
  margin-top: auto;
  border-top: 1px solid rgba(147, 197, 253, 0.14);
  background: rgba(10, 20, 15, 0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.14em;
  padding: var(--space-lg) var(--space-md);
}

:root[data-theme='light'] .site-footer {
  border-top-color: rgba(59, 130, 246, 0.14);
  background: rgba(242, 247, 244, 0.78);
}

.footer-inner {
  max-width: var(--content-wide);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.footer-status {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  color: var(--color-text-dim);
  transition: color var(--dur-fast) ease;
}

.footer-status.interactive {
  cursor: pointer;
  padding: 2px 6px;
  border-radius: var(--radius-xs);
}

.footer-status.interactive:hover {
  color: var(--color-accent);
  background: var(--color-accent-glow);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-pill);
  background: var(--color-code-cyan);
  box-shadow: 0 0 8px var(--color-code-cyan);
}

.footer-tagline {
  margin: 0;
  font-family: var(--font-sans);
  color: var(--color-text-muted);
  font-style: italic;
  font-size: 0.85rem;
}

.footer-copy {
  color: var(--color-text-dim);
}

@media (max-width: 768px) {
  .site-header {
    top: var(--space-2xs);
    padding-inline: var(--space-2xs);
  }

  .nav-pill {
    flex-wrap: wrap;
    justify-content: center;
    padding: var(--space-2xs) var(--space-xs);
    gap: var(--space-2xs);
  }

  .brand-name {
    display: none;
  }

  .search-form input {
    width: 4rem;
  }

  .footer-inner {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-sm);
  }
}
</style>
