// 公开评论 composable。
// 设计:
// - 列出 APPROVED 评论(后端会过滤,前端只关心展示)
// - 提交评论,返回 PENDING hint(不在列表里直接显示,需要管理员审核)
// - email 必填但响应中永远不返回(后端 publicCommentSelect 已 select 排除)

export interface PublicComment {
  id: string
  parentId: string | null
  authorName: string
  content: string
  createdAt: string
}

export interface PaginatedComments {
  data: PublicComment[]
  meta: { page: number; pageSize: number; total: number; totalPages: number }
}

export interface CreateCommentInput {
  authorName: string
  authorEmail: string
  content: string
  parentId?: string
}

export interface CreateCommentResponse extends PublicComment {
  pending: true
  message: string
}

function apiUrl(path: string): string {
  const base = useRuntimeConfig().public.apiBase
  return `${base}${path}`
}

export function useArticleComments(slug: string) {
  return useFetch<PaginatedComments>(apiUrl(`/articles/${slug}/comments`), {
    key: `comments-${slug}`,
    default: () => ({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    }),
  })
}

export async function submitComment(slug: string, input: CreateCommentInput) {
  return await $fetch<CreateCommentResponse>(apiUrl(`/articles/${slug}/comments`), {
    method: 'POST',
    body: input,
  })
}
