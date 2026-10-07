<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import gsap from 'gsap'
import { useBootStore } from '@/stores/boot'
import { useTerminalStore } from '@/stores/terminal'

const boot = useBootStore()
const terminal = useTerminalStore()
const homeEl = ref<HTMLElement | null>(null)
let ctx: gsap.Context | null = null

function onHeroDblClick() {
  terminal.open()
}

onMounted(() => {
  boot.markAssetsReady()
  boot.finish()

  ctx = gsap.context(() => {
    gsap.fromTo(
      '.gs-hero-img-wrap',
      { opacity: 0, scale: 0.98 },
      { opacity: 1, scale: 1, duration: 2, ease: 'power2.inOut' },
    )
    gsap.fromTo(
      '.gs-hero-el',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.5, stagger: 0.15, ease: 'power2.out', delay: 0.3 },
    )
  }, homeEl.value ?? undefined)
})

onBeforeUnmount(() => {
  ctx?.revert()
})
</script>

<template>
  <div id="home" ref="homeEl" class="editorial-home" @dblclick="onHeroDblClick">
    <section class="relative min-h-[100dvh] w-full pt-32 px-8 md:px-16 flex items-center">
      <div class="max-w-[1400px] w-full mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-24 items-center">
        <!-- Left Column (Editorial Typography) -->
        <div class="md:col-span-5 flex flex-col justify-center order-2 md:order-1 z-10">
          <p class="font-accent text-blue-400/50 mb-8 text-sm gs-hero-el">Volume IV — Serenity</p>
          <h1 class="font-display text-6xl md:text-8xl lg:text-[8rem] leading-[0.9] mb-8 text-slate-200 gs-hero-el">
            Into the <br /><span class="text-blue-200/80 italic font-accent">Blue.</span>
          </h1>
          <p class="text-slate-400 text-lg leading-relaxed mb-12 max-w-sm gs-hero-el">
            Quiet observations on design, the architecture of the web, and the weight of empty space.
          </p>
          <div class="pt-8 border-t border-white/5 gs-hero-el">
            <RouterLink
              to="/posts"
              class="cursor-pointer text-xs uppercase tracking-[0.2em] text-slate-500 hover:text-blue-300 transition-colors duration-500 flex items-center gap-4 group"
            >
              <span class="w-8 h-px bg-current transition-all group-hover:w-12"></span> Explore Notes
            </RouterLink>
          </div>
        </div>

        <!-- Right Column (Static Photograph from Demo) -->
        <div class="md:col-span-7 h-[65vh] md:h-[85vh] w-full relative order-1 md:order-2 overflow-hidden rounded-sm gs-hero-img-wrap">
          <img src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=2000&auto=format&fit=crop" class="melancholy-img hero-img-pan gs-hero-img w-full h-full object-cover" alt="Peaceful dark forest lake" />
          <div class="melancholy-overlay" aria-hidden="true"></div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.editorial-home {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background-color: var(--color-bg, #03070d);
  color: var(--color-text, #e2e8f0);
}

.font-display {
  font-family: var(--font-display, 'Cormorant Garamond', serif);
}

.font-accent {
  font-family: var(--font-accent, 'EB Garamond', serif);
  font-style: italic;
}

.melancholy-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(3, 7, 13, 0.2) 0%, rgba(3, 7, 13, 0.9) 100%), rgba(15, 30, 50, 0.35);
  mix-blend-mode: multiply;
  pointer-events: none;
  z-index: 10;
}

.melancholy-img {
  filter: grayscale(35%) contrast(110%) brightness(85%) sepia(15%) hue-rotate(185deg);
}

.hero-img-pan {
  animation: slowPan 30s ease-in-out infinite alternate;
  transform-origin: 50% 50%;
}

@keyframes slowPan {
  0% { transform: scale(1.03) translate(0, 0); }
  100% { transform: scale(1.08) translate(-1.5%, -1%); }
}
</style>
