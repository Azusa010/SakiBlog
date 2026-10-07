<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useTerminalStore } from '@/stores/terminal'

if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  gsap.registerPlugin(ScrollTrigger)
}

const terminal = useTerminalStore()
const aboutEl = ref<HTMLElement | null>(null)
let ctx: gsap.Context | null = null

const milestones = [
  {
    period: '2026 · NOW',
    title: 'SakiBlog 全栈工坊与先锋数字花园',
    desc: '重构打造集个人主页、作品集展示、技术博客与禅意终端于一体的数字资产；融合 Three.js WebGL 与 FastAPI 全流程自动化守护。',
  },
  {
    period: '2025 · EXPLORATION',
    title: '全栈工程化闭环与深度微服务实践',
    desc: '深耕 Python/FastAPI 与 Vue 3/TypeScript 现代工程流，注重严格的测试金字塔与类型安全体系。',
  },
  {
    period: '2024 · GENESIS',
    title: '界面美学与极客工具探索',
    desc: '从命令行工具、Linux 极客环境到现代 Web 先锋动效与无障碍设计的全方位探索。',
  },
]

const skillGroups = [
  {
    category: 'FRONTEND · 客户端与创意交互',
    items: ['Vue 3 (Composition API)', 'TypeScript', 'Three.js / WebGL', 'Vite', 'Pinia', 'Modern CSS / View Transitions'],
  },
  {
    category: 'BACKEND · 服务端与数据底座',
    items: ['Python 3.13', 'FastAPI', 'SQLAlchemy 2.0', 'MySQL 8 (utf8mb4)', 'RESTful APIs', 'JWT & Session Security'],
  },
  {
    category: 'ENGINEERING · 质量守卫与工具链',
    items: ['Vitest / Pytest', 'Playwright E2E', 'oxlint / ESLint 9', 'Git / CI Pipelines', 'Bash / Linux CLI'],
  },
]

onMounted(() => {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.gs-reveal').forEach((elem) => {
        ScrollTrigger.create({
          trigger: elem,
          start: 'top 85%',
          onEnter: () => {
            gsap.fromTo(
              elem,
              { y: 35, opacity: 0 },
              { y: 0, opacity: 1, duration: 1.2, ease: 'power2.out', overwrite: 'auto' },
            )
          },
          once: true,
        })
      })
    }, aboutEl.value ?? undefined)
  }
})

onBeforeUnmount(() => {
  ctx?.revert()
})
</script>

