// 后台 axios 实例:
// - baseURL 来自 vite 的 VITE_API_BASE_URL
// - 请求拦截器:从 auth store 注入 Authorization 头
// - 响应拦截器:401 时清登录态并跳 /login(token 过期 / 被踢)
import axios, { type AxiosInstance } from 'axios'

export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 15000,
})

// 拦截器在 main.ts 里注入(那时 pinia 已经准备好,可以引 store)
export function installAuthInterceptor(getToken: () => string | null, onUnauthorized: () => void) {
  apiClient.interceptors.request.use((config) => {
    const token = getToken()
    if (token) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  apiClient.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err?.response?.status === 401) {
        onUnauthorized()
      }
      return Promise.reject(err)
    },
  )
}
