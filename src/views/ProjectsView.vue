<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  CATEGORY_LABELS,
  PROJECTS_DATA,
  type ProjectCategory,
  type ProjectItem,
} from '@/data/projects'
import { useTerminalStore } from '@/stores/terminal'

if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  gsap.registerPlugin(ScrollTrigger)
}

const terminal = useTerminalStore()
const activeCategory = ref<ProjectCategory>('all')
const categories: ProjectCategory[] = ['all', 'fullstack', 'creative', 'tool']
const portfolioEl = ref<HTMLElement | null>(null)
let ctx: gsap.Context | null = null

const PROJECT_FALLBACK_IMAGES = [
  'https://freenaturestock.com/photos/preview/freenaturestock-2281.jpg',
  'https://freenaturestock.com/photos/preview/freenaturestock-2279.jpg',
  'https://freenaturestock.com/photos/preview/freenaturestock-2198.jpg',
  'https://unsplash.com/photos/u27Rrbs9Dwc/download?w=1200',
  'https://unsplash.com/photos/3-esk8zPwPY/download?w=1200',
]

function getProjectImage(project: ProjectItem, index: number): string {
  return project.coverImage || PROJECT_FALLBACK_IMAGES[index % PROJECT_FALLBACK_IMAGES.length]!
}

const filteredProjects = computed<ProjectItem[]>(() => {
  if (activeCategory.value === 'all') {
    return PROJECTS_DATA
  }
  return PROJECTS_DATA.filter((p) => p.category === activeCategory.value)
})

function countByCategory(cat: ProjectCategory): number {
  if (cat === 'all') return PROJECTS_DATA.length
  return PROJECTS_DATA.filter((p) => p.category === cat).length
}

function openUrl(url?: string) {
  if (!url || url === '#') return
  if (url.startsWith('http')) {
    window.open(url, '_blank', 'noopener,noreferrer')
  } else {
    window.location.href = url
  }
}

function initAnimations() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return
  }
  ctx?.revert()
  ctx = gsap.context(() => {
    gsap.utils.toArray<HTMLElement>('.gs-reveal').forEach((elem) => {
      ScrollTrigger.create({
        trigger: elem,
        start: 'top 85%',
        onEnter: () => {
          gsap.fromTo(
            elem,
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.2, ease: 'power2.out', overwrite: 'auto' },
          )
        },
        once: true,
      })
    })
  }, portfolioEl.value ?? undefined)
}

onMounted(() => {
  initAnimations()
})

watch(filteredProjects, async () => {
  await nextTick()
  initAnimations()
})

onBeforeUnmount(() => {
  ctx?.revert()
})
</script>

