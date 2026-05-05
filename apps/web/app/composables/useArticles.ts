// 公开接口的 composables。Nuxt 自动按文件名导入,不需要 import。
//
// 设计原则:
// - 只读公开数据,不需要鉴权,不存 token
// - 用 useFetch / $fetch + runtimeConfig.public.apiBase
// - 类型与后端 PublicService.publicArticleSelect 对齐(没有 status 字段,因为永远是 PUBLISHED)

export interface PublicArticle {
  id: string
  title: string
  slug: string
  summary: string | null
  cover: string | null
  publishedAt: string
  category: { id: string; name: string; slug: string } | null
  tags: { tag: { id: string; name: string; slug: string } }[]
  // V1.19:后端 _count.comments 只统计 APPROVED,展示用
  _count?: { comments: number }
}

export interface PublicArticleDetail extends PublicArticle {
  content: string
  author: { id: string; username: string }
}

export interface PaginatedArticles {
  data: PublicArticle[]
  meta: { page: number; pageSize: number; total: number; totalPages: number }
}

function apiUrl(path: string): string {
  const base = useRuntimeConfig().public.apiBase
  return `${base}${path}`
}

export function useArticleList(query: { page?: number; pageSize?: number } = {}) {
  return useFetch<PaginatedArticles>(apiUrl('/articles'), {
    query,
    key: `articles-${query.page ?? 1}-${query.pageSize ?? 20}`,
  })
}

export function useArticleBySlug(slug: string) {
  return useFetch<PublicArticleDetail>(apiUrl(`/articles/${slug}`), {
    key: `article-${slug}`,
  })
}

// V1.20:相关文章。后端按 categoryId 取最新 3 篇,空数组合法。
export interface RelatedArticle {
  id: string
  title: string
  slug: string
  summary: string | null
  publishedAt: string | null
}
export function useRelatedArticles(slug: string) {
  return useFetch<RelatedArticle[]>(apiUrl(`/articles/${slug}/related`), {
    key: `related-${slug}`,
  })
}

export function useArticlesByCategory(slug: string, query: { page?: number; pageSize?: number } = {}) {
  return useFetch<PaginatedArticles>(apiUrl(`/categories/${slug}/articles`), {
    query,
    key: `cat-${slug}-${query.page ?? 1}`,
  })
}

export function useArticlesByTag(slug: string, query: { page?: number; pageSize?: number } = {}) {
  return useFetch<PaginatedArticles>(apiUrl(`/tags/${slug}/articles`), {
    query,
    key: `tag-${slug}-${query.page ?? 1}`,
  })
}

// V1.13:全文搜索
export interface SearchHit {
  id: string
  title: string
  slug: string
  summary: string | null
  cover: string | null
  publishedAt: string | null
  score: number
}
export interface SearchResponse {
  data: SearchHit[]
  q: string
}

/**
 * 客户端式搜索:用 $fetch 而非 useFetch,因为 q 频繁变化时
 * useFetch 的 key cache 容易失效又重新挂请求,直接 $fetch 更可控。
 * 服务端渲染场景:在 page setup 里 await 一下即可。
 */
export async function searchArticles(q: string): Promise<SearchResponse> {
  if (!q.trim()) return { data: [], q: '' }
  return await $fetch<SearchResponse>(apiUrl('/search'), { query: { q } })
}
