/**
 * useTheme —— 全站共享的亮/暗主题开关。
 *
 * 职责：维护一个响应式的 `dark` 标记，把它同步到 <html> 的 `.dark` 类上，
 *   并把用户选择持久化到 localStorage。
 * 数据来源：客户端 localStorage（key 为 `theme`）；SSR 阶段默认走亮色。
 * 副作用：`dark` 改变时会修改 `document.documentElement.classList`；
 *   仅在客户端读写 `localStorage`。
 *
 * 用 Nuxt 的 useState 让 SSR 和 client 共享同一份状态，避免水合闪烁。
 */
const STORAGE_KEY = 'theme'

export function useTheme() {
  const dark = useState<boolean>('theme:dark', () => false)
  const hydrated = useState<boolean>('theme:hydrated', () => false)

  // 仅客户端首次调用时从 localStorage 同步一次。
  if (import.meta.client && !hydrated.value) {
    hydrated.value = true
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === 'dark') {
      dark.value = true
      document.documentElement.classList.add('dark')
    }
  }

  function apply(next: boolean) {
    dark.value = next
    if (import.meta.client) {
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
