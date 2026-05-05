<template>
  <!--
    /categories/[slug] —— 某分类下的已发布文章列表。
    复用 /writing 的"年份分组"展示风格。
  -->
  <section class="page">
    <header class="head">
      <NuxtLink to="/writing" class="back mono">← 全部文章</NuxtLink>
      <div class="mono kicker">CATEGORY · {{ data?.meta.total ?? 0 }} 篇</div>
      <div class="kicker-rule" />
      <h1 class="cn title">{{ slug }}</h1>
    </header>

    <div v-if="status === 'pending'" class="empty mono">LOADING…</div>
    <div v-else-if="error" class="empty mono error">{{ error.message }}</div>
    <div v-else-if="(data?.meta.total ?? 0) === 0" class="empty mono">这个分类下还没有文章。</div>

    <ol v-else class="list">
      <li v-for="post in data?.data" :key="post.id" class="row">
        <span class="mono row-date">{{ monthDay(post.publishedAt) }}</span>
        <NuxtLink :to="`/writing/${post.slug}`" class="cn row-title">{{ post.title }}</NuxtLink>
        <span class="mono row-month">{{ frenchSeason(post.publishedAt) }}</span>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { useArticlesByCategory } from '../../composables/useArticles'
import { frenchSeason, monthDay } from '../../utils/format'

const route = useRoute()
const slug = route.params.slug as string

const { data, status, error } = await useArticlesByCategory(slug, { pageSize: 100 })

useSeoMeta({
  title: `分类 · ${slug} · YouRen`,
  description: `「${slug}」分类下的所有已发布文章。`,
})

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: 'Category not found' })
}
</script>

<style scoped>
.page { max-width: 720px; margin: 0 auto; padding: 60px 32px 80px; }
.head { margin-bottom: 48px; }
.back { display: inline-block; font-size: 10px; letter-spacing: 0.16em; color: var(--ink-3); text-decoration: none; margin-bottom: 24px; }
.back:hover { color: var(--ink); }
.kicker { font-size: 9px; letter-spacing: 0.18em; color: var(--ink-3); margin-bottom: 6px; }
.kicker-rule { width: 24px; height: 1px; background: var(--ink-3); margin-bottom: 22px; }
.title { font-size: 36px; font-weight: 600; margin: 0; color: var(--ink); letter-spacing: -0.01em; }

.empty { text-align: center; padding: 60px 0; color: var(--ink-3); letter-spacing: 0.16em; font-size: 11px; }
.empty.error { color: #c0392b; }

.list { list-style: none; padding: 0; margin: 0; }
.row { display: grid; grid-template-columns: 64px 1fr 100px; gap: 18px; align-items: baseline; padding: 12px 0; border-top: 1px solid var(--rule); }
.row:first-of-type { border-top: 0; }
.row-date { font-size: 11px; color: var(--ink-3); }
.row-title { font-size: 16px; color: var(--ink); text-decoration: none; font-weight: 500; }
.row-title:hover { color: var(--accent); }
.row-month { font-size: 9px; letter-spacing: 0.16em; color: var(--ink-3); text-align: right; }

@media (max-width: 720px) {
  .page { padding: 36px 20px 60px; }
  .row { grid-template-columns: 56px 1fr; gap: 12px; }
  .row-month { display: none; }
  .row-title { font-size: 15px; }
}
@media (max-width: 480px) {
  .page { padding: 24px 16px 48px; }
}
</style>
