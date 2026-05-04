/**
 * useTheme —— 后台共享亮/暗主题。
 *
 * 与 apps/web 中 useTheme 行为一致：localStorage 持久化 + 给 <html> 切 .dark。
 * 用模块级 ref 做单例，所有组件共享一份状态。
 */
import { ref } from 'vue'

const STORAGE_KEY = 'theme'
const isClient = typeof window !== 'undefined'

const dark = ref<boolean>(false)
let hydrated = false

export function useTheme() {
  if (isClient && !hydrated) {
    hydrated = true
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === 'dark') {
      dark.value = true
      document.documentElement.classList.add('dark')
    }
  }

  function apply(next: boolean) {
    dark.value = next
    if (isClient) {
      document.documentElement.classList.toggle('dark', next)
      window.localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light')
    }
  }

  return {
    dark,
    toggle: () => apply(!dark.value),
    setDark: (v: boolean) => apply(v),
  }
}
