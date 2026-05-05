import { apiClient } from './client'

/**
 * 评论类型 —— 跟后端 Comment model + AdminCommentsController.list include 对齐。
 * authorEmail / ipAddress 只 admin 端可见。
 */
export type CommentStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface AdminComment {
  id: string
  articleId: string
  parentId: string | null
  authorName: string
  authorEmail: string
  content: string
  status: CommentStatus
  ipAddress: string | null
  createdAt: string
  updatedAt: string
  article: { id: string; title: string; slug: string }
}

export interface PaginatedComments {
  data: AdminComment[]
  meta: { page: number; pageSize: number; total: number; totalPages: number }
}

export async function fetchComments(
  query: { page?: number; pageSize?: number; status?: CommentStatus } = {},
) {
  const { data } = await apiClient.get<PaginatedComments>('/admin/comments', { params: query })
  return data
}

export async function updateCommentStatus(id: string, status: CommentStatus) {
  const { data } = await apiClient.patch<AdminComment>(
    `/admin/comments/${id}/status`,
    { status },
  )
  return data
}

export async function deleteComment(id: string) {
  await apiClient.delete(`/admin/comments/${id}`)
}
