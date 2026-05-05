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

/** 批量改 status。一次最多 50 条(后端 DTO 校验)。 */
export async function batchUpdateCommentStatus(ids: string[], status: CommentStatus) {
  const { data } = await apiClient.patch<{ affected: number }>(
    '/admin/comments/batch-status',
    { ids, status },
  )
  return data
}

export async function deleteComment(id: string) {
  await apiClient.delete(`/admin/comments/${id}`)
}

export interface CommentAiReview {
  score: number              // 0-10
  recommend: 'approve' | 'review' | 'reject'
  reason: string             // 30 字以内中文
}

/**
 * 让 LLM 评估一条评论。返回分数 + 建议 + 理由。
 * 不自动 approve/reject,只给 ADMIN 参考。
 * 后端走 ai-service /moderate,LLM 调用一次(吃 ai 档限流 10/min)。
 */
export async function aiReviewComment(id: string) {
  const { data } = await apiClient.post<CommentAiReview>(
    `/admin/comments/${id}/ai-review`,
  )
  return data
}
