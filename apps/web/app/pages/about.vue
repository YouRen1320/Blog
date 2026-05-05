<template>
  <!--
    /about —— v3 chlo.is mood,V1.9 起内容由后台 admin Settings 编辑(Markdown)。
    aboutMarkdown 空时显示一段默认 fallback,非空走 markdown-it 渲染。
  -->
  <article class="page">
    <header class="head">
      <div class="mono kicker">ABOUT · {{ settings.title }}</div>
      <div class="kicker-rule" />
      <h1 class="cn title">关于</h1>
      <p class="cn lede">{{ settings.tagline }}</p>
    </header>

    <div v-if="hasCustom" class="prose cn" v-html="renderedAbout" />

    <div v-else class="prose cn fallback">
      <p>
        这是一个 vibe coding 的全栈博客项目 —— 从空仓库开始,做完前后端 + 移动端 + AI 内容生产 + 部署上线。
      </p>
      <p>
        如果你是博主,可以登入 admin /settings · 填一段 Markdown 替换这里。
      </p>
    </div>
  </article>
</template>

<script setup lang="ts">
import MarkdownIt from 'markdown-it'

const { data: settings } = await useSiteSettings()

// markdown-it 同 [slug].vue:不开 html(防 XSS)+ linkify
const md = new MarkdownIt({ html: false, linkify: true, breaks: false })
const hasCustom = computed(() => !!settings.value?.aboutMarkdown?.trim())
const renderedAbout = computed(() =>
  hasCustom.value ? md.render(settings.value!.aboutMarkdown) : '',
)

useSeoMeta({
  title: () => `关于 · ${settings.value?.title ?? 'YouRen'}`,
  description: () => settings.value?.tagline ?? '',
})
</script>

<style scoped>
.page {
  max-width: 720px;
  margin: 0 auto;
  padding: 60px 32px 80px;
}

.head { margin-bottom: 36px; }
.kicker { font-size: 9px; letter-spacing: 0.18em; color: var(--ink-3); margin-bottom: 6px; }
.kicker-rule { width: 24px; height: 1px; background: var(--ink-3); margin-bottom: 22px; }
.title { font-size: 36px; font-weight: 600; margin: 0; color: var(--ink); letter-spacing: -0.01em; }
.lede { font-size: 15px; color: var(--ink-2); margin: 14px 0 0; }

.prose { font-size: 16px; line-height: 1.85; color: var(--ink); }
.prose.fallback { color: var(--ink-3); font-style: italic; }
.prose :deep(p) { margin: 0 0 18px; line-height: 1.85; }
.prose :deep(h2) {
  font-size: 22px; font-weight: 600;
  margin: 36px 0 14px;
  color: var(--ink);
  border-bottom: 1px solid var(--rule);
  padding-bottom: 8px;
}
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
  font-family: var(--mono, ui-monospace, monospace);
}
.prose :deep(pre) {
  background: var(--ink); color: var(--bg);
  padding: 16px 18px; border-radius: 10px;
  overflow-x: auto; font-size: 13px; line-height: 1.6;
  margin: 20px 0;
}
.prose :deep(pre code) { background: transparent; color: inherit; padding: 0; }
.prose :deep(ul), .prose :deep(ol) { padding-left: 24px; margin: 0 0 18px; line-height: 1.85; }
.prose :deep(a) { color: var(--accent); text-decoration: none; }
.prose :deep(a:hover) { text-decoration: underline; }
.prose :deep(img) { max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0; }

@media (max-width: 720px) {
  .page { padding: 36px 20px 60px; }
  .title { font-size: 28px; }
  .prose :deep(p) { font-size: 15px; }
  .prose :deep(h2) { font-size: 20px; margin: 28px 0 12px; }
}
</style>
