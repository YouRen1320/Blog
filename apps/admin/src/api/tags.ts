import { apiClient } from './client'

export interface Tag {
  id: string
  name: string
  slug: string
  createdAt: string
  updatedAt: string
  _count?: { articles: number }
}

export interface TagInput {
  name: string
  slug?: string
}

export async function listTags() {
  const { data } = await apiClient.get<Tag[]>('/admin/tags')
  return data
}

export async function createTag(input: TagInput) {
  const { data } = await apiClient.post<Tag>('/admin/tags', input)
  return data
}

export async function updateTag(id: string, input: Partial<TagInput>) {
  const { data } = await apiClient.patch<Tag>(`/admin/tags/${id}`, input)
  return data
}

export async function deleteTag(id: string) {
  await apiClient.delete(`/admin/tags/${id}`)
}
