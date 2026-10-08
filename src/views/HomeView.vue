<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { useBootStore } from '@/stores/boot'
import { useTerminalStore } from '@/stores/terminal'

gsap.registerPlugin(ScrollTrigger)

const boot = useBootStore()
const terminal = useTerminalStore()
const homeEl = ref<HTMLElement | null>(null)
const wrapEl = ref<HTMLElement | null>(null)
const trackEl = ref<HTMLElement | null>(null)
const kineticEl = ref<HTMLElement | null>(null)
const videoEls = ref<HTMLVideoElement[]>([])

let ctx: gsap.Context | null = null

// Define the mood videos explicitly for the serenity vibe, decoupled from projects
const moodVideos = [
  { id: 1, title: 'Breathe.', video: '/videos/mixkit-gigantic-field-of-sunflowers-on-a-sunny-day-4881-hd-ready.mp4' },
  { id: 2, title: 'Observe.', video: '/videos/12160567-hd_1280_720_25fps.mp4' },
  { id: 3, title: 'Reflect.', video: '/videos/5437124-hd_1280_720_24fps.mp4' },
  { id: 4, title: 'Disconnect.', video: '/videos/7276307-hd_1280_720_18fps.mp4' }
]

onMounted(() => {
  boot.markAssetsReady()
  boot.finish()

  ctx = gsap.context(() => {
    // Hero Entrance Animations
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

    // Horizontal Pan with GSAP ScrollTrigger
    if (wrapEl.value && trackEl.value) {
      const distance = trackEl.value.scrollWidth - window.innerWidth

      const panTween = gsap.to(trackEl.value, {
        x: -distance,
        ease: 'none',
        scrollTrigger: {
          trigger: wrapEl.value,
          start: 'top top',
          end: () => `+=${distance}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      })

      // Setup ScrollTrigger for each video inside the horizontal pan
      const panels = gsap.utils.toArray('.pan-panel')
      panels.forEach((panel: any, i: number) => {
        const video = videoEls.value[i]
        const textOverlay = panel.querySelector('.mood-text')
        
        if (video && textOverlay) {
          ScrollTrigger.create({
            trigger: panel,
            containerAnimation: panTween,
            start: 'left center',
            end: 'right center',
            onEnter: () => {
              video.play()
              gsap.to(video, { opacity: 1, filter: 'grayscale(0%)', duration: 1, ease: 'power2.out' })
              gsap.to(textOverlay, { opacity: 1, y: 0, duration: 1, delay: 0.2, ease: 'power2.out' })
            },
            onLeave: () => {
              video.pause()
              gsap.to(video, { opacity: 0.3, filter: 'grayscale(40%)', duration: 1, ease: 'power2.out' })
              gsap.to(textOverlay, { opacity: 0, y: -20, duration: 1, ease: 'power2.out' })
            },
            onEnterBack: () => {
              video.play()
              gsap.to(video, { opacity: 1, filter: 'grayscale(0%)', duration: 1, ease: 'power2.out' })
              gsap.to(textOverlay, { opacity: 1, y: 0, duration: 1, delay: 0.2, ease: 'power2.out' })
            },
            onLeaveBack: () => {
              video.pause()
              gsap.to(video, { opacity: 0.3, filter: 'grayscale(40%)', duration: 1, ease: 'power2.out' })
              gsap.to(textOverlay, { opacity: 0, y: 20, duration: 1, ease: 'power2.out' })
            },
          })
        }
      })
    }

    // Kinetic Typography ScrollTrigger
    if (kineticEl.value) {
      gsap.to('.kinetic-right', {
        xPercent: -15,
        ease: 'none',
        scrollTrigger: {
          trigger: kineticEl.value,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      })
      gsap.to('.kinetic-left', {
        xPercent: 15,
        ease: 'none',
        scrollTrigger: {
          trigger: kineticEl.value,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      })
    }
    // 3D Perspective Scroll
    const pCards = gsap.utils.toArray('.perspective-card')
    if (pCards.length) {
      const pTl = gsap.timeline({
        scrollTrigger: {
          trigger: '#perspective-section',
          start: 'top top',
          end: '+=150%',
          scrub: 1,
          pin: true
        }
      })

      pCards.forEach((card: any, i: number) => {
        pTl.to(card, { z: 0, opacity: 1, duration: 1, ease: 'power1.inOut' }, i * 0.8)
           .to(card, { z: 1200, opacity: 0, duration: 1, ease: 'power1.inOut' }, (i * 0.8) + 1.5)
      })
    }

    // Parallax Stack
    const plxEls = gsap.utils.toArray('.plx-el')
    if (plxEls.length) {
      plxEls.forEach((el: any) => {
        const speed = parseFloat(el.getAttribute('data-speed') || '0')
        gsap.to(el, {
          y: () => -(window.innerHeight * speed),
          ease: 'none',
          scrollTrigger: {
            trigger: '#parallax-section',
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        })
      })
    }
  }, homeEl.value ?? undefined)
})

onBeforeUnmount(() => {
  ctx?.revert()
})
</script>

<template>
  <div id="home" ref="homeEl" class="editorial-home">
    <section class="relative min-h-[100dvh] w-full pt-32 px-8 md:px-16 flex items-center">
      <div class="max-w-[1400px] w-full mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-24 items-center">
        <!-- Left Column (Editorial Typography) -->
        <div class="md:col-span-5 flex flex-col justify-center order-2 md:order-1 z-10">
          <p class="font-accent text-blue-400/50 mb-8 text-lg md:text-xl tracking-wide gs-hero-el">Volume IV — Serenity</p>
          <h1 class="font-display text-7xl md:text-9xl lg:text-[10rem] leading-[0.9] mb-8 text-slate-200 gs-hero-el">
            Into the <br /><span class="text-blue-200/80 italic font-accent">Blue.</span>
          </h1>
          <p class="text-slate-400 text-xl md:text-2xl leading-relaxed mb-12 max-w-md gs-hero-el">
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

    <!-- HORIZONTAL PAN SECTION -->
    <section ref="wrapEl" class="relative overflow-hidden w-full bg-[#03070d]">
      <div ref="trackEl" class="flex h-[100dvh] items-center pl-[10vw] md:pl-[15vw]">
        
        <div 
          v-for="item in moodVideos" 
          :key="item.id"
          class="pan-panel w-[85vw] md:w-[70vw] h-[75vh] mr-[10vw] md:mr-[15vw] flex-shrink-0 relative rounded-sm overflow-hidden bg-black"
        >
          <video 
            ref="videoEls"
            :src="item.video" 
            loop muted playsinline
            class="absolute inset-0 w-full h-full object-cover opacity-30 grayscale-[40%] transition-opacity duration-700"
          ></video>
          
          <!-- Minimal overlay with center text -->
          <div class="relative z-10 w-full h-full flex items-center justify-center bg-black/10 pointer-events-none">
            <h3 class="mood-text text-6xl md:text-8xl font-display text-white/95 tracking-wide opacity-0 translate-y-8 drop-shadow-2xl">
              {{ item.title }}
            </h3>
          </div>
        </div>

      </div>
    </section>

    <!-- KINETIC TYPOGRAPHY SECTION -->
    <section ref="kineticEl" class="h-[80vh] flex flex-col justify-center overflow-hidden relative bg-[#03070d] py-20 border-t border-white/5">
      <div class="flex flex-col gap-6 md:gap-10 w-[200vw] -ml-[50vw]">
        <div class="kinetic-right text-[12vw] md:text-[8vw] font-display font-bold uppercase whitespace-nowrap leading-none text-transparent tracking-tighter" style="-webkit-text-stroke: 1px rgba(255,255,255,0.15);">
          ARCHITECTURE OF THE WEB • ARCHITECTURE OF THE WEB • ARCHITECTURE OF THE WEB • ARCHITECTURE OF THE WEB
        </div>
        <div class="kinetic-left text-[14vw] md:text-[9vw] font-display font-bold uppercase whitespace-nowrap leading-none text-slate-200 tracking-tighter">
          THE WEIGHT OF EMPTY SPACE • THE WEIGHT OF EMPTY SPACE • THE WEIGHT OF EMPTY SPACE
        </div>
        <div class="kinetic-right text-[12vw] md:text-[8vw] font-display font-bold uppercase whitespace-nowrap leading-none text-transparent tracking-tighter" style="-webkit-text-stroke: 1px rgba(255,255,255,0.15);">
          QUIET OBSERVATIONS • QUIET OBSERVATIONS • QUIET OBSERVATIONS • QUIET OBSERVATIONS
        </div>
      </div>
    </section>

    <!-- 3D PERSPECTIVE SECTION -->
    <section id="perspective-section" class="h-[150vh] perspective-[1500px] bg-[#03070d]">
      <div class="sticky top-0 h-[100vh] overflow-hidden flex items-center justify-center">
        
        <div class="perspective-card absolute w-[80vw] md:w-[50vw] h-[60vh] rounded-xl overflow-hidden border border-white/10" style="transform: translateZ(-3000px); opacity: 0;">
          <img src="/images/semr62rBJO0.jpg" class="absolute inset-0 w-full h-full object-cover opacity-60 grayscale-[40%]" />
          <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span class="font-mono text-xs uppercase tracking-[0.3em] text-slate-400 mb-4">Space</span>
            <h3 class="font-display text-7xl text-white">Depth.</h3>
          </div>
        </div>

        <div class="perspective-card absolute w-[70vw] md:w-[45vw] h-[55vh] rounded-xl overflow-hidden border border-white/10" style="transform: translateZ(-3000px); opacity: 0;">
          <img src="/images/cSvCNWb6Aic.jpg" class="absolute inset-0 w-full h-full object-cover opacity-60 grayscale-[40%]" />
          <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span class="font-mono text-xs uppercase tracking-[0.3em] text-slate-400 mb-4">Time</span>
            <h3 class="font-display text-7xl text-white">Motion.</h3>
          </div>
        </div>

        <div class="perspective-card absolute w-[60vw] md:w-[40vw] h-[50vh] rounded-xl overflow-hidden border border-white/10" style="transform: translateZ(-3000px); opacity: 0;">
          <img src="/images/1lLqsynNaZY.jpg" class="absolute inset-0 w-full h-full object-cover opacity-60 grayscale-[40%]" />
          <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span class="font-mono text-xs uppercase tracking-[0.3em] text-slate-400 mb-4">Void</span>
            <h3 class="font-display text-7xl text-white">Silence.</h3>
          </div>
        </div>

      </div>
    </section>

    <!-- PARALLAX STACK SECTION -->
    <section id="parallax-section" class="h-[150vh] relative overflow-hidden bg-[#03070d] flex items-center justify-center border-t border-white/5">
      
      <div class="plx-el absolute left-[5%] md:left-[10%] top-[5%] w-[40vw] md:w-[20vw] h-[30vh] rounded-lg overflow-hidden border border-white/5" data-speed="0.15">
        <img src="/images/1lLqsynNaZY.jpg" class="w-full h-full object-cover grayscale-[50%] opacity-70" />
      </div>
      
      <div class="plx-el absolute right-[5%] md:right-[15%] top-[40%] w-[50vw] md:w-[35vw] h-[40vh] rounded-lg overflow-hidden z-10 border border-white/5" data-speed="-0.25">
        <img src="/images/cSvCNWb6Aic.jpg" class="w-full h-full object-cover grayscale-[30%] opacity-80" />
      </div>

      <div class="plx-el absolute left-[25%] top-[60%] w-[35vw] md:w-[15vw] h-[35vw] md:h-[15vw] rounded-full overflow-hidden border border-white/10" data-speed="-0.1">
        <img src="/images/hwLAI5lRhdM.jpg" class="w-full h-full object-cover grayscale-[60%] opacity-60" />
      </div>

      <div class="plx-el absolute right-[10%] md:right-[20%] top-[10%] w-[25vw] md:w-[15vw] h-[20vh] rounded-lg overflow-hidden border border-white/5" data-speed="0.3">
        <img src="/images/semr62rBJO0.jpg" class="w-full h-full object-cover grayscale-[40%] opacity-50" />
      </div>

      <div class="plx-el absolute left-[15%] top-[80%] w-[30vw] md:w-[25vw] h-[25vh] rounded-lg overflow-hidden border border-white/5" data-speed="-0.15">
        <img src="/images/Hzc7XsBk8xY.jpg" class="w-full h-full object-cover grayscale-[50%] opacity-60" />
      </div>

      <div class="z-0 flex flex-col items-center text-center pointer-events-none" style="mix-blend-mode: difference;">
        <h2 class="font-display text-7xl md:text-9xl text-slate-200">Layers of</h2>
        <h2 class="font-display text-7xl md:text-9xl text-slate-200 italic font-accent">Serenity</h2>
      </div>
    </section>

    <section class="h-[30vh] flex items-center justify-center border-t border-white/5 bg-[#03070d]">
      <p class="text-slate-600 font-accent italic text-2xl">To be continued...</p>
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
