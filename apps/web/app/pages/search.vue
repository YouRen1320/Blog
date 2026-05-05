<template>
  <article class="page">
    <header class="head">
      <div class="mono kicker">SEARCH</div>
      <div class="kicker-rule" />
      <h1 class="cn title">{{ headline }}</h1>
    </header>

    <form class="search-form" @submit.prevent="onSubmit">
      <input
        ref="inputRef"
        v-model="q"
        class="search-input"
        type="search"
        placeholder="搜索标题 / 摘要 / 正文..."
        autocomplete="off"
      />
      <button class="search-btn mono" type="submit" :disabled="!q.trim()">→</button>
    </form>

    <div v-if="loading" class="muted">搜索中…</div>

    <ul v-else-if="results.length > 0" class="hits">
      <li v-for="hit in results" :key="hit.id" class="hit">
        <NuxtLink :to="`/writing/${hit.slug}`" class="hit-link">
          <h3 class="cn hit-title" v-html="highlight(hit.title)" />
          <p v-if="hit.summary" class="cn hit-summary" v-html="highlight(hit.summary)" />
          <div class="mono hit-meta">
            <span v-if="hit.publishedAt">{{ shortDate(hit.publishedAt) }}</span>
            <span class="hit-score">SCORE {{ hit.score }}</span>
          </div>
        </NuxtLink>
      </li>
    </ul>

    <div v-else-if="searched" class="muted">
      没有找到匹配的文章。试试其他关键词?
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { searchArticles, type SearchHit } from '../composables/useArticles'
import { shortDate } from '../utils/format'

const route = useRoute()
const router = useRouter()

const q = ref<string>(typeof route.query.q === 'string' ? route.query.q : '')
const results = ref<SearchHit[]>([])
const loading = ref(false)
const searched = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

const headline = computed(() => {
  if (searched.value && results.value.length > 0) return `共 ${results.value.length} 条结果`
  if (searched.value && q.value) return `没有结果`
  return '搜索'
})

useSeoMeta({
  title: () => (q.value ? `搜索 "${q.value}" · YouRen` : '搜索 · YouRen'),
})

async function runSearch(query: string) {
  if (!query.trim()) {
    results.value = []
    searched.value = false
    return
  }
  loading.value = true
  try {
    const res = await searchArticles(query)
    results.value = res.data
    searched.value = true
  } finally {
    loading.value = false
  }
}

async function onSubmit() {
  // 把 q 同步到 URL,刷新 / 分享有 deeplink
  await router.replace({ path: '/search', query: { q: q.value } })
  await runSearch(q.value)
}

onMounted(async () => {
  if (q.value) await runSearch(q.value)
  inputRef.value?.focus()
})

/**
 * 命中关键词高亮 —— 简单 escape + 大小写无关替换。
 * 不用复杂 fuzzy,中文用户大多直接搜词,小写英文用户也能命中。
 */
function highlight(text: string | null): string {
  if (!text) return ''
  const escapeHtml = (s: string) => s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  const safe = escapeHtml(text)
  if (!q.value.trim()) return safe
  const escaped = q.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return safe.replace(new RegExp(escaped, 'gi'), (m) => `<mark>${m}</mark>`)
}
</script>

<style scoped>
.page {
  max-width: 720px;
  margin: 0 auto;
  padding: 60px 32px 80px;
}
.head { margin-bottom: 28px; }
.kicker { font-size: 9px; letter-spacing: 0.18em; color: var(--ink-3); margin-bottom: 6px; }
.kicker-rule { width: 24px; height: 1px; background: var(--ink-3); margin-bottom: 22px; }
.title { font-size: 32px; font-weight: 600; margin: 0; color: var(--ink); }

.search-form {
  display: flex;
  gap: 8px;
  margin-bottom: 32px;
}
.search-input {
  flex: 1;
  padding: 14px 18px;
  background: var(--card);
  border: 1px solid var(--rule);
  border-radius: 12px;
  font-size: 15px;
  color: var(--ink);
  outline: none;
  font-family: inherit;
}
.search-input:focus { border-color: var(--accent); }
.search-btn {
  padding: 0 20px;
  background: var(--ink);
  color: var(--bg);
  border: 0;
  border-radius: 12px;
  font-size: 14px;
  cursor: pointer;
}
.search-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.muted { color: var(--ink-3); font-size: 13px; padding: 16px 0; }

.hits { list-style: none; padding: 0; margin: 0; }
.hit { border-top: 1px solid var(--rule); padding: 18px 0; }
.hit:first-child { border-top: 0; }
.hit-link { text-decoration: none; display: block; }
.hit-title { font-size: 18px; font-weight: 500; margin: 0 0 6px; color: var(--ink); }
.hit-link:hover .hit-title { color: var(--accent); }
.hit-summary { font-size: 13px; color: var(--ink-2); line-height: 1.65; margin: 0 0 6px; }
.hit-meta { display: flex; gap: 12px; font-size: 10px; color: var(--ink-3); letter-spacing: 0.12em; }
.hit-score { color: var(--accent); }

:deep(mark) {
  background: var(--accent);
  color: var(--bg);
  padding: 0 2px;
  border-radius: 2px;
}

@media (max-width: 720px) {
  .page { padding: 36px 20px 60px; }
  .title { font-size: 24px; }
}
</style>
