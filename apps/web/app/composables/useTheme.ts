/**
 * useTheme —— 全站共享的亮/暗主题开关。
 *
 * 职责：维护一个响应式的 `dark` 标记，把它同步到 <html> 的 `.dark` 类上，
 *   并把用户选择持久化到 localStorage。
 * 数据来源：客户端 localStorage（key 为 `theme`）；SSR 阶段默认走亮色。
 * 副作用：`dark` 改变时会修改 `document.documentElement.classList`；
 *   仅在客户端读写 `localStorage`。
 *
 * 说明：用 vue 的 ref 做模块级单例，避免依赖 Nuxt auto-import 类型。
 */
import { ref } from 'vue'

const STORAGE_KEY = 'theme'

// 用 typeof window 判断而非 import.meta.client，绕开 Nuxt 类型未就绪时的报错。
const isClient = typeof window !== 'undefined'

// 模块级单例 ref：所有组件共享同一份状态。
const dark = ref<boolean>(false)
let hydrated = false

export function useTheme() {
  // 仅客户端首次调用时从 localStorage 同步一次。
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
