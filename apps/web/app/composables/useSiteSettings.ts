// 公开站点配置 composable。
//
// 设计:
// - 走 useFetch + key,SSR / client 共享同一份数据
// - default 提供首次加载(或 API 不可用)时的兜底文案,避免空白
// - 后端 GET /settings 是 @Public(),无需 token
//
// 用法(组件 setup):
//   const { data: settings } = await useSiteSettings()
//   <h1>{{ settings.title }}</h1>

export interface PublicSiteSettings {
  title: string
  tagline: string
  icp: string
}

const FALLBACK: PublicSiteSettings = {
  title: 'YouRen',
  tagline: 'An element-soul who writes.',
  icp: '萌 ICP 备 20253545 号',
}

export function useSiteSettings() {
  const base = useRuntimeConfig().public.apiBase
  return useFetch<PublicSiteSettings>(`${base}/settings`, {
    key: 'site-settings',
    default: () => ({ ...FALLBACK }),
    // 站点配置变化频率极低,客户端不需要每次刷新都打 API
    server: true,
    lazy: false,
  })
}
