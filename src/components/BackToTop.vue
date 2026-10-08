<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { scrollToTop } from '@/lib/smoothScroll'
import { useTerminalStore } from '@/stores/terminal'
import { useAudioStore } from '@/stores/audio'

/**
 * SakiBlog 终极形态吉祥物：全知复古终端 (Omniscient Zen Terminal - 32x32 Hi-Res)
 * 具备高清绘制分辨率、沉浸伴侣、音乐频谱、键盘共鸣、矩阵屏保、CRT关机等特性。
 */
const canvasRef = ref<HTMLCanvasElement | null>(null)
const audioRef = ref<HTMLAudioElement | null>(null)
const isHovered = ref(false)

const route = useRoute()
const terminal = useTerminalStore()
const audioStore = useAudioStore()

// --- State Logic ---
const isScrolling = ref(false)
const isIdle = ref(false)
const isDeepIdle = ref(false) 
const isTyping = ref(false)
const crtState = ref('on') 

// --- Drag Logic ---
const pos = ref({ x: -1, y: -1 })
const isDragging = ref(false)
let dragMoved = false
let dragOffset = { x: 0, y: 0 }

function onDragStart(e: MouseEvent) {
  if (e.button !== 0) return // Only left click
  isDragging.value = true
  dragMoved = false
  // If not initialized, calculate from current DOM rect
  if (pos.value.x === -1) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    pos.value = { x: rect.left, y: rect.top }
  }
  dragOffset.x = e.clientX - pos.value.x
  dragOffset.y = e.clientY - pos.value.y
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', onDragEnd)
}

function onDragMove(e: MouseEvent) {
  if (!isDragging.value) return
  const dx = e.clientX - (pos.value.x + dragOffset.x)
  const dy = e.clientY - (pos.value.y + dragOffset.y)
  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
    dragMoved = true
  }
  if (dragMoved) {
    pos.value.x = e.clientX - dragOffset.x
    pos.value.y = e.clientY - dragOffset.y
  }
}

function onDragEnd() {
  isDragging.value = false
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragEnd)
}

let scrollTimeout: number | null = null
let idleTimeout: number | null = null
let deepIdleTimeout: number | null = null
let typingTimeout: number | null = null

let typingGibberish: string[] = []
const rainCols = [0,2,4,1,3,7,6,5,2,8,9,3,4,7,6,5,1,2,9,0,3,4]

const currentContext = computed(() => {
  if (terminal.isOpen) return 'code'
  if (route.name === 'NotFound' || route.path.includes('404')) return 'error'
  return 'cursor'
})

// --- Audio Visualizer Setup ---
let audioCtx: AudioContext | null = null
let analyser: AnalyserNode | null = null
let dataArray: Uint8Array | null = null

function initAudio() {
  if (audioCtx) return
  audioCtx = new window.AudioContext()
  analyser = audioCtx.createAnalyser()
  analyser.fftSize = 64 
  
  if (!audioRef.value) return
  const source = audioCtx.createMediaElementSource(audioRef.value)
  source.connect(analyser)
  analyser.connect(audioCtx.destination)
  
  dataArray = new Uint8Array(analyser.frequencyBinCount)
}

function toggleMusic(e: Event) {
  e.preventDefault()
  if (dragMoved) return
  if (crtState.value !== 'on') return
  if (!audioCtx) initAudio()
  
  if (audioCtx?.state === 'suspended') {
    audioCtx.resume()
  }

  audioStore.toggle()
}

// --- Interaction Handlers ---

function handleDoubleClick(e: Event) {
  e.preventDefault()
  if (crtState.value !== 'on') return
  
  // Double-click triggers a CRT Reboot into the CLI Modal
  crtState.value = 'line'
  drawFrame()
  
  setTimeout(() => {
    crtState.value = 'dot'
    drawFrame()
    setTimeout(() => {
      crtState.value = 'off'
      drawFrame()
      setTimeout(() => {
        crtState.value = 'on'
        drawFrame()
        terminal.open() // Launch the CLI !
      }, 800)
    }, 100)
  }, 100)
}

