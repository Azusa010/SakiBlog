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
    period: '2026 · AI & AGENTS',
    title: 'Local-first AI & Workflow Platforms',
    desc: 'Developed personal-agent (a local-first AI assistant with tool calling) and SakiFlow (an AI workflow orchestrator with Monaco Editor). Deeply explored Python RAG architectures.',
  },
  {
    period: '2026 · DESKTOP EXCELLENCE',
    title: 'Cross-Platform Desktop Applications',
    desc: 'Built SakiVault, a modern desktop application for anime tracking and cataloging, leveraging Vue 3 and Electron for seamless native experiences.',
  },
  {
    period: '2026 · AESTHETIC WEB',
    title: 'SakiBlog & Digital Gardens',
    desc: 'Crafted SakiBlog, an aesthetic fullstack digital garden fusing minimalist typography, dark mode UI, and a fully functional embedded CLI terminal.',
  },
]

const skillGroups = [
  {
    category: 'FRONTEND & DESKTOP · 客户端与桌面端',
    items: ['Vue 3 (Composition API)', 'TypeScript', 'Electron', 'Tailwind CSS', 'Pinia', 'Monaco Editor'],
  },
  {
    category: 'AI & BACKEND · 人工智能与服务端',
    items: ['Python', 'RAG (Retrieval-Augmented Generation)', 'LLM Integration', 'FastAPI', 'Node.js'],
  },
  {
    category: 'ENGINEERING · 架构与工程化',
    items: ['Monorepo', 'Git / GitHub Actions', 'RESTful APIs', 'Local-first Architecture', 'UI/UX Design'],
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
          Software Engineer
        </span>
        <span class="text-xs font-mono uppercase tracking-wider px-3.5 py-1 rounded-full border border-white/10 bg-white/5 text-slate-400">
          AI & Desktop App Developer
        </span>
        <span class="text-xs font-mono uppercase tracking-wider px-3.5 py-1 rounded-full border border-white/10 bg-white/5 text-slate-400">
          Open Source Explorer
        </span>
      </div>

      <!-- Letter Body: Centered dense typography -->
      <div class="text-slate-300 text-base md:text-lg leading-[2.2] space-y-8 text-justify letter-body gs-reveal" style="text-align-last: center;">
        <p>
          <strong class="text-slate-100 font-medium">Azusa010</strong> —
          A software engineer focused on local-first applications, AI agents, and cross-platform architecture.
        </p>
        <p>
          我主要关注 TypeScript 与 Python 生态，热衷于构建具备良好工程结构的实用产品。近期的开发重心集中在基于 Electron 的现代化桌面应用、RAG 检索增强架构，以及集成大模型工具调用（Tool Calling）的本地化个人 AI 助手。
        </p>
        <p>
          I prefer simple, robust systems over complex abstractions, aiming to deliver software that is both highly functional and aesthetically clean.
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
          欢迎就开源项目、系统架构或技术开发相关的话题进行交流。
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
