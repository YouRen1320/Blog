import { apiClient } from './client'

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  createdAt: string
  updatedAt: string
  _count?: { articles: number }
}

export interface CategoryInput {
  name: string
  slug?: string
  description?: string
}

export async function listCategories() {
  const { data } = await apiClient.get<Category[]>('/admin/categories')
  return data
}

export async function createCategory(input: CategoryInput) {
  const { data } = await apiClient.post<Category>('/admin/categories', input)
  return data
}

export async function updateCategory(id: string, input: Partial<CategoryInput>) {
  const { data } = await apiClient.patch<Category>(`/admin/categories/${id}`, input)
  return data
}

export async function deleteCategory(id: string) {
  await apiClient.delete(`/admin/categories/${id}`)
}