function handleRightClick(e: Event) {
  // Right-click to scroll to top since double-click is taken
  e.preventDefault()
  scrollToTop()
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key.length > 1) return 
  
  isTyping.value = true
  typingGibberish = []
  for(let i=0; i<10; i++){
    let row = ""
    for(let j=0; j<22; j++){
      row += Math.random() > 0.8 ? "3" : "2"
    }
    typingGibberish.push(row)
  }
  
  drawFrame()
  if (typingTimeout) clearTimeout(typingTimeout)
  typingTimeout = window.setTimeout(() => {
    isTyping.value = false
    drawFrame()
  }, 100)
  
  resetIdle()
}

function resetIdle() {
  isDeepIdle.value = false
  if (deepIdleTimeout) clearTimeout(deepIdleTimeout)
  deepIdleTimeout = window.setTimeout(() => {
    isDeepIdle.value = true
  }, 10000)
}

function updateScroll() {
  isScrolling.value = true
  isIdle.value = false
  drawFrame()

  if (scrollTimeout) clearTimeout(scrollTimeout)
  if (idleTimeout) clearTimeout(idleTimeout)

  scrollTimeout = window.setTimeout(() => {
    isScrolling.value = false
    drawFrame()
    
    idleTimeout = window.setTimeout(() => {
      isIdle.value = true
      drawFrame()
    }, 3000)
  }, 150)
  
  resetIdle()
}

function handleMouseMove() {
  resetIdle()
}

// --- Rendering Logic (32x32 Hi-Res) ---
const palette: Record<string, string | null> = {
  '0': null, 
  '1': '#e2e8f0', '2': '#05080f', '3': '#d4a373', '4': '#cbd5e1',
  '5': '#94a3b8', '6': '#4c566a', '7': '#1e293b',
  'C': '#7dd3fc', 'L': '#86efac', 'E': '#f87171'
}

const termBaseTemplate = [
  "00000000000000000000000000000000",
  "00000000000000000000000000000000",
  "00000000000000000000000000000000",
  "00000000000000000000000000000000",
  "00000011111111111111111111000000",
  "00001111111111111111111111140000",
  "00001111111111111111111111140000",
  "00001222222222222222222222214000",
  "00001222222222222222222222214000",
  "00001222222222222222222222214000",
  "00001222222222222222222222214000",
  "00001222222222222222222222214000",
  "00001222222222222222222222214000",
  "00001222222222222222222222214000",
  "00001222222222222222222222214000",
  "00001222222222222222222222214000",
  "00001222222222222222222222214000",
  "00001111111111111111111111140000",
  "000011111111111E1111111111140000",
  "00000011111111111111111111400000",
  "00000000000006666660000000000000",
  "00000000000006666660000000000000",
  "00000000000555555555500000000000",
  "00000000005555555555550000000000",
  "00000000007777777777770000000000",
  "00000000000000000000000000000000",
  "00000000000000000000000000000000",
  "00000000000000000000000000000000",
  "00000000000000000000000000000000",
  "00000000000000000000000000000000",
  "00000000000000000000000000000000",
  "00000000000000000000000000000000"
]

const screens: Record<string, string[]> = {}
function buildScreen(arr: {r: number, s: string}[]) {
  let res = []
  for(let i=0; i<10; i++) res.push("2222222222222222222222")
  for(let item of arr) res[item.r] = item.s
  return res
}

screens.cursor = buildScreen([
  {r: 2, s: "2233222222222222222222"}, {r: 3, s: "2222332222222222222222"},
  {r: 4, s: "2222223322222222222222"}, {r: 5, s: "2222332222222222222222"},
  {r: 6, s: "2233222223333322222222"}
])
screens.cursorOff = buildScreen([])
screens.scrolling = buildScreen([
  {r: 2, s: "2332223322233222222222"}, {r: 3, s: "2233222332223322222222"},
  {r: 4, s: "2223322233222332222222"}, {r: 5, s: "2233222332223322222222"},
  {r: 6, s: "2332223322233222222222"}
])
screens.zzz = buildScreen([
  {r: 2, s: "2233333222222222222222"}, {r: 3, s: "2222233223333222222222"},
  {r: 4, s: "2222332222233223333222"}, {r: 5, s: "2223322222332222233222"},
  {r: 6, s: "2233333223333222332222"}, {r: 7, s: "2222222222222223333222"}
])
screens.question = buildScreen([
  {r: 1, s: "2223322233322233222222"}, {r: 2, s: "2223223322233223222222"},
  {r: 3, s: "2223222222233223222222"}, {r: 4, s: "2223222223322223222222"},
  {r: 5, s: "2223222222222223222222"}, {r: 6, s: "2223322223322233222222"}
])
screens.code = buildScreen([
  {r: 2, s: "222C22C2222222222C22C2"}, {r: 3, s: "22C22C222222222222C22C"},
  {r: 4, s: "2C22C22222222222222C22"}, {r: 5, s: "22C22C222222222222C22C"},
  {r: 6, s: "222C22C2222222222C22C2"}
])
screens.life = buildScreen([{r: 3, s: "22222L222L222222222222"}, {r: 4, s: "222L222L22222222222222"}])
screens.error = buildScreen([
  {r: 1, s: "222222222E22E222222222"}, {r: 2, s: "222222222EE2EE22222222"},
  {r: 3, s: "222222222EE2EE22222222"}, {r: 4, s: "222222222E22E222222222"},
  {r: 6, s: "222222222E22E222222222"}
])
screens.crtLine = buildScreen([{r: 4, s: "3333333333333333333333"}])
screens.crtDot = buildScreen([{r: 4, s: "2222222222332222222222"}])

