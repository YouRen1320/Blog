<template>
  <!--
    /writing —— 已发布文章存档。V1-08 改成从 NestJS 取数据。
    单列 720px,按年份分组;每条只显示标题 + 月份(法国共和历)+ 日期。
  -->
  <section class="page">
    <header class="head">
      <div class="mono kicker">WRITING · {{ totalPosts }} IN TOTAL</div>
      <div class="kicker-rule" />
      <h1 class="cn title">写作</h1>
      <p class="cn lede">这里收录我在博客上公开发布的文章。按年份倒序排列。</p>
    </header>

    <div v-if="status === 'pending'" class="empty mono">LOADING…</div>
    <div v-else-if="error" class="empty mono error">加载失败:{{ error.message }}</div>
    <div v-else-if="totalPosts === 0" class="empty mono">还没有发布的文章。</div>

    <div v-else class="years">
      <section v-for="group in groupedPosts" :key="group.year" class="year-block">
        <h2 class="cn year-title">{{ group.year }}</h2>

        <ol class="list">
          <li v-for="post in group.items" :key="post.slug" class="row">
            <span class="mono row-date">{{ monthDay(post.publishedAt) }}</span>
            <NuxtLink :to="`/writing/${post.slug}`" class="cn row-title">
              {{ post.title }}
            </NuxtLink>
            <span class="mono row-month">{{ frenchSeason(post.publishedAt) }}</span>
          </li>
        </ol>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useArticleList, type PublicArticle } from '../../composables/useArticles'
import { frenchSeason, monthDay } from '../../utils/format'

useSeoMeta({
  title: '写作 · YouRen',
  description: '博客文章存档,按年份排列。',
})

const { data, status, error } = await useArticleList({ pageSize: 100 })

const articles = computed<PublicArticle[]>(() => data.value?.data ?? [])
const totalPosts = computed(() => data.value?.meta.total ?? 0)

const groupedPosts = computed(() => {
  const byYear = new Map<number, PublicArticle[]>()
  for (const a of articles.value) {
    const y = new Date(a.publishedAt).getFullYear()
    if (!byYear.has(y)) byYear.set(y, [])
    byYear.get(y)!.push(a)
  }
  return [...byYear.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, items]) => ({ year, items }))
})
</script>

<style scoped>
.page {
  max-width: 720px;
  margin: 0 auto;
  padding: 60px 32px 0;
}

.head { margin-bottom: 48px; }

.kicker {
  font-size: 9px;
  letter-spacing: 0.18em;
  color: var(--ink-3);
  margin-bottom: 6px;
}

.kicker-rule {
  width: 24px;
  height: 1px;
  background: var(--ink-3);
  margin-bottom: 22px;
}

.title {
  font-size: 36px;
  font-weight: 600;
  margin: 0;
  color: var(--ink);
  letter-spacing: -0.01em;
}

.lede {
  font-size: 14px;
  color: var(--ink-2);
  margin-top: 12px;
  max-width: 520px;
  line-height: 1.7;
}

.empty {
  text-align: center;
  padding: 60px 0;
  color: var(--ink-3);
  letter-spacing: 0.16em;
  font-size: 11px;
}
.empty.error { color: #c0392b; }

.year-block { margin-bottom: 56px; }
.year-title {
  font-size: 18px;
  font-weight: 500;
  color: var(--ink-3);
  margin: 0 0 18px;
  letter-spacing: -0.01em;
}

.list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.row {
  display: grid;
  grid-template-columns: 64px 1fr 100px;
  gap: 18px;
  align-items: baseline;
  padding: 12px 0;
  border-top: 1px solid var(--rule);
}
.row:first-of-type { border-top: 0; }

.row-date {
  font-size: 11px;
  color: var(--ink-3);
}

.row-title {
  font-size: 16px;
  color: var(--ink);
  text-decoration: none;
  font-weight: 500;
}
.row-title:hover { color: var(--accent); }

.row-month {
  font-size: 9px;
  letter-spacing: 0.16em;
  color: var(--ink-3);
  text-align: right;
}

@media (max-width: 720px) {
  .page { padding: 36px 20px 60px; }
  .row { grid-template-columns: 56px 1fr; gap: 12px; }
  .row-month { display: none; }
  .row-title { font-size: 15px; }
}
@media (max-width: 480px) {
  .page { padding: 24px 16px 48px; }
  .row { grid-template-columns: 48px 1fr; }
  .row-date { font-size: 10px; }
}
</style>
