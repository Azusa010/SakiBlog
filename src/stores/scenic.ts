import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export interface ScenicInfo {
  index: number
  name: string
  title: string
  chineseTitle: string
  artist: string
  artistLine: string
  location: string
  altitude: string
  elevation: string
  collection: string
  medium: string
  exhibitNo: string
  badge: string
}

export const SCENIC_LIST: ScenicInfo[] = [
  {
    index: 0,
    name: 'Fairy Glen',
    title: 'FAIRY GLEN',
    chineseTitle: '仙女幽谷',
    artist: 'Guillaume.R-B',
    artistLine: 'Artist / Guillaume.R-B',
    location: 'Isle of Skye, Scotland',
    altitude: 'ALT 1850M',
    elevation: '1,850m',
    collection: 'Collection of the Skye Gallery',
    medium: 'Canon EOS · Optical Photography',
    exhibitNo: 'EXHIBIT 01 // 04',
    badge: 'ALT: 1850M · FAIRY GLEN · ISLE OF SKYE (PHOTO: GUILLAUME.R-B)',
  },
  {
    index: 1,
    name: 'Old Man of Storr',
    title: 'OLD MAN OF STORR',
    chineseTitle: '老人峰',
    artist: 'Landscape Photographer',
    artistLine: 'Artist / Nature',
    location: 'Trotternish, Isle of Skye',
    altitude: 'ALT 2160M',
    elevation: '2,160m',
    collection: 'Collection of the Trotternish Gallery',
    medium: 'Unsplash CC0 · Public Archive',
    exhibitNo: 'EXHIBIT 02 // 04',
    badge: 'ALT: 2160M · OLD MAN OF STORR · SKYE (CC0 PHOTO)',
  },
  {
    index: 2,
    name: 'Glen Coe Valley',
    title: 'GLEN COE VALLEY',
    chineseTitle: '格伦科大峡谷',
    artist: 'Gil Cavalcanti',
    artistLine: 'Artist / Gil Cavalcanti',
    location: 'Highlands, Scotland',
    altitude: 'ALT 1140M',
    elevation: '1,140m',
    collection: 'Collection of the Highlands Gallery',
    medium: 'Wikimedia Commons Archive',
    exhibitNo: 'EXHIBIT 03 // 04',
    badge: 'ALT: 1140M · GLEN COE VALLEY · HIGHLANDS (PHOTO: GIL CAVALCANTI)',
  },
  {
    index: 3,
    name: 'Snowy Mountain',
    title: 'SNOWY MOUNTAIN',
    chineseTitle: '内华达雪山',
    artist: 'Albert Bierstadt',
    artistLine: 'Artist / Nature',
    location: 'Smithsonian American Art Museum',
    altitude: 'ALT 4500M',
    elevation: '4,500m',
    collection: 'Collection of the Alpine Gallery',
    medium: 'Oil on Canvas · Google Art Masterpiece',
    exhibitNo: 'EXHIBIT 04 // 04',
    badge: 'ALT: 4500M · SNOWY MOUNTAIN · ALPINE GALLERY',
  },
]

export const useScenicStore = defineStore('scenic', () => {
  // 4个场景的透明度权重 (默认从场景 0 展现)
  const weights = ref<[number, number, number, number]>([1, 0, 0, 0])
  const activeIndex = ref<number>(0)
  const isDimmed = ref<boolean>(false)

  const currentBadge = computed(() => {
    return SCENIC_LIST[activeIndex.value]?.badge ?? SCENIC_LIST[0]!.badge
  })

  const currentScenic = computed<ScenicInfo>(() => {
    return SCENIC_LIST[activeIndex.value] ?? SCENIC_LIST[0]!
  })

  function setScene(index: number) {
    const valid = Math.max(0, Math.min(3, index))
    activeIndex.value = valid
    const newWeights: [number, number, number, number] = [0, 0, 0, 0]
    newWeights[valid] = 1
    weights.value = newWeights
  }

  function nextScene() {
    const next = (activeIndex.value + 1) % SCENIC_LIST.length
    setScene(next)
  }

  function setWeights(w: [number, number, number, number]) {
    weights.value = w
    // 找出权重最高者作为当前主场景
    let maxIdx = 0
    let maxVal = -1
    for (let i = 0; i < 4; i++) {
      const val = w[i] ?? 0
      if (val > maxVal) {
        maxVal = val
        maxIdx = i
      }
    }
    activeIndex.value = maxIdx
  }

  function setDimmed(dim: boolean) {
    isDimmed.value = dim
  }

  return {
    weights,
    activeIndex,
    isDimmed,
    currentBadge,
    currentScenic,
    setScene,
    nextScene,
    setWeights,
    setDimmed,
  }
})
