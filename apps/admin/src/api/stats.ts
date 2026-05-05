import { apiClient } from './client'

export interface StatsOverview {
  articles: { total: number; published: number; draft: number; archived: number }
  comments: { approved: number; pending: number; rejected: number }
  users: { total: number }
  today: { published: number; commented: number }
  content: { totalChars: number }
}

export async function fetchStatsOverview() {
  const { data } = await apiClient.get<StatsOverview>('/admin/stats/overview')
  return data
}
