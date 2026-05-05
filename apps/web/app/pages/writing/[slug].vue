<template>
  <!--
    /writing/[slug] —— 文章详情(V1-08 接 NestJS):
    · 顶部 kicker:法国共和历月份 + 短分隔线
    · 标题 + 摘要 + meta(阅读时长 / 字数 / 日期 / 分类 / 标签)
    · hero ink-art 封面(seed 从 id 派生)
    · 正文用 markdown-it 渲染
    · 404 时跳到自定义 not-found
  -->
  <article v-if="article" class="page">
    <div class="kicker mono">{{ frenchSeason(article.publishedAt) }}</div>
    <div class="kicker-rule" />

    <h1 class="cn title">{{ article.title }}</h1>
    <p v-if="article.summary" class="cn subtitle">{{ article.summary }}</p>

    <div class="meta mono">
      <span>◷ {{ readingTime(article.content) }}</span>
      <span>≣ {{ article.content.length }} 字</span>
      <span>✎ {{ shortDate(article.publishedAt) }}</span>
      <NuxtLink v-if="article.category" :to="`/categories/${article.category.slug}`" class="meta-link">
        ◐ {{ article.category.name }}
      </NuxtLink>
    </div>

    <div class="hero">
      <InkArt :seed="seedFromId(article.id)" />
    </div>

    <div v-if="article.tags.length > 0" class="tags-row mono">
      <NuxtLink v-for="t in article.tags" :key="t.tag.id" :to="`/tags/${t.tag.slug}`" class="tag">
        #{{ t.tag.name }}
      </NuxtLink>
    </div>

    <div class="prose cn" v-html="renderedContent" />

    <NuxtLink to="/writing" class="back mono">← 返回写作目录</NuxtLink>
  </article>

  <!-- 评论区独立 section,出文章卡片范围,不让 max-width 720 限制重复嵌套 -->
  <CommentSection v-if="article" :slug="slug" />

  <article v-else-if="error" class="page error-page">
    <div class="kicker mono">404</div>
    <h1 class="cn title">没有这篇文章</h1>
    <p class="cn lede">可能文章被下线了,或者 URL 拼错了。</p>
    <NuxtLink to="/writing" class="back mono">← 看看其他文章</NuxtLink>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'
import InkArt from '../../components/InkArt.vue'
import CommentSection from '../../components/CommentSection.vue'
import { useArticleBySlug } from '../../composables/useArticles'
import { frenchSeason, readingTime, seedFromId, shortDate } from '../../utils/format'

const route = useRoute()
const slug = route.params.slug as string

const { data: article, error } = await useArticleBySlug(slug)

// markdown-it 在 SSR 和 CSR 都能跑;不开 html(防 XSS),开链接和列表
const md = new MarkdownIt({ html: false, linkify: true, breaks: false })
const renderedContent = computed(() => (article.value ? md.render(article.value.content) : ''))

useSeoMeta({
  title: () => (article.value ? `${article.value.title} · YouRen` : '文章不存在'),
  description: () => article.value?.summary ?? '',
  ogType: 'article',
  ogTitle: () => article.value?.title ?? '',
  ogDescription: () => article.value?.summary ?? '',
})

if (error.value) {
  // 让 Nuxt 给 404 状态码,有利于 SEO
  throw createError({ statusCode: 404, statusMessage: 'Article not found' })
}
</script>

<style scoped>
.page {
  max-width: 720px;
  margin: 0 auto;
  padding: 60px 32px 80px;
}

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
  margin: 0 0 14px;
  color: var(--ink);
  letter-spacing: -0.01em;
  line-height: 1.25;
}

.subtitle {
  font-size: 16px;
  color: var(--ink-2);
  margin: 0 0 20px;
  line-height: 1.6;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  font-size: 10px;
  letter-spacing: 0.12em;
  color: var(--ink-3);
  margin-bottom: 36px;
}
.meta-link { color: var(--ink-3); text-decoration: none; }
.meta-link:hover { color: var(--accent); }

.hero {
  margin-bottom: 32px;
  background: var(--ink);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  justify-content: center;
}

.tags-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 32px;
  font-size: 10px;
  letter-spacing: 0.14em;
}
.tag {
  color: var(--ink-3);
  text-decoration: none;
  padding: 4px 10px;
  background: var(--bg);
  border-radius: 6px;
}
.tag:hover { color: var(--accent); }

.prose :deep(p) { margin: 0 0 18px; line-height: 1.85; font-size: 16px; color: var(--ink); }
.prose :deep(h2) { font-size: 22px; font-weight: 600; margin: 36px 0 16px; color: var(--ink); }
.prose :deep(h3) { font-size: 18px; font-weight: 600; margin: 28px 0 12px; color: var(--ink); }
.prose :deep(blockquote) {
  border-left: 2px solid var(--accent);
  padding-left: 16px;
  margin: 24px 0;
  color: var(--ink-2);
  font-style: italic;
}
.prose :deep(code) {
  background: var(--bg);
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 13px;
  color: var(--ink);
  font-family: 'JetBrains Mono', monospace;
}
.prose :deep(pre) {
  background: var(--ink);
  color: var(--bg);
  padding: 16px 18px;
  border-radius: 10px;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.6;
  margin: 20px 0;
}
.prose :deep(pre code) { background: transparent; color: inherit; padding: 0; }
.prose :deep(ul), .prose :deep(ol) { padding-left: 24px; margin: 0 0 18px; line-height: 1.85; }
.prose :deep(a) { color: var(--accent); text-decoration: none; }
.prose :deep(a:hover) { text-decoration: underline; }

.back {
  display: inline-block;
  margin-top: 48px;
  font-size: 10px;
  letter-spacing: 0.16em;
  color: var(--ink-3);
  text-decoration: none;
}
.back:hover { color: var(--ink); }

.error-page { text-align: center; padding-top: 120px; }
.lede { font-size: 13px; color: var(--ink-2); margin-bottom: 32px; }
</style>
