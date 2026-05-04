import { apiClient } from './client'
import type { ArticleDetail } from './articles'

export interface GenerateDraftInput {
  prompt: string
  tone?: 'technical' | 'casual' | 'poetic' | 'narrative'
  length?: 'short' | 'medium' | 'long'
}

export async function generateAiDraft(input: GenerateDraftInput) {
  const { data } = await apiClient.post<ArticleDetail>('/admin/ai/drafts', input)
  return data
}
