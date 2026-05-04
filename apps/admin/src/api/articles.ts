import { apiClient } from './client'

export type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
export type ArticleSource = 'MANUAL' | 'AI'

export interface ArticleSummary {
  id: string
  title: string
  slug: string
  summary: string | null
  cover: string | null
  status: ArticleStatus
  source: ArticleSource
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  author: { id: string; username: string; email: string }
  category: { id: string; name: string; slug: string } | null
  tags: { tag: { id: string; name: string; slug: string } }[]
}

export interface ArticleDetail extends ArticleSummary {
  content: string
}

export interface PaginatedArticles {
  data: ArticleSummary[]
  meta: { page: number; pageSize: number; total: number; totalPages: number }
}

export interface CreateArticleInput {
  title: string
  slug?: string
  summary?: string
  content: string
  cover?: string
  categoryId?: string
  tagIds?: string[]
}

export type UpdateArticleInput = Partial<CreateArticleInput>

export async function listArticles(
  params: { page?: number; pageSize?: number; status?: ArticleStatus; source?: ArticleSource } = {},
) {
  const { data } = await apiClient.get<PaginatedArticles>('/admin/articles', { params })
  return data
}

export async function getArticle(id: string) {
  const { data } = await apiClient.get<ArticleDetail>(`/admin/articles/${id}`)
  return data
}

export async function createArticle(input: CreateArticleInput) {
  const { data } = await apiClient.post<ArticleDetail>('/admin/articles', input)
  return data
}

export async function updateArticle(id: string, input: UpdateArticleInput) {
  const { data } = await apiClient.patch<ArticleDetail>(`/admin/articles/${id}`, input)
  return data
}

export async function deleteArticle(id: string) {
  await apiClient.delete(`/admin/articles/${id}`)
}

export async function publishArticle(id: string) {
  const { data } = await apiClient.patch<ArticleDetail>(`/admin/articles/${id}/publish`)
  return data
}

export async function unpublishArticle(id: string) {
  const { data } = await apiClient.patch<ArticleDetail>(`/admin/articles/${id}/unpublish`)
  return data
}
