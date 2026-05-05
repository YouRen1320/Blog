import { apiClient } from './client'

/**
 * 站点配置类型 —— 跟后端 SiteSetting model 对齐。
 * 改这里时记得同步 apps/api/prisma/schema.prisma 和 update-settings.dto.ts。
 */
export interface SiteSettings {
  id: string
  title: string
  tagline: string
  icp: string
  aboutMarkdown: string
  aiModel: string
  aiThreshold: number
  aiStreaming: boolean
  aiRagRelated: boolean
  jwtHours: number
  requireMfa: boolean
  updatedAt: string
}

export type UpdateSettingsInput = Partial<
  Omit<SiteSettings, 'id' | 'updatedAt'>
>

/** admin 拉完整配置(进入 /settings 页时调一次填充表单) */
export async function fetchSettings() {
  const { data } = await apiClient.get<SiteSettings>('/admin/settings')
  return data
}

/** admin 改配置(只传变更字段)。返回最新完整配置。 */
export async function updateSettings(input: UpdateSettingsInput) {
  const { data } = await apiClient.patch<SiteSettings>('/admin/settings', input)
  return data
}