<template>
  <div id="about" ref="aboutEl" class="about-page relative min-h-[100dvh] w-full">
    <!-- Faint background image for postcard aura -->
    <div class="fixed inset-0 z-0 opacity-20 pointer-events-none" aria-hidden="true">
      <img
        src="https://images.unsplash.com/photo-1476820865390-c52aeebb9891?q=80&w=2000&auto=format&fit=crop"
        alt="Atmospheric backdrop"
        class="melancholy-img opacity-35"
      />
      <div class="melancholy-overlay"></div>
    </div>

    <!-- Centered Postcard Letter Card -->
    <div class="about-card relative z-10 mx-auto max-w-[680px] px-6 py-20 md:py-28 text-center">
      <!-- Kicker -->
      <p class="font-accent text-blue-400/50 mb-4 text-xs md:text-sm uppercase tracking-[0.25em] gs-reveal">
        Volume &amp; Letter · 关于与工坊
      </p>

      <h1 class="font-display text-5xl md:text-7xl lg:text-8xl text-slate-200 mb-8 gs-reveal">
        Who am I?
      </h1>

      <p class="font-accent text-2xl md:text-3xl text-blue-200/80 mb-10 italic gs-reveal">
        "To build is to leave a trace."
      </p>

      <!-- Identity badges -->
      <div class="flex flex-wrap justify-center gap-2 mb-12 gs-reveal">
        <span class="text-xs font-mono uppercase tracking-wider px-3.5 py-1 rounded-full border border-blue-400/30 bg-blue-400/5 text-blue-300">
          Full-Stack Software Engineer
        </span>
        <span class="text-xs font-mono uppercase tracking-wider px-3.5 py-1 rounded-full border border-white/10 bg-white/5 text-slate-400">
          Creative Technologist
        </span>
        <span class="text-xs font-mono uppercase tracking-wider px-3.5 py-1 rounded-full border border-white/10 bg-white/5 text-slate-400">
          Open Source Explorer
        </span>
      </div>

      <!-- Letter Body: Centered dense typography -->
      <div class="text-slate-300 text-base md:text-lg leading-[2.2] space-y-8 text-justify letter-body gs-reveal" style="text-align-last: center;">
        <p>
          <strong class="text-slate-100 font-medium">关于我 · Saki</strong> —
          I am a full-stack engineer wandering between logic and art. The internet used to be a place of discovery; now it is noisy. I strive to create quiet corners, where typography breathes and interactions feel like gentle whispers rather than loud demands.
        </p>
        <p>
          在代码中寻求秩序，在文字里安放诗意。坚信一个精心调校的 RESTful API 与经过光学字距微调的排版一样，具备同等的审美尊严与内在力量。
        </p>
        <p>
          Currently exploring WebGL, the limits of typography on screens, and building a digital sanctuary that feels quiet and enduring amidst the rapid tide of modern technology.
        </p>
      </div>

      <!-- Divider -->
      <div class="w-16 h-px bg-white/10 mx-auto my-16 gs-reveal" aria-hidden="true"></div>

      <!-- Craftsmanship & Skills -->
      <section class="text-left mb-16 gs-reveal" aria-label="技术栈与能力">
        <h2 class="font-display text-2xl md:text-3xl text-slate-200 mb-6 text-center">
          技术栈与设计底盘
        </h2>
        <div class="space-y-6">
          <div
            v-for="group in skillGroups"
            :key="group.category"
            class="border-b border-white/5 pb-5"
          >
            <p class="font-mono text-xs uppercase tracking-widest text-blue-400/60 mb-2">
              {{ group.category }}
            </p>
            <p class="font-sans text-sm md:text-base text-slate-300 leading-relaxed">
              {{ group.items.join(' · ') }}
            </p>
          </div>
        </div>
      </section>

      <!-- Milestones & Journey -->
      <section class="text-left mb-16 gs-reveal" aria-label="历程与里程碑">
        <h2 class="font-display text-2xl md:text-3xl text-slate-200 mb-8 text-center">
          历程与航迹
        </h2>
        <div class="space-y-8 border-l border-white/10 pl-6 ml-2 md:ml-4">
          <div
            v-for="mile in milestones"
            :key="mile.period"
            class="relative"
          >
            <span
              class="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-400/50 border-2 border-slate-900"
              aria-hidden="true"
            ></span>
            <span class="font-mono text-xs text-blue-400/70 tracking-widest uppercase block mb-1">
              {{ mile.period }}
            </span>
            <h3 class="font-sans text-base md:text-lg font-medium text-slate-200 mb-2">
              {{ mile.title }}
            </h3>
            <p class="font-sans text-sm text-slate-400 leading-relaxed">
              {{ mile.desc }}
            </p>
          </div>
        </div>
      </section>

      <!-- Contact & Communication -->
      <section class="pt-10 border-t border-white/10 gs-reveal" aria-label="联络与交流">
        <h2 class="font-accent text-2xl text-blue-200/80 mb-4 italic">
          交流与交谈
        </h2>
        <p class="text-slate-400 text-sm md:text-base mb-8 max-w-md mx-auto leading-relaxed font-sans">
          无论是探讨全栈工程架构、先锋界面设计，还是纯粹分享文字与音乐，欢迎随时建立连接。
        </p>
        <p class="text-slate-500 text-xs md:text-sm tracking-widest uppercase flex flex-wrap justify-center items-center gap-6 font-mono">
          <a
            href="https://github.com/Azusa010"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:text-blue-300 transition-colors"
          >
            Github ↗
          </a>
          <a
            href="mailto:contact@sakiblog.dev"
            class="hover:text-blue-300 transition-colors"
          >
            Email ↗
          </a>
          <button
            type="button"
            class="cursor-pointer hover:text-blue-300 transition-colors uppercase tracking-widest font-mono text-xs md:text-sm"
            @click="terminal.open()"
          >
            CLI Terminal &gt;_
          </button>
        </p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.about-page {
  color: var(--color-text, #e2e8f0);
}

.font-display {
  font-family: var(--font-display, 'Cormorant Garamond', serif);
}

.font-accent {
  font-family: var(--font-accent, 'EB Garamond', serif);
  font-style: italic;
}

.letter-body {
  font-family: var(--font-sans, 'Geist', sans-serif);
}

.melancholy-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(3, 7, 13, 0.4) 0%, rgba(3, 7, 13, 0.95) 100%), rgba(15, 30, 50, 0.4);
  mix-blend-mode: multiply;
  pointer-events: none;
}

.melancholy-img {
  filter: grayscale(35%) contrast(110%) brightness(85%) sepia(15%) hue-rotate(185deg);
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