<template>
  <div id="portfolio" ref="portfolioEl" class="portfolio-view w-full">
    <div class="pt-20 md:pt-32 px-6 md:px-16 max-w-[1400px] mx-auto pb-32">
      <!-- Header -->
      <header class="mb-16 md:mb-24 gs-reveal">
        <p class="font-accent text-blue-400/50 mb-4 text-sm uppercase tracking-widest">
          Selected Works · 作品集与工坊
        </p>
        <h1 class="font-display text-5xl md:text-7xl lg:text-8xl text-slate-200">
          The Portfolio.
        </h1>
        <p class="text-slate-400 text-base md:text-lg max-w-xl mt-4 leading-relaxed font-sans">
          在全栈工程闭环与先锋界面美学之间雕琢的数字产物。垂直沉浸式展列，静待探索。
        </p>

        <!-- Category Filters -->
        <div class="flex flex-wrap gap-2.5 mt-8 md:mt-10" role="tablist" aria-label="作品分类筛选">
          <button
            v-for="cat in categories"
            :key="cat"
            type="button"
            role="tab"
            class="filter-pill px-4 py-1.5 rounded-full text-xs font-mono tracking-wider transition-all duration-300 border cursor-pointer"
            :class="
              activeCategory === cat
                ? 'bg-blue-400/10 text-blue-300 border-blue-400/40 shadow-sm'
                : 'bg-white/5 text-slate-400 border-white/10 hover:border-slate-500 hover:text-slate-200'
            "
            :aria-selected="activeCategory === cat"
            @click="activeCategory = cat"
          >
            <span>{{ CATEGORY_LABELS[cat] }}</span>
            <span class="ml-1.5 opacity-60">({{ countByCategory(cat) }})</span>
          </button>
        </div>
      </header>

      <!-- Projects Stream (Vertical Immersive) -->
      <section class="projects-list flex flex-col" aria-label="全部作品">
        <div
          v-for="(project, index) in filteredProjects"
          :key="project.id"
          class="port-item group gs-reveal"
          tabindex="0"
          role="button"
          :aria-label="project.title"
          @click="openUrl(project.demoUrl || project.githubUrl)"
          @keydown.enter="openUrl(project.demoUrl || project.githubUrl)"
        >
          <!-- Left Content (Extreme Minimalism) -->
          <div class="z-10 relative pointer-events-none max-w-2xl py-12 md:py-0">
            <p class="font-accent text-slate-500 mb-4 tracking-widest text-sm flex items-center gap-3 transition-colors group-hover:text-blue-300/80">
              <span>{{ String(index + 1).padStart(2, '0') }} — {{ project.category.toUpperCase() }}</span>
            </p>

            <h2 class="font-display text-[12vw] md:text-[10vw] leading-[0.9] tracking-tight text-slate-200 port-title whitespace-nowrap">
              {{ project.title }}
            </h2>
            
            <div class="mt-8 opacity-0 -translate-x-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-x-0">
              <span class="text-xs font-mono uppercase tracking-[0.2em] text-slate-400">Explore Work ↗</span>
            </div>
          </div>

          <!-- Background Image Wrap (Scaling on hover) -->
          <div
            class="port-img-wrap"
            :class="index % 2 === 1 ? 'port-img-wrap-alt' : ''"
          >
            <img
              :src="getProjectImage(project, index)"
              :alt="project.title"
              class="port-img"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <!-- Footer & Terminal Speedrun -->
      <footer class="mt-24 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 gs-reveal">
        <p class="text-slate-500 text-sm font-accent italic">
          "Crafted at the intersection of logic and melancholy."
        </p>
        <div class="flex items-center gap-4">
          <span class="text-xs font-mono text-slate-500 uppercase tracking-widest">Speedrun CLI</span>
          <button
            type="button"
            class="btn-open-terminal cursor-pointer text-xs font-mono px-4 py-2 rounded border border-blue-400/30 text-blue-300 hover:bg-blue-400/10 transition-colors flex items-center gap-2"
            @click="terminal.open()"
          >
            <span>&gt;_ Open Terminal</span>
          </button>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.portfolio-view {
  min-height: 100vh;
  color: var(--color-text, #e2e8f0);
}

.font-display {
  font-family: var(--font-display, 'Cormorant Garamond', serif);
}

.font-accent {
  font-family: var(--font-accent, 'EB Garamond', serif);
  font-style: italic;
}

/* Portfolio Vertical Immersive */
.port-item {
  min-height: 55vh;
  position: relative;
  display: flex;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  padding: 4rem 0;
}

@media (min-width: 768px) {
  .port-item {
    height: 75vh;
    min-height: 600px;
    padding: 0;
  }
}

.port-item:hover .port-title {
  color: var(--color-accent, #93c5fd);
  transform: translateX(1rem);
}



.port-title {
  transition: all 0.8s cubic-bezier(0.23, 1, 0.32, 1);
}

.port-img-wrap {
  position: absolute;
  right: 6%;
  top: 15%;
  width: 40%;
  height: 60%;
  overflow: hidden;
  opacity: 0;
  transition: all 0.8s cubic-bezier(0.23, 1, 0.32, 1);
  pointer-events: none;
  border-radius: 2px;
}

.port-img-wrap-alt {
  right: auto;
  left: 42%;
}

@media (max-width: 767px) {
  .port-img-wrap {
    width: 80%;
    height: 60%;
    right: 0;
    top: 20%;
    opacity: 0.08;
  }
  .port-img-wrap-alt {
    left: auto;
    right: 0;
  }
}

.port-item:hover .port-img-wrap {
  opacity: 0.85;
}

.port-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition:
    transform 0.8s cubic-bezier(0.23, 1, 0.32, 1),
    filter 0.8s cubic-bezier(0.23, 1, 0.32, 1);
}

.port-item:hover .port-img {
  transform: scale(1.05);
}

</style>
