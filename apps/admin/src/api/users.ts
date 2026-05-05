import { apiClient } from './client'

export type UserRole = 'ADMIN' | 'USER'

export interface AdminUserItem {
  id: string
  username: string
  email: string
  role: UserRole
  createdAt: string
  updatedAt: string
  _count: { articles: number }
}

export interface PaginatedUsers {
  data: AdminUserItem[]
  meta: { page: number; pageSize: number; total: number; totalPages: number }
}

export async function fetchUsers(query: { page?: number; pageSize?: number } = {}) {
  const { data } = await apiClient.get<PaginatedUsers>('/admin/users', { params: query })
  return data
}

export async function updateUserRole(id: string, role: UserRole) {
  const { data } = await apiClient.patch<AdminUserItem>(`/admin/users/${id}/role`, { role })
  return data
}

export async function deleteUser(id: string) {
  await apiClient.delete(`/admin/users/${id}`)
}
