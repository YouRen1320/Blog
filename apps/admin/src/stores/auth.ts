// 登录态 store:管理 token 和当前用户。
// - token 持久化到 localStorage,刷新页面不丢登录
// - 提供 login() 和 logout() 高层动作给视图调
// - 路由守卫读 isAuthenticated 决定是否放行
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { AuthUser } from '../api/auth'
import { loginRequest } from '../api/auth'

const TOKEN_KEY = 'blog_admin_token'
const USER_KEY = 'blog_admin_user'

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  // 启动时从 localStorage 水合,避免刷新页面后 store 是 null 而被 guard 误判
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const user = ref<AuthUser | null>(loadUser())

  const isAuthenticated = computed(() => !!token.value)

  /** 登录 / 注册成功后写入会话,Register.vue 也复用这个。 */
  function setSession(accessToken: string, u: AuthUser) {
    token.value = accessToken
    user.value = u
    localStorage.setItem(TOKEN_KEY, accessToken)
    localStorage.setItem(USER_KEY, JSON.stringify(u))
  }

  async function login(email: string, password: string) {
    const res = await loginRequest(email, password)
    setSession(res.accessToken, res.user)
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  return { token, user, isAuthenticated, login, logout, setSession }
})
