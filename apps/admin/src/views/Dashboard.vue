<template>
  <!--
    /dashboard —— 后台仪表盘(V1.8 接 /admin/stats/overview):
    · 顶部欢迎卡 + 待办提示(PENDING 评论 / 草稿)
    · 7 个核心指标:文章 / 评论 / 用户 / 字数 / 今日
    · 下面分两栏:近期文章 + 待审评论
  -->
  <AdminShell active="dashboard">
    <div class="stack">
      <header class="card hero">
        <div class="mono kicker">{{ greeting }}</div>
        <div class="kicker-rule" />
        <h1 class="cn hero-title">{{ heroLine }}</h1>
        <p v-if="todoLine" class="cn hero-todo">{{ todoLine }}</p>
      </header>

      <div class="metrics">
        <div v-for="m in metricCards" :key="m.label" class="card metric">
          <div class="mono metric-label">{{ m.label }}</div>
          <div class="serif metric-value">{{ m.value }}</div>
          <div v-if="m.hint" class="metric-delta">{{ m.hint }}</div>
        </div>
      </div>

      <div class="split">
        <section class="card recent-card">
          <div class="mono section-kicker">RECENT ARTICLES</div>
          <div v-for="(a, i) in recent" :key="a.id" class="row" :class="{ first: i === 0 }">
            <span class="mono row-action" :class="{ accent: a.status === 'PUBLISHED' }">{{ a.status }}</span>
            <RouterLink :to="`/editor/${a.id}`" class="cn row-title">{{ a.title }}</RouterLink>
            <span class="mono row-time">{{ formatDate(a.updatedAt) }}</span>
          </div>
          <div v-if="recent.length === 0" class="empty-state">
            <div class="empty-icon">✎</div>
            <p class="cn">还没有文章</p>
            <RouterLink to="/editor" class="link">新建一篇 →</RouterLink>
          </div>
        </section>

        <section class="card review-card">
          <div class="mono section-kicker accent">✦ PENDING REVIEW</div>
          <div v-if="stats && stats.comments.pending > 0" class="placeholder">
            <p class="cn pending-line"><strong>{{ stats.comments.pending }}</strong> 条评论等你审。</p>
            <RouterLink to="/comments" class="link">前往审核 →</RouterLink>
          </div>
          <div v-else class="placeholder empty-state">
            <div class="empty-icon">✓</div>
            <p class="cn">收件箱清空。</p>
            <p class="hint mono">TODAY · {{ stats?.today.commented ?? 0 }} 条新评论 · {{ stats?.today.published ?? 0 }} 篇新文</p>
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
import { fetchStatsOverview, type StatsOverview } from '../api/stats'
import { fetchSettings, type SiteSettings } from '../api/settings'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return 'GOOD NIGHT'
  if (h < 12) return 'GOOD MORNING'
  if (h < 18) return 'GOOD AFTERNOON'
  return 'GOOD EVENING'
})

const stats = ref<StatsOverview | null>(null)
const recent = ref<ArticleSummary[]>([])
// V1.21:欢迎语用站点名(SiteSetting.title),而不是登录用户名
// —— 单作者博客场景下"欢迎,YouRen"比"欢迎,admin"更自然
const settings = ref<SiteSettings | null>(null)

const heroLine = computed(() => {
  const name = settings.value?.title || auth.user?.username || 'YouRen'
  return `欢迎,${name}。`
})

const todoLine = computed(() => {
  if (!stats.value) return ''
  const parts: string[] = []
  if (stats.value.articles.draft > 0) parts.push(`${stats.value.articles.draft} 篇草稿在写`)
  if (stats.value.comments.pending > 0) parts.push(`${stats.value.comments.pending} 条评论待审`)
  if (parts.length === 0) return '收件箱空了。今天写一篇?'
  return parts.join(' · ')
})

