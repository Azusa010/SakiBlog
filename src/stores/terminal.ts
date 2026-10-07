import { ref } from 'vue'
import { defineStore } from 'pinia'

/**
 * 禅意交互终端状态机 (Zen Terminal Store)
 * 全局管理交互式命令行控制台的打开/关闭与全局快捷键调度。
 */
export const useTerminalStore = defineStore('terminal', () => {
  const isOpen = ref(false)
  const pendingCommand = ref<string | null>(null)

  function open(command?: string) {
    if (command) {
      pendingCommand.value = command
    }
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
    pendingCommand.value = null
  }

  function toggle() {
    isOpen.value = !isOpen.value
  }

  function consumePendingCommand(): string | null {
    const cmd = pendingCommand.value
    pendingCommand.value = null
    return cmd
  }

  return {
    isOpen,
    pendingCommand,
    open,
    close,
    toggle,
    consumePendingCommand,
  }
})
