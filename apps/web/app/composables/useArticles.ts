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