const metricCards = computed(() => {
  if (!stats.value) return []
  const s = stats.value
  return [
    { label: 'PUBLISHED',  value: s.articles.published, hint: `共 ${s.articles.total} 篇` },
    { label: 'DRAFT',      value: s.articles.draft,     hint: s.articles.archived ? `归档 ${s.articles.archived}` : '' },
    { label: 'COMMENTS',   value: s.comments.approved,  hint: s.comments.pending ? `待审 ${s.comments.pending}` : '' },
    { label: 'USERS',      value: s.users.total,        hint: '注册用户' },
    { label: 'WORDS',      value: formatBigNum(s.content.totalChars), hint: '总字数' },
    { label: 'TODAY · PUB',value: s.today.published,    hint: '今日发布' },
    { label: 'TODAY · ✉',  value: s.today.commented,    hint: '今日评论' },
  ]
})

onMounted(async () => {
  try {
    const [overview, recentRes, siteSettings] = await Promise.all([
      fetchStatsOverview().catch(() => null),
      listArticles({ pageSize: 5 }),
      fetchSettings().catch(() => null),
    ])
    stats.value = overview
    recent.value = recentRes.data
    settings.value = siteSettings
  } catch {
    /* dashboard 失败不阻塞页面 */
  }
})

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

/** 1234 → "1.2K";仪表盘瞥一眼用 */
function formatBigNum(n: number): string {
  if (n < 1000) return String(n)
  if (n < 10000) return `${(n / 1000).toFixed(1)}K`
  if (n < 1_000_000) return `${Math.round(n / 1000)}K`
  return `${(n / 1_000_000).toFixed(1)}M`
}
</script>

<style scoped>
.stack { display: flex; flex-direction: column; gap: 20px; }
.card { background: var(--card); border-radius: 16px; box-shadow: var(--shadow); }

.hero { padding: 32px 36px; }
.kicker { font-size: 10px; letter-spacing: 0.18em; color: var(--ink-3); }
.kicker-rule { width: 18px; height: 1px; background: var(--ink-3); margin: 4px 0 14px; }
.hero-title { font-size: 30px; font-weight: 600; margin: 0; color: var(--ink); }
.hero-todo { font-size: 13px; color: var(--ink-2); margin: 10px 0 0; }

.metrics {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
}
.metric { border-radius: 14px; padding: 18px 18px; }
.metric-label { font-size: 9px; letter-spacing: 0.14em; color: var(--ink-3); margin-bottom: 6px; }
.metric-value { font-size: 26px; font-weight: 600; color: var(--ink); letter-spacing: -0.02em; line-height: 1.1; }
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
.placeholder .cn { font-size: 14px; color: var(--ink-2); margin: 4px 0 12px; }
.placeholder strong { color: var(--accent); font-weight: 600; }
.placeholder .hint { font-size: 10px; color: var(--ink-3); margin-top: 8px; letter-spacing: 0.14em; }

/* PENDING REVIEW + RECENT ARTICLES 两张卡的空状态:都占满高度 + 内容居中 */
.review-card,
.recent-card {
  display: flex;
  flex-direction: column;
}
.review-card .placeholder,
.recent-card .empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px 24px 32px;
  gap: 8px;
}
.empty-icon {
  font-size: 28px;
  width: 56px;
  height: 56px;
  border-radius: 999px;
  background: rgba(107,122,90,0.12);
  color: var(--accent);
  display: grid;
  place-items: center;
  margin-bottom: 8px;
}
.empty-state .cn {
  font-size: 14px;
  color: var(--ink-2);
  margin: 0;
}
.empty-state .link {
  margin-top: 4px;
  font-size: 12px;
}
.pending-line { font-size: 16px; }
.link { color: var(--accent); font-size: 12px; text-decoration: none; }
.link:hover { text-decoration: underline; }

@media (max-width: 1100px) {
  .metrics { grid-template-columns: repeat(4, 1fr); }
  .split { grid-template-columns: 1fr; }
}
@media (max-width: 700px) {
  .metrics { grid-template-columns: repeat(2, 1fr); }
  .row { grid-template-columns: 60px 1fr 70px; padding: 12px 18px; }
}
@media (max-width: 480px) {
  .hero { padding: 22px 22px; }
  .hero-title { font-size: 22px; }
  .metric-value { font-size: 22px; }
}
</style>
