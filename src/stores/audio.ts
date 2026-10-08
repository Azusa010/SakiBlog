import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAudioStore = defineStore('audio', () => {
  const audioEl = ref<HTMLAudioElement | null>(null)
  
  const playlist = [
    { title: "A Stream with Bright Fish", file: "A Stream with Bright Fish.mp3" },
    { title: "Late October", file: "Late October.mp3" },
    { title: "The Silver Ball", file: "The Silver Ball.mp3" },
    { title: "Against the Sky", file: "Against the Sky.mp3" },
    { title: "Lost in the Humming Air", file: "Lost in the Humming Air.mp3" },
    { title: "Dark Eyed Sister", file: "Dark Eyed Sister.mp3" },
    { title: "Their Memories", file: "Their Memories.mp3" },
    { title: "The Pearl", file: "The Pearl.mp3" },
    { title: "Foreshadowed", file: "Foreshadowed.mp3" },
    { title: "An Echo of Night", file: "An Echo of Night.mp3" },
    { title: "Still Return", file: "Still Return.mp3" }
  ]
  const currentTrackIndex = ref(0)
  const isPlaying = ref(false)
  const volume = ref(0.6) // 60% default

  const currentTrack = computed(() => playlist[currentTrackIndex.value])

  function bindAudio(el: HTMLAudioElement) {
    audioEl.value = el
    audioEl.value.volume = volume.value
    audioEl.value.onended = () => next()
    audioEl.value.onplay = () => isPlaying.value = true
    audioEl.value.onpause = () => isPlaying.value = false
    
    // Attempt autoplay if required by user rules
    audioEl.value.play().catch(() => {
      isPlaying.value = false
      console.warn("Autoplay prevented by browser, waiting for user interaction...")
      
      const unlockAudio = () => {
        if (audioEl.value && !isPlaying.value) {
          audioEl.value.play().then(() => {
            document.removeEventListener('click', unlockAudio)
            document.removeEventListener('keydown', unlockAudio)
          }).catch(() => {})
        }
      }
      
      document.addEventListener('click', unlockAudio)
      document.addEventListener('keydown', unlockAudio)
    })
  }

  function play() {
    audioEl.value?.play()
  }

  function pause() {
    audioEl.value?.pause()
  }

  function toggle() {
    if (isPlaying.value) pause()
    else play()
  }

  function next() {
    currentTrackIndex.value = (currentTrackIndex.value + 1) % playlist.length
    if (audioEl.value) {
      audioEl.value.src = '/' + currentTrack.value.file
      audioEl.value.play().catch(() => {})
    }
  }

  function prev() {
    currentTrackIndex.value = (currentTrackIndex.value - 1 + playlist.length) % playlist.length
    if (audioEl.value) {
      audioEl.value.src = '/' + currentTrack.value.file
      audioEl.value.play().catch(() => {})
    }
  }

  function setVolume(v: number) {
    volume.value = Math.max(0, Math.min(1, v))
    if (audioEl.value) {
      audioEl.value.volume = volume.value
    }
  }

  return {
    audioEl,
    playlist,
    currentTrackIndex,
    currentTrack,
    isPlaying,
    volume,
    bindAudio,
    play,
    pause,
    toggle,
    next,
    prev,
    setVolume
  }
})
