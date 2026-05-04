<template>
  <!--
    /dashboard —— 仪表盘(V1-07 接真 API):
    · 顶部欢迎卡 + 草稿待办数
    · 4 个核心指标:已发布 / 草稿 / 分类 / 标签
    · 下面分两栏:近期文章 + AI 收件箱占位(V4 接)
    AI 收件箱当前是占位卡,V4 起接 ai-service 草稿队列。
  -->
  <AdminShell active="dashboard">
    <div class="stack">
      <header class="card hero">
        <div class="mono kicker">{{ greeting }}</div>
        <div class="kicker-rule" />
        <h1 class="cn hero-title">{{ heroLine }}</h1>
      </header>

      <div class="metrics">
        <div v-for="m in metrics" :key="m.label" class="card metric">
          <div class="mono metric-label">{{ m.label.toUpperCase() }}</div>
          <div class="serif metric-value">{{ m.value }}</div>
          <div class="metric-delta">{{ m.hint }}</div>
        </div>
      </div>

      <div class="split">
        <section class="card">
          <div class="mono section-kicker">RECENT ARTICLES</div>
          <div v-for="(a, i) in recent" :key="a.id" class="row" :class="{ first: i === 0 }">
            <span class="mono row-action" :class="{ accent: a.status === 'PUBLISHED' }">{{ a.status }}</span>
            <RouterLink :to="`/editor/${a.id}`" class="cn row-title">{{ a.title }}</RouterLink>
            <span class="mono row-time">{{ formatDate(a.updatedAt) }}</span>
          </div>
          <div v-if="recent.length === 0" class="row first empty">
            <span class="mono">还没有文章。<RouterLink to="/editor">新建一篇 →</RouterLink></span>
          </div>
        </section>

        <section class="card">
          <div class="mono section-kicker accent">✦ AI INBOX · COMING IN V4</div>
          <div class="placeholder">
            <p class="cn">AI 草稿生产链路在 V4 接入。</p>
            <p class="hint mono">FLUTTER → NESTJS → AI SERVICE → DRAFT</p>
          </div>
        </section>
      </div>
    </div>
  </AdminShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AdminShell from '../components/AdminShell.vue'
import { listArticles, type ArticleSummary } from '../api/articles'
import { listCategories } from '../api/categories'
import { listTags } from '../api/tags'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return 'GOOD NIGHT'
  if (h < 12) return 'GOOD MORNING'
  if (h < 18) return 'GOOD AFTERNOON'
  return 'GOOD EVENING'
})

const draftsTotal = ref(0)
const publishedTotal = ref(0)
const categoriesTotal = ref(0)
const tagsTotal = ref(0)
const recent = ref<ArticleSummary[]>([])

const heroLine = computed(() => {
  if (draftsTotal.value === 0) return `欢迎,${auth.user?.username ?? 'admin'}。准备好开始写了吗?`
  return `有 ${draftsTotal.value} 篇草稿在等你。`
})

const metrics = computed(() => [
  { label: '已发布', value: publishedTotal.value, hint: `${draftsTotal.value} 篇草稿` },
  { label: '草稿', value: draftsTotal.value, hint: 'V4 起含 AI 生成' },
  { label: '分类', value: categoriesTotal.value, hint: '后台管理' },
  { label: '标签', value: tagsTotal.value, hint: '复用率高' },
])

onMounted(async () => {
  try {
    const [drafts, pub, recentRes, cats, tags] = await Promise.all([
      listArticles({ status: 'DRAFT', pageSize: 1 }),
      listArticles({ status: 'PUBLISHED', pageSize: 1 }),
      listArticles({ pageSize: 5 }),
      listCategories(),
      listTags(),
    ])
    draftsTotal.value = drafts.meta.total
    publishedTotal.value = pub.meta.total
    recent.value = recentRes.data
    categoriesTotal.value = cats.length
    tagsTotal.value = tags.length
  } catch {
    /* dashboard 失败不阻塞页面 */
  }
})

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
</script>

<style scoped>
.stack { display: flex; flex-direction: column; gap: 20px; }
.card { background: var(--card); border-radius: 16px; box-shadow: var(--shadow); }

.hero { padding: 32px 36px; }
.kicker { font-size: 10px; letter-spacing: 0.18em; color: var(--ink-3); }
.kicker-rule { width: 18px; height: 1px; background: var(--ink-3); margin: 4px 0 14px; }
.hero-title { font-size: 30px; font-weight: 600; margin: 0; color: var(--ink); }

.metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.metric { border-radius: 14px; padding: 20px 22px; }
.metric-label { font-size: 9px; letter-spacing: 0.16em; color: var(--ink-3); margin-bottom: 8px; }
.metric-value { font-size: 32px; font-weight: 600; color: var(--ink); letter-spacing: -0.02em; }
.metric-delta { font-size: 11px; color: var(--accent); margin-top: 4px; }

.split { display: grid; grid-template-columns: 1.4fr 1fr; gap: 16px; }
.section-kicker { font-size: 10px; letter-spacing: 0.16em; color: var(--ink-3); margin-bottom: 14px; padding: 24px 28px 0; }
.section-kicker.accent { color: var(--accent); padding: 24px 24px 0; }

.row { display: grid; grid-template-columns: 90px 1fr 90px; gap: 14px; padding: 12px 28px; border-top: 1px solid var(--rule); align-items: baseline; }
.row.first { border-top: 0; }
.row.empty { padding-bottom: 24px; color: var(--ink-3); }
.row-action { font-size: 10px; letter-spacing: 0.1em; color: var(--ink-3); }
.row-action.accent { color: var(--accent); }
.row-title { font-size: 14px; font-weight: 500; color: var(--ink); text-decoration: none; }
.row-title:hover { color: var(--accent); }
.row-time { font-size: 10px; color: var(--ink-3); text-align: right; }

.placeholder { padding: 0 24px 24px; }
.placeholder .cn { font-size: 13px; color: var(--ink-2); margin-top: 8px; }
.placeholder .hint { font-size: 10px; color: var(--ink-3); margin-top: 8px; letter-spacing: 0.14em; }

@media (max-width: 1100px) { .metrics { grid-template-columns: repeat(2, 1fr); } .split { grid-template-columns: 1fr; } }
</style>