let isCursorOn = true

function getMatrixScreen() {
  let rainScreen = []
  for(let r=0; r<10; r++){
    let rowStr = ""
    for(let c=0; c<22; c++){
      let pos = (rainCols[c] + Math.floor(Date.now() / 150)) % 15
      if (pos === r) rowStr += "3"
      else if (pos - 1 === r || pos - 2 === r) rowStr += "L"
      else rowStr += "2"
    }
    rainScreen.push(rowStr)
  }
  return rainScreen
}

function getEQScreen() {
  if (!analyser || !dataArray) return screens['cursor']
  analyser.getByteFrequencyData(dataArray)
  
  let eqScreen = []
  for (let r = 0; r < 10; r++) {
    let rowStr = ""
    for (let c = 0; c < 11; c++) {
      const value = dataArray[c * 2] || 0
      const height = Math.ceil(value / 25.5) 
      if (10 - r <= height) rowStr += "33"
      else rowStr += "22"
    }
    eqScreen.push(rowStr)
  }
  return eqScreen
}

function drawFrame() {
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, 128, 128)
  
  let activeScreen = currentContext.value
  let forceGreen = false

  if (crtState.value !== 'on') {
    if (crtState.value === 'line') activeScreen = 'crtLine'
    else if (crtState.value === 'dot') activeScreen = 'crtDot'
    else activeScreen = 'cursorOff'
  }
  else if (audioStore.isPlaying) {
    activeScreen = 'eq'
  }
  else if (isTyping.value) {
    activeScreen = 'typing'
  }
  else if (isHovered.value) {
    activeScreen = 'question'
  } else if (isScrolling.value) {
    activeScreen = 'scrolling'
  } else if (isDeepIdle.value) {
    activeScreen = 'matrix'
    forceGreen = true
  } else if (isIdle.value) {
    activeScreen = 'zzz'
  } else {
    if (currentContext.value === 'cursor' && !isCursorOn) activeScreen = 'cursorOff'
  }

  let screenData
  if (activeScreen === 'typing') screenData = typingGibberish
  else if (activeScreen === 'matrix') screenData = getMatrixScreen()
  else if (activeScreen === 'eq') screenData = getEQScreen()
  else screenData = screens[activeScreen] || screens['cursor']

  for (let y = 0; y < 32; y++) {
    let rowStr = termBaseTemplate[y]
    if (y >= 7 && y <= 16) {
      rowStr = rowStr.substring(0, 5) + screenData[y-7] + rowStr.substring(27)
    }
    for (let x = 0; x < 32; x++) {
      let code = rowStr[x]
      if (forceGreen && code === '3') code = 'L' 
      if (code !== '0') {
        ctx.fillStyle = palette[code] as string
        ctx.fillRect(x * 4, y * 4, 4, 4) // 32x32 fills 128x128 canvas
      }
    }
  }

  if (crtState.value === 'off') {
    canvas.style.filter = `drop-shadow(0 15px 25px rgba(0, 0, 0, 0.5))`
    canvas.style.transform = `translateY(4px) scaleY(0.95)`
    return
  }

  canvas.style.transform = ``

  let glowColor = 'rgba(212, 163, 115, 0.4)'
  if (currentContext.value === 'code') glowColor = 'rgba(125, 211, 252, 0.5)'
  if (currentContext.value === 'life') glowColor = 'rgba(134, 239, 172, 0.5)'
  if (currentContext.value === 'error') glowColor = 'rgba(248, 113, 113, 0.5)'
  if (forceGreen) glowColor = 'rgba(134, 239, 172, 0.6)'
  if (audioStore.isPlaying) glowColor = 'rgba(212, 163, 115, 0.7)'
  
  if (isHovered.value || isTyping.value || audioStore.isPlaying || terminal.isOpen) {
    canvas.style.filter = `drop-shadow(0 20px 30px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 25px ${glowColor})`
  } else {
    canvas.style.filter = `drop-shadow(0 15px 25px rgba(0, 0, 0, 0.5)) drop-shadow(0 0 10px ${glowColor.replace(/0\.[4567]\)$/, '0.1)')})`
  }
}

