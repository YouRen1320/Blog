// 后台 axios 实例:
// - baseURL 优先用 VITE_API_BASE_URL(build 时注入)
// - 没设的话,运行时根据当前域名兜底:
//     admin.iyouren.top → https://www.iyouren.top/api
//     其它(本地 dev) → http://localhost:3000
//   这样不需要给生产 build 单独传 build arg,生产/开发同一份镜像
import axios, { type AxiosInstance } from 'axios'

function resolveBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL
  if (envUrl) return envUrl
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('iyouren.top')) {
    return 'https://www.iyouren.top/api'
  }
  return 'http://localhost:3000'
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: resolveBaseUrl(),
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
