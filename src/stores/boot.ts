import { ref } from 'vue'
import { defineStore } from 'pinia'

/**
 * 首屏载入编舞状态:每个浏览器会话只播一次。
 * done 之后 Home 的 hero 为完整态;未 done 且落地页是首页时,
 * 由 Home 播放"未完成态 → 完成"编舞;其他落地页用极简 overlay 兜底。
 */
const STORAGE_KEY = 'sakiblog:booted'

export const useBootStore = defineStore('boot', () => {
  const done = ref(readFlag())

  function finish() {
    if (done.value) return
    try {
      sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* 隐私模式等存储不可用时忽略,仅本次会话内有效 */
    }
    done.value = true
  }

  return { done, finish }
})

function readFlag(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}