let intervalId: number

onMounted(() => {
  if (audioRef.value) {
    audioStore.bindAudio(audioRef.value)
  }

  drawFrame()

  let blinkCounter = 0
  intervalId = window.setInterval(() => {
    blinkCounter += 150
    if (blinkCounter >= 600) {
      isCursorOn = Math.random() > 0.4
      blinkCounter = 0
    }
    drawFrame()
  }, 150)

  window.addEventListener('scroll', updateScroll, { passive: true })
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('mousemove', handleMouseMove, { passive: true })
  resetIdle()
})

onBeforeUnmount(() => {
  if (scrollTimeout) clearTimeout(scrollTimeout)
  if (idleTimeout) clearTimeout(idleTimeout)
  if (deepIdleTimeout) clearTimeout(deepIdleTimeout)
  if (typingTimeout) clearTimeout(typingTimeout)
  
  window.clearInterval(intervalId)
  window.removeEventListener('scroll', updateScroll)
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('mousemove', handleMouseMove)
  
  if (audioCtx && audioCtx.state !== 'closed') {
    audioCtx.close()
  }
})
</script>

<template>
  <Transition name="fade-slide" appear>
    <div 
      class="zen-mascot-wrapper" 
      :class="{ 'is-dragging': isDragging }"
      :style="pos.x !== -1 ? { left: pos.x + 'px', top: pos.y + 'px', right: 'auto', bottom: 'auto' } : {}"
      @mousedown.left="onDragStart"
      @click="toggleMusic"
      @dblclick="handleDoubleClick" 
      @contextmenu.prevent="handleRightClick"
      @mouseenter="isHovered = true; drawFrame()"
      @mouseleave="isHovered = false; drawFrame()"
      aria-label="拖拽移动，播放音乐或双击打开终端"
    >
      <audio ref="audioRef" :src="'/' + audioStore.currentTrack.file" @ended="audioStore.next" preload="auto" autoplay crossorigin="anonymous"></audio>

      <!-- Command Hub Popup -->
      <div class="cmd-palette" :class="{ 'opacity-100 translate-y-0': isHovered, 'opacity-0 translate-y-2': !isHovered }">
        <span class="text-accent animate-pulse">❯</span> {{ audioStore.currentTrack.title }} <br/>
        Drag: Move | Click: <span v-if="audioStore.isPlaying">Pause</span><span v-else>Play</span> | DblClick: Terminal
      </div>
      
      <canvas ref="canvasRef" class="pixel-mascot"></canvas>
    </div>
  </Transition>
</template>

<style scoped>
.zen-mascot-wrapper {
  position: fixed;
  bottom: 2.5rem;
  right: 2.5rem;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  z-index: 50;
  user-select: none;
}

.zen-mascot-wrapper.is-dragging {
  cursor: grabbing;
}

canvas.pixel-mascot {
  image-rendering: pixelated;
  width: 96px;
  height: 96px;
  transition: filter 0.4s ease, transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  animation: float 4s ease-in-out infinite;
}

.zen-mascot-wrapper:hover canvas.pixel-mascot {
  transform: translateY(-4px) scale(1.05);
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.cmd-palette {
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-surface, rgba(18, 26, 40, 0.9));
  backdrop-filter: blur(8px);
  color: var(--color-text-main, #e2e8f0);
  font-size: 0.75rem;
  padding: 8px 16px;
  border-radius: 8px;
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  white-space: nowrap;
  border: 1px solid var(--color-border-glow, rgba(212, 163, 115, 0.35));
  box-shadow: 0 10px 20px rgba(0,0,0,0.5);
  font-family: monospace;
}

/* Visibility Transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(30px) scale(0.8);
}
</style>
